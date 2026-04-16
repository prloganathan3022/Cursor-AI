const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type RegisterFieldErrors = Partial<{
  name: string
  email: string
  password: string
  confirmPassword: string
}>

export type LoginFieldErrors = Partial<{
  email: string
  password: string
}>

export function validateRegister(values: {
  name: string
  email: string
  password: string
  confirmPassword: string
}): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters'

  const email = values.email.trim().toLowerCase()
  if (!email) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address'

  const { password } = values
  if (!password) errors.password = 'Password is required'
  else if (password.length < 8)
    errors.password = 'Password must be at least 8 characters'
  else if (!/[a-z]/.test(password))
    errors.password = 'Include at least one lowercase letter'
  else if (!/[A-Z]/.test(password))
    errors.password = 'Include at least one uppercase letter'
  else if (!/[0-9]/.test(password))
    errors.password = 'Include at least one number'

  if (!values.confirmPassword)
    errors.confirmPassword = 'Please confirm your password'
  else if (values.confirmPassword !== password)
    errors.confirmPassword = 'Passwords do not match'

  return errors
}

export function validateLogin(values: {
  email: string
  password: string
}): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  const email = values.email.trim().toLowerCase()
  if (!email) errors.email = 'Email is required'
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address'
  if (!values.password) errors.password = 'Password is required'
  return errors
}
