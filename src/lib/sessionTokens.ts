import { getStoredToken, setStoredToken } from './jwt'

export const REFRESH_TOKEN_KEY = 'tm_refresh_token'

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
  else localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearSession(): void {
  setStoredToken(null)
  setRefreshToken(null)
}

export { getStoredToken, setStoredToken }
