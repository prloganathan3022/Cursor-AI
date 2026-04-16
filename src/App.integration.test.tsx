import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createAccessToken, setStoredToken } from './lib/jwt'
import { createUser } from './lib/userStorage'

vi.mock('./config/api', () => ({
  API_BASE_URL: '',
  isApiMode: () => false,
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the dashboard when a demo session exists', async () => {
    const u = createUser({
      name: 'App User',
      email: `app-${crypto.randomUUID()}@t.com`,
      password: 'Secret123',
    })
    setStoredToken(createAccessToken(u.id, u.email))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-heading')).toBeInTheDocument()
    })
  })
})
