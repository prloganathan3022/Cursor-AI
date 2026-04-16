import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { API_BASE_URL, isApiMode } from '../config/api'
import { ApiError, apiRequestJson } from '../lib/http'
import {
  createAccessToken,
  getStoredToken,
  setStoredToken,
  verifyAccessToken,
} from '../lib/jwt'
import { readServerAccessClaims } from '../lib/serverJwt'
import {
  clearSession,
  getRefreshToken,
  setRefreshToken,
} from '../lib/sessionTokens'
import { createUser, verifyCredentials } from '../lib/userStorage'
import type { JwtPayload } from '../types'

export type AuthUser = {
  id: string
  email: string
}

type AuthPayload = {
  user: { id: number; email: string; name: string; created_at?: string }
  access_token: string
  refresh_token: string
  token_type: string
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>
  register: (input: {
    name: string
    email: string
    password: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function payloadToUser(payload: JwtPayload): AuthUser {
  return { id: payload.sub, email: payload.email }
}

function readUserFromStorage(): AuthUser | null {
  const token = getStoredToken()
  if (!token) return null
  if (isApiMode()) {
    const claims = readServerAccessClaims(token)
    if (!claims) {
      clearSession()
      return null
    }
    return { id: claims.sub, email: claims.email }
  }
  const payload = verifyAccessToken(token)
  if (!payload) {
    setStoredToken(null)
    return null
  }
  return payloadToUser(payload)
}

async function apiLogoutRequest(): Promise<void> {
  if (!isApiMode()) return
  const access = getStoredToken()
  const refresh = getRefreshToken()
  if (!access) return
  try {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
      },
      body: JSON.stringify(refresh ? { refresh_token: refresh } : {}),
    })
  } catch {
    /* still clear client session */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readUserFromStorage())

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (isApiMode()) {
        try {
          const data = await apiRequestJson<AuthPayload>('/api/v1/auth/login', {
            method: 'POST',
            auth: false,
            body: JSON.stringify({ email, password }),
          })
          setStoredToken(data.access_token)
          setRefreshToken(data.refresh_token)
          setUser({ id: String(data.user.id), email: data.user.email })
          return { ok: true }
        } catch (e) {
          const message =
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : 'Login failed. Try again.'
          return { ok: false, message }
        }
      }

      const found = verifyCredentials(email, password)
      if (!found) {
        return { ok: false, message: 'Invalid email or password' }
      }
      const token = createAccessToken(found.id, found.email)
      setStoredToken(token)
      setUser({ id: found.id, email: found.email })
      return { ok: true }
    },
    [],
  )

  const register = useCallback(
    async (input: {
      name: string
      email: string
      password: string
    }): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (isApiMode()) {
        try {
          const data = await apiRequestJson<AuthPayload>(
            '/api/v1/auth/register',
            {
              method: 'POST',
              auth: false,
              body: JSON.stringify({
                name: input.name,
                email: input.email,
                password: input.password,
                confirm_password: input.password,
              }),
            },
          )
          setStoredToken(data.access_token)
          setRefreshToken(data.refresh_token)
          setUser({ id: String(data.user.id), email: data.user.email })
          return { ok: true }
        } catch (e) {
          const message =
            e instanceof ApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : 'Registration failed. Try again.'
          return { ok: false, message }
        }
      }

      try {
        const created = createUser({
          name: input.name,
          email: input.email,
          password: input.password,
        })
        const token = createAccessToken(created.id, created.email)
        setStoredToken(token)
        setUser({ id: created.id, email: created.email })
        return { ok: true }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Registration failed. Try again.'
        return { ok: false, message }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    void apiLogoutRequest().finally(() => {
      clearSession()
      setUser(null)
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
