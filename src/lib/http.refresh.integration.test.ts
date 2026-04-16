import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://api.test',
  isApiMode: () => true,
}))

const refreshMocks = vi.hoisted(() => ({
  getStoredToken: vi.fn(() => 'access-token'),
  setStoredToken: vi.fn(),
  getRefreshToken: vi.fn(() => 'refresh-token'),
  clearSession: vi.fn(),
}))

vi.mock('./jwt', () => ({
  getStoredToken: refreshMocks.getStoredToken,
  setStoredToken: refreshMocks.setStoredToken,
}))

vi.mock('./sessionTokens', () => ({
  getRefreshToken: refreshMocks.getRefreshToken,
  clearSession: refreshMocks.clearSession,
}))

import { apiRequestJson } from './http'

describe('apiRequestJson refresh retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    refreshMocks.getStoredToken.mockReturnValue('access-token')
    refreshMocks.getRefreshToken.mockReturnValue('refresh-token')
    let step = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        step += 1
        if (step === 1) {
          return Promise.resolve(new Response('', { status: 401 }))
        }
        if (step === 2) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                data: { access_token: 'new-access' },
                error: null,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
          )
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: { ok: true },
              error: null,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }),
    )
  })

  it('refreshes on 401 and retries the original request', async () => {
    const data = await apiRequestJson<{ ok: boolean }>('/api/v1/tasks', {
      method: 'GET',
    })
    expect(data).toEqual({ ok: true })
    expect(refreshMocks.setStoredToken).toHaveBeenCalledWith('new-access')
    expect(fetch).toHaveBeenCalledTimes(3)
  })
})
