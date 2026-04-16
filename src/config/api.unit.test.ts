import { afterEach, describe, expect, it, vi } from 'vitest'

describe('config/api', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('isApiMode is false without base URL and proxy', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_DEV_API_PROXY', 'false')
    vi.stubEnv('DEV', true)
    const api = await import('./api')
    expect(api.isApiMode()).toBe(false)
    expect(api.API_BASE_URL).toBe('')
  })

  it('isApiMode is true when base URL is set (trailing slash stripped)', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:5000/')
    vi.stubEnv('VITE_DEV_API_PROXY', 'false')
    vi.stubEnv('DEV', true)
    const api = await import('./api')
    expect(api.isApiMode()).toBe(true)
    expect(api.API_BASE_URL).toBe('http://127.0.0.1:5000')
  })

  it('isApiMode is true in dev when proxy flag is set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_DEV_API_PROXY', 'true')
    vi.stubEnv('DEV', true)
    const api = await import('./api')
    expect(api.isApiMode()).toBe(true)
    expect(api.API_BASE_URL).toBe('')
  })
})
