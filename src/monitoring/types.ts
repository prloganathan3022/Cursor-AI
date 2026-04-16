export type ClientApiMetric = {
  id: string
  at: number
  method: string
  path: string
  durationMs: number
  status: number | 'network'
}

export type RouteAggregate = {
  path: string
  method: string
  count: number
  errorCount: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  rps: number
}

export type InfrastructureHealth = {
  uptimeSeconds: number
  cpuPercent: number
  memoryPercent: number
  heapUsedMb: number
  requestsPerSecond: number
  errorRatePercent: number
  dbLatencyMs: number
  status: 'healthy' | 'degraded' | 'critical'
}

export type LogSeverity = 'info' | 'warn' | 'error'

export type MonitoringLogEntry = {
  id: string
  at: number
  severity: LogSeverity
  source: string
  message: string
}

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type MonitoringAlert = {
  id: string
  at: number
  severity: AlertSeverity
  title: string
  detail: string
  acknowledged: boolean
}

export type SuggestedTool = {
  id: string
  name: string
  category: 'metrics' | 'dashboards' | 'logs' | 'tracing' | 'alerting' | 'apm'
  description: string
  role: string
}
