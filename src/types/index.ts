export type User = {
  id: string
  name: string
  email: string
  password: string
}

export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  createdAt: string
}

export type JwtPayload = {
  sub: string
  email: string
  iat: number
  exp: number
}
