import { expect, test } from '@playwright/test'

/**
 * E2E: real browser, real Vite dev server (see playwright.config.ts).
 * Keep these few — they catch routing, bundling, and critical-path UI regressions
 * that unit/integration tests miss. Prefer depth in lower layers for edge cases.
 */
test.describe('Public smoke', () => {
  test('login screen renders', async ({ page }) => {
    await page.goto('/login')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Sign in' }),
    ).toBeVisible()
    await expect(page.getByTestId('login-form')).toBeVisible()
  })
})
