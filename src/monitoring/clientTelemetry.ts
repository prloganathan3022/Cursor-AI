import type { ClientApiMetric } from './types'

const MAX = 200

let seq = 0
const buffer: ClientApiMetric[] = []
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export function subscribeClientTelemetry(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function getClientApiMetrics(): readonly ClientApiMetric[] {
  return buffer
}

export function recordClientApiMetric(
  input: Omit<ClientApiMetric, 'id' | 'at'>,
): void {
  const row: ClientApiMetric = {
    id: `m-${++seq}`,
    at: Date.now(),
    ...input,
  }
  buffer.push(row)
  if (buffer.length > MAX) buffer.splice(0, buffer.length - MAX)
  notify()
}

export function clearClientTelemetry(): void {
  buffer.length = 0
  notify()
}
