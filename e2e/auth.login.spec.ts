import { expect, test } from '@playwright/test'
import {
  loginViaUi,
  makeTestUser,
  registerViaUi,
  VALID_PASSWORD,
} from './helpers/test-user'

test.describe('Login flow', () => {
  test('signs in with valid credentials and reaches the dashboard', async ({
    page,
  }) => {
    const user = makeTestUser()
    await registerViaUi(page, user)

    await page.getByTestId('logout-button').click()
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    await loginViaUi(page, user)

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByTestId('dashboard-heading')).toBeVisible()
  })

  test('navigates between login and register', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('link-register').click()
    await expect(page).toHaveURL(/\/register$/)

    await page.getByTestId('link-login').click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('submitting invalid credentials shows a form-level error', async ({
    page,
  }) => {
    const user = makeTestUser()
    await registerViaUi(page, user)
    await page.getByTestId('logout-button').click()

    await page.getByTestId('login-email').fill(user.email)
    await page.getByTestId('login-password').fill('WrongPass1')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-form-error')).toBeVisible()
    await expect(page.getByTestId('login-form-error')).toContainText(
      'Invalid email or password',
    )
    await expect(page).toHaveURL(/\/login$/)
  })

  test.describe('validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
    })

    test('requires email and password', async ({ page }) => {
      await page.getByTestId('login-submit').click()

      await expect(page.getByTestId('login-email-field-error')).toHaveText(
        'Email is required',
      )
      await expect(page.getByTestId('login-password-field-error')).toHaveText(
        'Password is required',
      )
    })

    test('rejects malformed email on login', async ({ page }) => {
      await page.getByTestId('login-email').fill('bad')
      await page.getByTestId('login-password').fill(VALID_PASSWORD)
      await page.getByTestId('login-submit').click()

      await expect(page.getByTestId('login-email-field-error')).toHaveText(
        'Enter a valid email address',
      )
    })
  })
})
