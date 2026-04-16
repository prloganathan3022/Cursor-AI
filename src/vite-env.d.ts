/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** When "true" in dev, `/api` is proxied to Flask; use with empty `VITE_API_BASE_URL`. */
  readonly VITE_DEV_API_PROXY?: string;
}
