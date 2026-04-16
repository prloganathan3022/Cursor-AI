import { afterEach, describe, expect, it } from 'vitest'
import { createUser, findUserByEmail, verifyCredentials } from './userStorage'

describe('userStorage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('createUser and findUserByEmail round-trip', () => {
    const u = createUser({
      name: 'Ada',
      email: 'Ada@Test.COM',
      password: 'Secret123',
    })
    expect(u.email).toBe('ada@test.com')
    expect(findUserByEmail('ADA@test.com')?.id).toBe(u.id)
  })

  it('createUser rejects duplicate email', () => {
    createUser({ name: 'A', email: 'dup@x.com', password: 'Secret123' })
    expect(() =>
      createUser({ name: 'B', email: 'dup@x.com', password: 'Secret123' }),
    ).toThrow('An account with this email already exists')
  })

  it('verifyCredentials checks password', () => {
    createUser({ name: 'A', email: 'u@x.com', password: 'Secret123' })
    expect(verifyCredentials('u@x.com', 'Secret123')?.email).toBe('u@x.com')
    expect(verifyCredentials('u@x.com', 'wrong')).toBeNull()
    expect(verifyCredentials('missing@x.com', 'x')).toBeNull()
  })
})
