import { afterEach, describe, expect, it, vi } from "vitest";
import { readServerAccessClaims } from "./serverJwt";

function segment(obj: object): string {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("readServerAccessClaims", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses valid JWT payload segment", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = segment({ sub: 42, email: "hi@example.com", exp });
    const claims = readServerAccessClaims(`hdr.${payload}.sig`);
    expect(claims).toEqual({
      sub: "42",
      email: "hi@example.com",
      exp,
    });
  });

  it("returns null when token is expired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
    const exp = Math.floor(new Date("2019-01-01").getTime() / 1000);
    const payload = segment({ sub: "1", email: "a@b.com", exp });
    expect(readServerAccessClaims(`h.${payload}.s`)).toBeNull();
  });

  it("returns null for invalid or incomplete tokens", () => {
    expect(readServerAccessClaims("not-enough-parts")).toBeNull();
    expect(readServerAccessClaims("one.two")).toBeNull();
    const payload = segment({ sub: "", email: "a@b.com", exp: 9999999999 });
    expect(readServerAccessClaims(`h.${payload}.s`)).toBeNull();
    const badExp = segment({ sub: "1", email: "a@b.com", exp: Number.NaN });
    expect(readServerAccessClaims(`h.${badExp}.s`)).toBeNull();
  });

  it("returns null when JSON payload is invalid", () => {
    const bad = btoa("{")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(readServerAccessClaims(`h.${bad}.s`)).toBeNull();
  });
});
