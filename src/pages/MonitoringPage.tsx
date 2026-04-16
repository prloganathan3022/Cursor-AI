import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppShell } from "../components/AppShell";
import { isApiMode } from "../config/api";
import { redSummary, aggregateRoutes } from "../monitoring/aggregateApiMetrics";
import {
  clearClientTelemetry,
  getClientApiMetrics,
  subscribeClientTelemetry,
} from "../monitoring/clientTelemetry";
import {
  buildDemoLogs,
  deriveAlerts,
  initialInfrastructure,
  tickInfrastructure,
} from "../monitoring/demoInfrastructure";
import { SUGGESTED_TOOLS } from "../monitoring/suggestedTools";
import type {
  InfrastructureHealth,
  MonitoringAlert,
} from "../monitoring/types";

const WINDOW_MS = 5 * 60 * 1000;

function useClientMetrics() {
  return useSyncExternalStore(
    subscribeClientTelemetry,
    getClientApiMetrics,
    getClientApiMetrics,
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const w = 120;
  const h = 36;
  if (values.length < 2) {
    return (
      <svg
        className={className}
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden
      >
        <line
          x1={0}
          y1={h / 2}
          x2={w}
          y2={h / 2}
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth={1}
        />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
    >
      <polyline
        fill="none"
        className="stroke-violet-500 dark:stroke-violet-400"
        strokeWidth={1.5}
        points={pts.join(" ")}
      />
    </svg>
  );
}

function StatusPill({ status }: { status: InfrastructureHealth["status"] }) {
  const map = {
    healthy:
      "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300",
    degraded:
      "bg-amber-500/15 text-amber-900 ring-amber-500/35 dark:text-amber-200",
    critical: "bg-red-500/15 text-red-800 ring-red-500/35 dark:text-red-300",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${map[status]}`}
    >
      {status}
    </span>
  );
}

function AlertRow({ alert }: { alert: MonitoringAlert }) {
  const sev =
    alert.severity === "critical"
      ? "border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/40"
      : alert.severity === "warning"
        ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30"
        : "border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/50";
  return (
    <li
      className={`rounded-xl border px-4 py-3 ${sev}`}
      data-testid="monitoring-alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {alert.title}
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {alert.detail}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          {alert.severity}
        </span>
      </div>
    </li>
  );
}

export function MonitoringPage() {
  const rows = useClientMetrics();
  const red = useMemo(() => redSummary(rows, WINDOW_MS), [rows]);
  const routes = useMemo(() => aggregateRoutes(rows, WINDOW_MS), [rows]);

  const [{ infra, cpuSpark }, setInfraAndSpark] = useState(() => ({
    infra: initialInfrastructure(),
    cpuSpark: [] as number[],
  }));
  const tickRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      tickRef.current += 1;
      setInfraAndSpark((prev) => {
        const nextInfra = tickInfrastructure(prev.infra, tickRef.current);
        return {
          infra: nextInfra,
          cpuSpark: [...prev.cpuSpark, nextInfra.cpuPercent].slice(-24),
        };
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const clientErrors = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            r.status === "network" ||
            (typeof r.status === "number" && r.status >= 400),
        )
        .slice(-20)
        .map((r) => ({
          at: r.at,
          message: `${r.method} ${r.path} → ${String(r.status)} (${r.durationMs.toFixed(0)} ms)`,
        })),
    [rows],
  );

  const logs = useMemo(() => buildDemoLogs(clientErrors), [clientErrors]);
  const alerts = useMemo(
    () => deriveAlerts(infra, red.errorRate),
    [infra, red.errorRate],
  );

  const onClear = useCallback(() => {
    clearClientTelemetry();
  }, []);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1
              data-testid="monitoring-heading"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              System monitoring
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Application health (demo baseline), API performance from this
              browser session, and suggested production tooling. Connect{" "}
              <strong className="font-medium text-slate-800 dark:text-slate-200">
                Prometheus
              </strong>{" "}
              scrape targets and{" "}
              <strong className="font-medium text-slate-800 dark:text-slate-200">
                Grafana
              </strong>{" "}
              dashboards to replace synthetic baselines.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={infra.status} />
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Clear client metrics
            </button>
          </div>
        </div>

        <section aria-labelledby="health-heading">
          <h2
            id="health-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Application health
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Simulated process and dependency signals (CPU, memory, heap, DB
            latency). In production, expose these via{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
              /metrics
            </code>{" "}
            for Prometheus.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="CPU"
              value={`${infra.cpuPercent.toFixed(1)}%`}
              subtitle="Process / node pool"
              sparkline={<Sparkline values={cpuSpark} />}
            />
            <MetricCard
              label="Memory"
              value={`${infra.memoryPercent.toFixed(1)}%`}
              subtitle="RSS / cgroup limit"
            />
            <MetricCard
              label="Heap (demo)"
              value={`${infra.heapUsedMb.toFixed(0)} MB`}
              subtitle="Runtime heap"
            />
            <MetricCard
              label="Uptime"
              value={formatUptime(infra.uptimeSeconds)}
              subtitle="Synthetic counter"
            />
            <MetricCard
              label="DB latency"
              value={`${infra.dbLatencyMs.toFixed(0)} ms`}
              subtitle="p95-style gauge"
            />
            <MetricCard
              label="Traffic (demo)"
              value={`${infra.requestsPerSecond.toFixed(0)} rps`}
              subtitle="Synthetic RPS"
            />
            <MetricCard
              label="Server error rate"
              value={`${infra.errorRatePercent.toFixed(2)}%`}
              subtitle="Synthetic 5xx mix"
            />
            <MetricCard
              label="API mode"
              value={isApiMode() ? "On" : "Off"}
              subtitle={
                isApiMode()
                  ? "Client telemetry records API calls"
                  : "Tasks use local storage only"
              }
            />
          </div>
        </section>

        <section aria-labelledby="api-heading">
          <h2
            id="api-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            API performance (RED)
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              Rate
            </strong>
            ,{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              Errors
            </strong>
            ,{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              Duration
            </strong>{" "}
            for requests made by this app in the last five minutes (via{" "}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">
              apiRequestJson
            </code>
            ).
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Rate
              </p>
              <p
                className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white"
                data-testid="red-rate"
              >
                {red.ratePerSec.toFixed(2)} /s
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Errors
              </p>
              <p
                className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white"
                data-testid="red-errors"
              >
                {(red.errorRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Duration (p95)
              </p>
              <p
                className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white"
                data-testid="red-duration"
              >
                {red.p95Ms.toFixed(0)} ms
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    Method
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    Path
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    Requests
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    p50
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    p95
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    p99
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      No API calls in the last five minutes. Use the app with
                      API mode enabled to populate this table.
                    </td>
                  </tr>
                ) : (
                  routes.map((r) => (
                    <tr
                      key={`${r.method}-${r.path}`}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                        {r.method}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {r.path}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                        {r.count}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                        {r.p50Ms.toFixed(0)} ms
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                        {r.p95Ms.toFixed(0)} ms
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                        {r.p99Ms.toFixed(0)} ms
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-700 dark:text-slate-300">
                        {r.errorCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="logs-heading">
          <h2
            id="logs-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Error logging
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Recent client-side failures from this session (plus demo log lines).
            Ship structured JSON logs to{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              Loki
            </strong>{" "}
            or your cloud log platform and correlate with trace IDs.
          </p>
          <ul className="mt-4 space-y-2">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {new Date(log.at).toLocaleTimeString()}
                </span>{" "}
                <span
                  className={
                    log.severity === "error"
                      ? "font-medium text-red-600 dark:text-red-400"
                      : log.severity === "warn"
                        ? "font-medium text-amber-700 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300"
                  }
                >
                  [{log.source}] {log.message}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="alerts-heading">
          <h2
            id="alerts-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Alerts
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Example alert rules: SLO burn rate, saturation, and error spikes.
            Route through{" "}
            <strong className="font-medium text-slate-800 dark:text-slate-200">
              Alertmanager
            </strong>{" "}
            or Grafana Alerting to PagerDuty, Slack, or email.
          </p>
          <ul className="mt-4 space-y-3">
            {alerts.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="tools-heading">
          <h2
            id="tools-heading"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Suggested tools
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Common open-source and vendor-neutral building blocks for metrics,
            dashboards, logs, traces, and alerting.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SUGGESTED_TOOLS.map((tool) => (
              <article
                key={tool.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {tool.name}
                  </h3>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {tool.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {tool.description}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  {tool.role}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  sparkline,
}: {
  label: string;
  value: string;
  subtitle: string;
  sparkline?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
            {subtitle}
          </p>
        </div>
        {sparkline}
      </div>
    </div>
  );
}
