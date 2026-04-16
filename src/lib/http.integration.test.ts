/**
 * Integration-style test: `apiRequestJson` + mocked `fetch` + module boundaries
 * (config, jwt, session). Use when verifying HTTP client behavior without a live API.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/api", () => ({
  API_BASE_URL: "http://api.test",
  isApiMode: () => true,
}));

vi.mock("./jwt", () => ({
  getStoredToken: vi.fn(() => null),
  setStoredToken: vi.fn(),
}));

vi.mock("./sessionTokens", () => ({
  clearSession: vi.fn(),
  getRefreshToken: vi.fn(() => null),
}));

import { ApiError, apiRequestJson } from "./http";

describe("apiRequestJson", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: { value: 42 },
              error: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns envelope data on success", async () => {
    const data = await apiRequestJson<{ value: number }>("/api/v1/demo", {
      method: "GET",
      auth: false,
    });
    expect(data).toEqual({ value: 42 });
    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/api/v1/demo",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws ApiError when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { message: "Nope" },
        }),
        { status: 422, headers: { "Content-Type": "application/json" } },
      ),
    );
    const err = await apiRequestJson("/api/v1/demo", {
      method: "GET",
      auth: false,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
    expect((err as ApiError).message).toBe("Nope");
  });

  it("normalizes paths without a leading slash", async () => {
    await apiRequestJson<{ value: number }>("api/v1/demo", {
      method: "GET",
      auth: false,
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/api/v1/demo",
      expect.anything(),
    );
  });

  it("throws when HTTP 200 but success flag is false", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { message: "bad envelope" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const err = await apiRequestJson("/x", {
      method: "GET",
      auth: false,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("bad envelope");
  });

  it("uses status text when error message is missing", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, data: {}, error: null }), {
        status: 500,
        statusText: "Server exploded",
      }),
    );
    const err = await apiRequestJson("/x", {
      method: "GET",
      auth: false,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe("Server exploded");
  });

  it("sets Content-Type for JSON bodies", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {},
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    await apiRequestJson("/x", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ a: 1 }),
    });
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });
});
