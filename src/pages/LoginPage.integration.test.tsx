/**
 * Integration test: React + Router + real AuthProvider/ThemeProvider wiring.
 * Use for form validation integration and client auth flow without standing up Flask.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { createUser } from '../lib/userStorage'
import { LoginPage } from './LoginPage'

vi.mock('../config/api', () => ({
  API_BASE_URL: '',
  isApiMode: () => false,
}))

function renderLogin() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={<div data-testid="post-login">Dashboard</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows inline validation errors', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByTestId('login-submit'))

    expect(
      await screen.findByTestId('login-email-field-error'),
    ).toHaveTextContent('Email is required')
    expect(screen.getByTestId('login-password-field-error')).toHaveTextContent(
      'Password is required',
    )
  })

  it('signs in local demo user and navigates away', async () => {
    createUser({
      name: 'Test',
      email: 'local@example.com',
      password: 'Secret123',
    })

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByTestId('login-email'), 'local@example.com')
    await user.type(screen.getByTestId('login-password'), 'Secret123')
    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('post-login')).toBeInTheDocument()
    })
  })
})
