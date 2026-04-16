import type {
  InfrastructureHealth,
  MonitoringAlert,
  MonitoringLogEntry,
} from "./types";

/** Deterministic pseudo-random in [0, 1) from integer seed */
function rnd(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function tickInfrastructure(
  prev: InfrastructureHealth,
  tickIndex: number,
): InfrastructureHealth {
  const t = tickIndex;
  const cpu = Math.min(
    98,
    Math.max(5, prev.cpuPercent + (rnd(t) - 0.48) * 6 + Math.sin(t / 12) * 2),
  );
  const memory = Math.min(
    95,
    Math.max(
      20,
      prev.memoryPercent + (rnd(t + 17) - 0.5) * 4 + Math.cos(t / 15) * 1.5,
    ),
  );
  const heap = Math.min(
    512,
    Math.max(48, prev.heapUsedMb + (rnd(t + 3) - 0.45) * 8),
  );
  const rps = Math.max(
    0,
    prev.requestsPerSecond + (rnd(t + 99) - 0.5) * 15 + Math.sin(t / 8) * 5,
  );
  const err = Math.min(
    8,
    Math.max(0, prev.errorRatePercent + (rnd(t + 31) - 0.52) * 1.2),
  );
  const dbMs = Math.min(
    120,
    Math.max(4, prev.dbLatencyMs + (rnd(t + 7) - 0.5) * 6),
  );

  let status: InfrastructureHealth["status"] = "healthy";
  if (cpu > 85 || memory > 88 || err > 3) status = "degraded";
  if (cpu > 94 || err > 6) status = "critical";

  return {
    uptimeSeconds: prev.uptimeSeconds + 2,
    cpuPercent: cpu,
    memoryPercent: memory,
    heapUsedMb: heap,
    requestsPerSecond: rps,
    errorRatePercent: err,
    dbLatencyMs: dbMs,
    status,
  };
}

export function initialInfrastructure(): InfrastructureHealth {
  return {
    uptimeSeconds: 3600 * 24 * 3 + 420,
    cpuPercent: 34,
    memoryPercent: 52,
    heapUsedMb: 186,
    requestsPerSecond: 142,
    errorRatePercent: 0.8,
    dbLatencyMs: 18,
    status: "healthy",
  };
}

const demoLogSeeds: MonitoringLogEntry[] = [
  {
    id: "log-seed-1",
    at: Date.now() - 120_000,
    severity: "info",
    source: "api-gateway",
    message: "Deploy annotation: v1.4.2 marked on all dashboards",
  },
  {
    id: "log-seed-2",
    at: Date.now() - 45_000,
    severity: "warn",
    source: "worker",
    message: "Queue depth above soft threshold (synthetic baseline)",
  },
];

export function buildDemoLogs(
  clientErrors: readonly { at: number; message: string }[],
): MonitoringLogEntry[] {
  const fromClient: MonitoringLogEntry[] = clientErrors.map((e, i) => ({
    id: `log-client-${i}`,
    at: e.at,
    severity: "error" as const,
    source: "browser-client",
    message: e.message,
  }));
  return [...fromClient, ...demoLogSeeds].sort((a, b) => b.at - a.at);
}

export function deriveAlerts(
  infra: InfrastructureHealth,
  clientErrorRate: number,
): MonitoringAlert[] {
  const alerts: MonitoringAlert[] = [
    {
      id: "alert-stack",
      at: Date.now() - 86_400_000,
      severity: "info",
      title: "Observability stack",
      detail:
        "Wire Prometheus scrape targets and Grafana dashboards to replace synthetic baselines.",
      acknowledged: true,
    },
  ];
  if (infra.status === "degraded" || infra.cpuPercent > 80) {
    alerts.unshift({
      id: "alert-cpu",
      at: Date.now(),
      severity: "warning",
      title: "Elevated CPU",
      detail: `CPU at ${infra.cpuPercent.toFixed(1)}% — check hot paths and autoscaling rules.`,
      acknowledged: false,
    });
  }
  if (clientErrorRate > 0.15) {
    alerts.unshift({
      id: "alert-client-errors",
      at: Date.now(),
      severity: "critical",
      title: "High client-side error rate",
      detail:
        "Recent API calls show elevated 4xx/5xx or network failures in this session.",
      acknowledged: false,
    });
  }
  if (infra.errorRatePercent > 4) {
    alerts.unshift({
      id: "alert-server-errors",
      at: Date.now(),
      severity: "critical",
      title: "Server error budget pressure (demo)",
      detail: `Synthetic server error rate ${infra.errorRatePercent.toFixed(1)}%.`,
      acknowledged: false,
    });
  }
  return alerts;
}
