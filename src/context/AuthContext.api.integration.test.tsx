import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const apiRequestJson = vi.hoisted(() => vi.fn());

vi.mock("../config/api", () => ({
  API_BASE_URL: "http://api.test",
  isApiMode: () => true,
}));

vi.mock("../lib/http", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  },
  apiRequestJson: (...args: unknown[]) => apiRequestJson(...args),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider (API mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    apiRequestJson.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("", { status: 204 }))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("logs in via API", async () => {
    apiRequestJson.mockResolvedValueOnce({
      user: { id: 1, email: "a@b.com", name: "A" },
      access_token: "acc",
      refresh_token: "ref",
      token_type: "Bearer",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const r = await result.current.login("a@b.com", "Secret123");
      expect(r.ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
    expect(result.current.user?.email).toBe("a@b.com");
  });

  it("surfaces ApiError message on failed login", async () => {
    const { ApiError } = await import("../lib/http");
    apiRequestJson.mockRejectedValueOnce(
      new ApiError(401, "Invalid credentials"),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const r = await result.current.login("a@b.com", "wrong");
      expect(r).toEqual(
        expect.objectContaining({
          ok: false,
          message: "Invalid credentials",
        }),
      );
    });
  });

  it("registers via API", async () => {
    apiRequestJson.mockResolvedValueOnce({
      user: { id: 2, email: "n@b.com", name: "N" },
      access_token: "acc2",
      refresh_token: "ref2",
      token_type: "Bearer",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const r = await result.current.register({
        name: "N",
        email: "n@b.com",
        password: "Secret123",
      });
      expect(r.ok).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.user?.email).toBe("n@b.com");
    });
  });

  it("logs out and calls the API", async () => {
    apiRequestJson.mockResolvedValueOnce({
      user: { id: 1, email: "a@b.com", name: "A" },
      access_token: "acc",
      refresh_token: "ref",
      token_type: "Bearer",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("a@b.com", "Secret123");
    });

    await act(async () => {
      result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
    expect(fetch).toHaveBeenCalled();
  });
});
