import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { setStoredToken } from '../lib/jwt'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://api.test',
  isApiMode: () => true,
}))

vi.mock('../lib/serverJwt', () => ({
  readServerAccessClaims: vi.fn(() => ({
    sub: '42',
    email: 'api-user@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  })),
}))

describe('ProtectedRoute (API mode)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('allows access when stored token has readable server claims', async () => {
    setStoredToken('header.payload.sig')

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <div data-testid="child">api-secret</div>
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
      expect(screen.getByTestId('child')).toHaveTextContent('api-secret')
    })
  })
})
