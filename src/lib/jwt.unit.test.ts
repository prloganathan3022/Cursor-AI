import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TOKEN_STORAGE_KEY,
  createAccessToken,
  getStoredToken,
  setStoredToken,
  verifyAccessToken,
} from './jwt'

describe('jwt', () => {
  afterEach(() => {
    localStorage.clear()
    vi.useRealTimers()
  })

  it('round-trips a valid token', () => {
    const token = createAccessToken('u1', 'a@b.com')
    const payload = verifyAccessToken(token)
    expect(payload?.sub).toBe('u1')
    expect(payload?.email).toBe('a@b.com')
  })

  it('rejects malformed tokens', () => {
    expect(verifyAccessToken('not-jwt')).toBeNull()
    expect(verifyAccessToken('only.two')).toBeNull()
  })

  it('rejects invalid signature', () => {
    const token = createAccessToken('u1', 'a@b.com')
    const [h, p] = token.split('.')
    expect(verifyAccessToken(`${h}.${p}.tampered`)).toBeNull()
  })

  it('rejects expired token', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const token = createAccessToken('u1', 'a@b.com')
    vi.setSystemTime(new Date('2099-01-01T00:00:00Z'))
    expect(verifyAccessToken(token)).toBeNull()
  })

  it('getStoredToken and setStoredToken manage localStorage', () => {
    expect(getStoredToken()).toBeNull()
    setStoredToken('tok')
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('tok')
    setStoredToken(null)
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })
})
