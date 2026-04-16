import type { SuggestedTool } from './types'

export const SUGGESTED_TOOLS: SuggestedTool[] = [
  {
    id: 'prometheus',
    name: 'Prometheus',
    category: 'metrics',
    description: 'Time-series collection and PromQL queries.',
    role: 'Scrape `/metrics`, store samples, feed Grafana and Alertmanager.',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'dashboards',
    description: 'Dashboards, Explore, and unified alerting.',
    role: 'Visualize Prometheus, Loki, Tempo; annotate deploys; SLO panels.',
  },
  {
    id: 'loki',
    name: 'Grafana Loki',
    category: 'logs',
    description: 'Log aggregation aligned with Prometheus labels.',
    role: 'Inexpensive log storage; pair with Promtail or OTEL logs pipeline.',
  },
  {
    id: 'tempo',
    name: 'Grafana Tempo',
    category: 'tracing',
    description: 'Trace backend optimized for trace IDs and Grafana.',
    role: 'Store OpenTelemetry traces; link traces ↔ logs ↔ metrics.',
  },
  {
    id: 'otel',
    name: 'OpenTelemetry',
    category: 'tracing',
    description: 'Vendor-neutral instrumentation SDKs and collectors.',
    role: 'Emit metrics, traces, and logs from services and browsers.',
  },
  {
    id: 'alertmanager',
    name: 'Prometheus Alertmanager',
    category: 'alerting',
    description: 'Dedupe, route, and silence alerts.',
    role: 'Route to PagerDuty, Opsgenie, Slack with severity policies.',
  },
  {
    id: 'jaeger',
    name: 'Jaeger',
    category: 'tracing',
    description: 'Distributed tracing UI and storage.',
    role: 'Alternative trace backend; great for Kubernetes environments.',
  },
  {
    id: 'victoriametrics',
    name: 'VictoriaMetrics',
    category: 'metrics',
    description: 'Long-term Prometheus-compatible storage.',
    role: 'Drop-in remote_write target with efficient compression.',
  },
]
