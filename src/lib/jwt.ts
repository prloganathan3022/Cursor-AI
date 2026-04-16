import type { JwtPayload } from "../types";

/** Demo-only signing key. A real app must issue tokens from a server. */
const JWT_SECRET = "tm-demo-jwt-secret";

function base64UrlEncodeUtf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecodeToString(part: string): string {
  const pad = (4 - (part.length % 4)) % 4;
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function sign(header: string, payload: string): string {
  const data = `${header}.${payload}.${JWT_SECRET}`;
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return base64UrlEncodeUtf8(String(hash));
}

export function createAccessToken(userId: string, email: string): string {
  const header = base64UrlEncodeUtf8(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncodeUtf8(
    JSON.stringify({
      sub: userId,
      email,
      iat: now,
      exp: now + 7 * 24 * 60 * 60,
    } satisfies JwtPayload),
  );
  const signature = sign(header, payload);
  return `${header}.${payload}.${signature}`;
}

export function verifyAccessToken(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  if (!h || !p || !sig || sign(h, p) !== sig) return null;
  try {
    const raw = base64UrlDecodeToString(p);
    const payload = JSON.parse(raw) as JwtPayload;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string")
      return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

export const TOKEN_STORAGE_KEY = "tm_access_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}
