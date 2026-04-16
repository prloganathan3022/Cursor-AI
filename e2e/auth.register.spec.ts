import { expect, test } from '@playwright/test'
import {
  VALID_PASSWORD,
  makeTestUser,
  registerViaUi,
  uniqueTestEmail,
} from './helpers/test-user'

test.describe('User registration', () => {
  test('creates an account and lands on the task dashboard', async ({
    page,
  }) => {
    const user = makeTestUser({ name: 'New Tester' })

    await page.goto('/register')
    await expect(
      page.getByRole('heading', { name: 'Create account' }),
    ).toBeVisible()

    await page.getByTestId('register-name').fill(user.name)
    await page.getByTestId('register-email').fill(user.email)
    await page.getByTestId('register-password').fill(user.password)
    await page.getByTestId('register-confirm').fill(user.password)
    await page.getByTestId('register-submit').click()

    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByTestId('dashboard-heading')).toBeVisible()
    await expect(page.getByTestId('task-list-empty')).toContainText(
      'No tasks yet',
    )
  })

  test('navigates from login to register via secondary link', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByTestId('link-register').click()
    await expect(page).toHaveURL(/\/register$/)
    await expect(
      page.getByRole('heading', { name: 'Create account' }),
    ).toBeVisible()
  })

  test.describe('validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register')
    })

    test('requires name, email, password, and matching confirmation', async ({
      page,
    }) => {
      await page.getByTestId('register-submit').click()

      await expect(page.getByTestId('register-name-field-error')).toHaveText(
        'Name is required',
      )
      await expect(page.getByTestId('register-email-field-error')).toHaveText(
        'Email is required',
      )
      await expect(
        page.getByTestId('register-password-field-error'),
      ).toHaveText('Password is required')
      await expect(page.getByTestId('register-confirm-field-error')).toHaveText(
        'Please confirm your password',
      )
    })

    test('rejects invalid email format', async ({ page }) => {
      await page.getByTestId('register-name').fill('Valid Name')
      await page.getByTestId('register-email').fill('not-an-email')
      await page.getByTestId('register-password').fill(VALID_PASSWORD)
      await page.getByTestId('register-confirm').fill(VALID_PASSWORD)
      await page.getByTestId('register-submit').click()

      await expect(page.getByTestId('register-email-field-error')).toHaveText(
        'Enter a valid email address',
      )
    })

    test('enforces password complexity rules', async ({ page }) => {
      await page.getByTestId('register-name').fill('Valid Name')
      await page.getByTestId('register-email').fill(uniqueTestEmail())

      await page.getByTestId('register-password').fill('short')
      await page.getByTestId('register-confirm').fill('short')
      await page.getByTestId('register-submit').click()
      await expect(
        page.getByTestId('register-password-field-error'),
      ).toContainText('at least 8 characters')

      await page.getByTestId('register-password').fill('alllower1')
      await page.getByTestId('register-confirm').fill('alllower1')
      await page.getByTestId('register-submit').click()
      await expect(
        page.getByTestId('register-password-field-error'),
      ).toContainText('uppercase letter')

      await page.getByTestId('register-password').fill('ALLUPPER1')
      await page.getByTestId('register-confirm').fill('ALLUPPER1')
      await page.getByTestId('register-submit').click()
      await expect(
        page.getByTestId('register-password-field-error'),
      ).toContainText('lowercase letter')

      await page.getByTestId('register-password').fill('NoDigitAa')
      await page.getByTestId('register-confirm').fill('NoDigitAa')
      await page.getByTestId('register-submit').click()
      await expect(
        page.getByTestId('register-password-field-error'),
      ).toContainText('one number')
    })

    test('requires confirm password to match', async ({ page }) => {
      await page.getByTestId('register-name').fill('Valid Name')
      await page.getByTestId('register-email').fill(uniqueTestEmail())
      await page.getByTestId('register-password').fill(VALID_PASSWORD)
      await page.getByTestId('register-confirm').fill('DifferentPass1')
      await page.getByTestId('register-submit').click()

      await expect(page.getByTestId('register-confirm-field-error')).toHaveText(
        'Passwords do not match',
      )
    })
  })

  test('shows error when email is already registered', async ({ page }) => {
    const user = makeTestUser()
    await registerViaUi(page, user)

    await page.getByTestId('logout-button').click()
    await page.getByTestId('link-register').click()

    await page.getByTestId('register-name').fill('Another')
    await page.getByTestId('register-email').fill(user.email)
    await page.getByTestId('register-password').fill(VALID_PASSWORD)
    await page.getByTestId('register-confirm').fill(VALID_PASSWORD)
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-form-error')).toBeVisible()
    await expect(page.getByTestId('register-form-error')).toContainText(
      'already exists',
    )
    await expect(page).toHaveURL(/\/register$/)
  })
})
