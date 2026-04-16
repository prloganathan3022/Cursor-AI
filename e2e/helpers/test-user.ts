import type { Page } from '@playwright/test'

/** Meets app rules: 8+ chars, upper, lower, digit */
export const VALID_PASSWORD = 'TestPass1'

export function uniqueTestEmail(prefix = 'e2e'): string {
  return `${prefix}-${crypto.randomUUID()}@e2e.example.com`
}

export type TestUser = {
  name: string
  email: string
  password: string
}

export function makeTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    name: overrides.name ?? 'E2E User',
    email: overrides.email ?? uniqueTestEmail(),
    password: overrides.password ?? VALID_PASSWORD,
  }
}

/** Register via UI; ends on dashboard when successful */
export async function registerViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register')
  await page.getByTestId('register-name').fill(user.name)
  await page.getByTestId('register-email').fill(user.email)
  await page.getByTestId('register-password').fill(user.password)
  await page.getByTestId('register-confirm').fill(user.password)
  await page.getByTestId('register-submit').click()
  await page.getByTestId('dashboard-heading').waitFor({ state: 'visible' })
}

export async function loginViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')
  await page.getByTestId('login-email').fill(user.email)
  await page.getByTestId('login-password').fill(user.password)
  await page.getByTestId('login-submit').click()
  await page.getByTestId('dashboard-heading').waitFor({ state: 'visible' })
}

export async function addTaskViaUi(
  page: Page,
  title: string,
  description = '',
): Promise<void> {
  await page.getByTestId('task-title-input').fill(title)
  if (description) {
    await page.getByTestId('task-description-input').fill(description)
  }
  await page.getByTestId('task-add-submit').click()
}

export async function expectLoggedOut(page: Page): Promise<void> {
  await page.getByRole('heading', { name: 'Sign in' }).waitFor({
    state: 'visible',
  })
}
