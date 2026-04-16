import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/api", () => ({
  API_BASE_URL: "http://api.test",
  isApiMode: () => true,
}));

const rtMocks = vi.hoisted(() => ({
  clearSession: vi.fn(),
  getRefreshToken: vi.fn(),
  setStoredToken: vi.fn(),
}));

vi.mock("./sessionTokens", () => ({
  clearSession: rtMocks.clearSession,
  getRefreshToken: rtMocks.getRefreshToken,
}));

vi.mock("./jwt", () => ({
  setStoredToken: rtMocks.setStoredToken,
}));

import { refreshAccessToken } from "./http";

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when there is no refresh token", async () => {
    rtMocks.getRefreshToken.mockReturnValue(null);
    expect(await refreshAccessToken()).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("stores new access token on success", async () => {
    rtMocks.getRefreshToken.mockReturnValue("refresh");
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { access_token: "new" },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    expect(await refreshAccessToken()).toBe(true);
    expect(rtMocks.setStoredToken).toHaveBeenCalledWith("new");
  });

  it("clears session when refresh fails", async () => {
    rtMocks.getRefreshToken.mockReturnValue("refresh");
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { message: "no" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      ),
    );
    expect(await refreshAccessToken()).toBe(false);
    expect(rtMocks.clearSession).toHaveBeenCalled();
  });
});
