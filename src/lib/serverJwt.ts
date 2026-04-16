/**
 * Read Flask-JWT access token claims without verifying the signature.
 * Authorization still happens on the server; this is only for UI / route guards.
 */
export type ServerAccessClaims = {
  sub: string
  email: string
  exp: number
}

export function readServerAccessClaims(
  token: string,
): ServerAccessClaims | null {
  try {
    const parts = token.split('.')
    const p = parts[1]
    if (!p) return null
    const pad = (4 - (p.length % 4)) % 4
    const base64 = p.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
    const json = JSON.parse(atob(base64)) as Record<string, unknown>
    const sub = json.sub != null ? String(json.sub) : ''
    const email = typeof json.email === 'string' ? json.email : ''
    const exp = typeof json.exp === 'number' ? json.exp : NaN
    if (!sub || !Number.isFinite(exp)) return null
    if (exp * 1000 < Date.now()) return null
    return { sub, email, exp }
  } catch {
    return null
  }
}
