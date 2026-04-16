/**
 * Protocol-level smoke / light load against the task API.
 *
 * Run locally (k6 required): BASE_URL=http://127.0.0.1:5000 k6 run load-testing/k6/smoke.js
 * CI passes BASE_URL via the load-test workflow (staging or dispatch).
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<800'],
  },
}

const base = (__ENV.BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '')

export default function () {
  const res = http.get(`${base}/api/v1/health`, {
    tags: { name: 'health' },
  })
  check(res, {
    'health status 200': (r) => r.status === 200,
  })
  sleep(0.3)
}
