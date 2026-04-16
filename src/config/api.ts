/**
 * API base URL for `fetch`:
 * - Production / direct mode: set `VITE_API_BASE_URL` (e.g. http://127.0.0.1:5000).
 * - Local dev with proxy (recommended): set `VITE_DEV_API_PROXY=true` and leave
 *   `VITE_API_BASE_URL` empty so requests go to the Vite dev server and are forwarded
 *   to Flask (see `vite.config.ts`). Backend logs still appear in the Flask terminal.
 */
const explicit = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

const useDevProxy =
  import.meta.env.DEV && import.meta.env.VITE_DEV_API_PROXY === 'true'

export const API_BASE_URL = useDevProxy ? '' : explicit.replace(/\/$/, '')

export function isApiMode(): boolean {
  return useDevProxy || explicit.length > 0
}
