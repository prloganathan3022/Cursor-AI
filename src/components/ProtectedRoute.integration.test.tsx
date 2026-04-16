import { render, screen, waitFor } from '@testing-library/react'
import { describe, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { createAccessToken, setStoredToken } from '../lib/jwt'
import { createUser } from '../lib/userStorage'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../config/api', () => ({
  API_BASE_URL: '',
  isApiMode: () => false,
}))

describe('ProtectedRoute (local demo mode)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects to login when there is no session', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <div data-testid="child">secret</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>login-page</div>} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )
    expect(screen.getByText('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('renders children when token and auth context are valid', async () => {
    const u = createUser({
      name: 'T',
      email: `u-${crypto.randomUUID()}@t.com`,
      password: 'Secret123',
    })
    setStoredToken(createAccessToken(u.id, u.email))

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <div data-testid="child">secret</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>login-page</div>} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('child')).toHaveTextContent('secret')
    })
  })
})
