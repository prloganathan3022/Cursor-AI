/**
 * Unit tests: one module, no I/O, no React tree.
 * Use for rules and pure helpers — fastest feedback when behavior changes.
 */
import { describe, expect, it } from "vitest";
import { validateLogin, validateRegister } from "./validation";

describe("validateRegister", () => {
  it("returns errors for empty fields", () => {
    const errors = validateRegister({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    expect(errors.name).toBe("Name is required");
    expect(errors.email).toBe("Email is required");
    expect(errors.password).toBe("Password is required");
    expect(errors.confirmPassword).toBe("Please confirm your password");
  });

  it("normalizes email and flags mismatch", () => {
    const errors = validateRegister({
      name: "Ada",
      email: "Ada@Example.COM",
      password: "Secret123",
      confirmPassword: "Other123",
    });
    expect(errors.confirmPassword).toBe("Passwords do not match");
    expect(errors.email).toBeUndefined();
  });
});

describe("validateLogin", () => {
  it("requires email and password", () => {
    const errors = validateLogin({ email: "  ", password: "" });
    expect(errors.email).toBe("Email is required");
    expect(errors.password).toBe("Password is required");
  });

  it("rejects invalid email format", () => {
    const errors = validateLogin({ email: "not-an-email", password: "x" });
    expect(errors.email).toBe("Enter a valid email address");
  });
});

describe("validateRegister password rules", () => {
  it("requires lowercase, uppercase, and number", () => {
    expect(
      validateRegister({
        name: "Ada",
        email: "a@b.com",
        password: "ALLUPPER1",
        confirmPassword: "ALLUPPER1",
      }).password,
    ).toBe("Include at least one lowercase letter");

    expect(
      validateRegister({
        name: "Ada",
        email: "a@b.com",
        password: "alllower1",
        confirmPassword: "alllower1",
      }).password,
    ).toBe("Include at least one uppercase letter");

    expect(
      validateRegister({
        name: "Ada",
        email: "a@b.com",
        password: "NoDigitsAb",
        confirmPassword: "NoDigitsAb",
      }).password,
    ).toBe("Include at least one number");

    expect(
      validateRegister({
        name: "Ada",
        email: "a@b.com",
        password: "short1A",
        confirmPassword: "short1A",
      }).password,
    ).toBe("Password must be at least 8 characters");
  });

  it("flags too-short name", () => {
    expect(
      validateRegister({
        name: "A",
        email: "a@b.com",
        password: "Secret123",
        confirmPassword: "Secret123",
      }).name,
    ).toBe("Name must be at least 2 characters");
  });
});
