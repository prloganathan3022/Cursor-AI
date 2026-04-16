import { API_BASE_URL, isApiMode } from "../config/api";
import { recordClientApiMetric } from "../monitoring/clientTelemetry";
import { getStoredToken, setStoredToken } from "./jwt";
import { clearSession, getRefreshToken } from "./sessionTokens";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type Envelope<T> = {
  success: boolean;
  data: T;
  error: { code?: string; message?: string; details?: unknown } | null;
};

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  if (!isApiMode()) return false;
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  const body = (await parseJson(res)) as Envelope<{ access_token: string }>;
  if (!res.ok || !body.success || !body.data?.access_token) {
    clearSession();
    return false;
  }
  setStoredToken(body.data.access_token);
  return true;
}

export async function apiRequestJson<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  if (!isApiMode()) {
    throw new ApiError(0, "API base URL is not configured");
  }

  const { auth = true, ...rest } = init;
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (rest.method ?? "GET").toString().toUpperCase();
  const metricPath = path.startsWith("/") ? path : `/${path}`;
  let retried = false;

  while (true) {
    const headers = new Headers(rest.headers);
    if (!headers.has("Content-Type") && rest.body != null) {
      headers.set("Content-Type", "application/json");
    }
    if (auth) {
      const t = getStoredToken();
      if (t) headers.set("Authorization", `Bearer ${t}`);
    }

    const started = performance.now();
    let res: Response;
    try {
      res = await fetch(url, { ...rest, headers });
    } catch (e) {
      recordClientApiMetric({
        path: metricPath,
        method,
        durationMs: performance.now() - started,
        status: "network",
      });
      throw e;
    }

    if (
      res.status === 401 &&
      auth &&
      !retried &&
      getRefreshToken() &&
      (await refreshAccessToken())
    ) {
      recordClientApiMetric({
        path: metricPath,
        method,
        durationMs: performance.now() - started,
        status: 401,
      });
      retried = true;
      continue;
    }

    const json = (await parseJson(res)) as Envelope<T>;
    const durationMs = performance.now() - started;

    if (!res.ok) {
      const msg =
        (json &&
          typeof json === "object" &&
          json.error &&
          json.error.message) ||
        res.statusText ||
        "Request failed";
      const details =
        json && typeof json === "object" && json.error
          ? json.error.details
          : undefined;
      recordClientApiMetric({
        path: metricPath,
        method,
        durationMs,
        status: res.status,
      });
      throw new ApiError(res.status, String(msg), details);
    }

    if (!json.success) {
      recordClientApiMetric({
        path: metricPath,
        method,
        durationMs,
        status: res.status,
      });
      throw new ApiError(
        res.status,
        json.error?.message ?? "Request failed",
        json.error?.details,
      );
    }

    recordClientApiMetric({
      path: metricPath,
      method,
      durationMs,
      status: res.status,
    });
    return json.data as T;
  }
}
