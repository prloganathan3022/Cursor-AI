import { describe, expect, it, vi } from 'vitest'

vi.mock('../config/api', () => ({
  API_BASE_URL: '',
  isApiMode: () => false,
}))

import { ApiError, apiRequestJson } from './http'

describe('apiRequestJson without API mode', () => {
  it('throws ApiError when API is not configured', async () => {
    const err = await apiRequestJson('/x', { auth: false }).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).message).toBe('API base URL is not configured')
  })
})
