import { describe, expect, it } from 'vitest'
import { aggregateRoutes, redSummary } from './aggregateApiMetrics'
import type { ClientApiMetric } from './types'

function row(
  overrides: Partial<ClientApiMetric> & Pick<ClientApiMetric, 'path' | 'durationMs'>,
): ClientApiMetric {
  return {
    id: 'x',
    at: Date.now(),
    method: 'GET',
    status: 200,
    ...overrides,
  }
}

describe('aggregateRoutes', () => {
  it('groups by method and path and computes percentiles', () => {
    const now = Date.now()
    const rows: ClientApiMetric[] = [
      { ...row({ path: '/a', durationMs: 10, at: now }), id: '1' },
      { ...row({ path: '/a', durationMs: 20, at: now }), id: '2' },
      { ...row({ path: '/a', durationMs: 30, at: now }), id: '3' },
      { ...row({ path: '/a', durationMs: 40, at: now }), id: '4' },
      { ...row({ path: '/a', durationMs: 100, at: now }), id: '5' },
    ]
    const agg = aggregateRoutes(rows, 60_000)
    expect(agg).toHaveLength(1)
    expect(agg[0]?.count).toBe(5)
    expect(agg[0]?.p50Ms).toBeGreaterThan(0)
    expect(agg[0]?.errorCount).toBe(0)
  })

  it('counts 4xx as errors', () => {
    const now = Date.now()
    const rows: ClientApiMetric[] = [
      { ...row({ path: '/x', durationMs: 5, status: 200, at: now }), id: '1' },
      { ...row({ path: '/x', durationMs: 5, status: 404, at: now }), id: '2' },
    ]
    const agg = aggregateRoutes(rows, 60_000)
    expect(agg[0]?.errorCount).toBe(1)
  })
})

describe('redSummary', () => {
  it('computes rate and error ratio', () => {
    const now = Date.now()
    const rows: ClientApiMetric[] = [
      { ...row({ path: '/a', durationMs: 10, at: now }), id: '1' },
      { ...row({ path: '/a', durationMs: 10, status: 500, at: now }), id: '2' },
    ]
    const red = redSummary(rows, 60_000)
    expect(red.ratePerSec).toBeGreaterThan(0)
    expect(red.errorRate).toBe(0.5)
  })
})
