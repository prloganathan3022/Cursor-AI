import type { ClientApiMetric, RouteAggregate } from "./types";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
  );
  return sorted[idx] ?? 0;
}

function sortDurations(a: number, b: number) {
  return a - b;
}

export function aggregateRoutes(
  rows: readonly ClientApiMetric[],
  windowMs: number,
): RouteAggregate[] {
  const now = Date.now();
  const cutoff = now - windowMs;
  const byKey = new Map<
    string,
    { method: string; path: string; durations: number[]; errors: number }
  >();

  for (const r of rows) {
    if (r.at < cutoff) continue;
    const key = `${r.method}\t${r.path}`;
    let g = byKey.get(key);
    if (!g) {
      g = { method: r.method, path: r.path, durations: [], errors: 0 };
      byKey.set(key, g);
    }
    g.durations.push(r.durationMs);
    if (
      r.status === "network" ||
      (typeof r.status === "number" && r.status >= 400)
    ) {
      g.errors += 1;
    }
  }

  const windowSec = windowMs / 1000;
  const out: RouteAggregate[] = [];
  for (const g of byKey.values()) {
    const sorted = [...g.durations].sort(sortDurations);
    const count = sorted.length;
    out.push({
      path: g.path,
      method: g.method,
      count,
      errorCount: g.errors,
      p50Ms: percentile(sorted, 50),
      p95Ms: percentile(sorted, 95),
      p99Ms: percentile(sorted, 99),
      rps: windowSec > 0 ? count / windowSec : 0,
    });
  }
  return out.sort((a, b) => b.count - a.count);
}

export function redSummary(
  rows: readonly ClientApiMetric[],
  windowMs: number,
): { ratePerSec: number; errorRate: number; p95Ms: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = rows.filter((r) => r.at >= cutoff);
  const windowSec = windowMs / 1000;
  const ratePerSec = windowSec > 0 ? recent.length / windowSec : 0;
  const errors = recent.filter(
    (r) =>
      r.status === "network" ||
      (typeof r.status === "number" && r.status >= 400),
  ).length;
  const errorRate = recent.length > 0 ? errors / recent.length : 0;
  const durs = recent.map((r) => r.durationMs).sort((a, b) => a - b);
  const p95Ms = (() => {
    if (durs.length === 0) return 0;
    const i = Math.min(durs.length - 1, Math.ceil(0.95 * durs.length) - 1);
    return durs[i] ?? 0;
  })();
  return { ratePerSec, errorRate, p95Ms };
}
