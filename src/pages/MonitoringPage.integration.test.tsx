import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { createAccessToken, setStoredToken } from "../lib/jwt";
import { createUser } from "../lib/userStorage";
import { MonitoringPage } from "./MonitoringPage";

vi.mock("../config/api", () => ({
  API_BASE_URL: "",
  isApiMode: () => false,
}));

describe("MonitoringPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders monitoring sections", async () => {
    const u = createUser({
      name: "Mon User",
      email: `mon-${crypto.randomUUID()}@t.com`,
      password: "Secret123",
    });
    setStoredToken(createAccessToken(u.id, u.email));

    render(
      <ThemeProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={["/monitoring"]}>
            <Routes>
              <Route path="/monitoring" element={<MonitoringPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("monitoring-heading")).toHaveTextContent(
      "System monitoring",
    );
    expect(screen.getByText("Application health")).toBeInTheDocument();
    expect(screen.getByText("API performance (RED)")).toBeInTheDocument();
    expect(screen.getByText("Suggested tools")).toBeInTheDocument();
    expect(screen.getByTestId("red-rate")).toBeInTheDocument();
  });
});
