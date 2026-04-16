import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { RegisterPage } from "./RegisterPage";

vi.mock("../config/api", () => ({
  API_BASE_URL: "",
  isApiMode: () => false,
}));

function renderRegister() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={<div data-testid="post-register">Dashboard</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows validation errors for empty submit", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByTestId("register-submit"));
    expect(
      await screen.findByTestId("register-name-field-error"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("register-email-field-error"),
    ).toBeInTheDocument();
  });

  it("creates a local account and navigates to dashboard", async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByTestId("register-name"), "Test User");
    await user.type(
      screen.getByTestId("register-email"),
      `r-${crypto.randomUUID()}@t.com`,
    );
    await user.type(screen.getByTestId("register-password"), "Secret123");
    await user.type(screen.getByTestId("register-confirm"), "Secret123");
    await user.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("post-register")).toBeInTheDocument();
    });
  });
});
