import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../lib/http";
import { ThemeProvider } from "../context/ThemeContext";
import { DashboardPage } from "./DashboardPage";

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: "1", email: "api@example.com" },
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../config/api", () => ({
  API_BASE_URL: "http://api.test",
  isApiMode: () => true,
}));

const fetchTasksApi = vi.fn();
const createTaskApi = vi.fn();
const updateTaskApi = vi.fn();
const deleteTaskApi = vi.fn();

vi.mock("../api/tasksApi", () => ({
  fetchTasksApi: (...args: unknown[]) => fetchTasksApi(...args),
  createTaskApi: (...args: unknown[]) => createTaskApi(...args),
  updateTaskApi: (...args: unknown[]) => updateTaskApi(...args),
  deleteTaskApi: (...args: unknown[]) => deleteTaskApi(...args),
}));

function renderDashboard() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("DashboardPage (API mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTasksApi.mockResolvedValue([
      {
        id: "10",
        title: "From API",
        description: "d",
        completed: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    createTaskApi.mockResolvedValue({
      id: "11",
      title: "New",
      description: "",
      completed: false,
      createdAt: "2026-01-02T00:00:00.000Z",
    });
    updateTaskApi.mockResolvedValue({
      id: "10",
      title: "From API",
      description: "d",
      completed: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    deleteTaskApi.mockResolvedValue(undefined);
  });

  it("loads tasks from the API and shows API copy", async () => {
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "From API" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Tasks are loaded from the API/i),
    ).toBeInTheDocument();
  });

  it("creates a task via API", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("task-title-input")).toBeInTheDocument();
    });

    await user.type(screen.getByTestId("task-title-input"), "New");
    await user.click(screen.getByTestId("task-add-submit"));
    await waitFor(() => {
      expect(createTaskApi).toHaveBeenCalled();
    });
  });

  it("shows form error when createTaskApi fails", async () => {
    createTaskApi.mockRejectedValueOnce(new ApiError(400, "bad"));
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("task-title-input")).toBeInTheDocument();
    });
    await user.type(screen.getByTestId("task-title-input"), "X");
    await user.click(screen.getByTestId("task-add-submit"));
    await waitFor(() => {
      expect(screen.getByTestId("task-form-error")).toHaveTextContent("bad");
    });
  });

  it("toggles and deletes via API", async () => {
    const user = userEvent.setup();
    renderDashboard();
    const heading = await screen.findByRole("heading", { name: "From API" });
    const card = heading.closest('[data-testid="task-card"]') as HTMLElement;

    await user.click(within(card).getByTestId("task-complete-checkbox"));
    await waitFor(() => {
      expect(updateTaskApi).toHaveBeenCalled();
    });

    await user.click(within(card).getByTestId("task-delete-button"));
    await waitFor(() => {
      expect(deleteTaskApi).toHaveBeenCalledWith("10");
    });
  });

  it("handles fetch failure by showing an empty list", async () => {
    fetchTasksApi.mockRejectedValueOnce(new Error("network"));
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByTestId("task-list-empty")).toHaveTextContent(
        "No tasks yet",
      );
    });
  });
});
