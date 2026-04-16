import { afterEach, describe, expect, it } from "vitest";
import { TOKEN_STORAGE_KEY } from "./jwt";
import {
  REFRESH_TOKEN_KEY,
  clearSession,
  getRefreshToken,
  setRefreshToken,
} from "./sessionTokens";

describe("sessionTokens", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("stores and clears refresh token", () => {
    expect(getRefreshToken()).toBeNull();
    setRefreshToken("r1");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("r1");
    setRefreshToken(null);
    expect(getRefreshToken()).toBeNull();
  });

  it("clearSession removes access and refresh tokens", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "a");
    localStorage.setItem(REFRESH_TOKEN_KEY, "r");
    clearSession();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
