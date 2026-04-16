import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { DashboardPage } from "./DashboardPage";

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: "dash-user", email: "dash@example.com" },
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../config/api", () => ({
  API_BASE_URL: "",
  isApiMode: () => false,
}));

function cardWithTitle(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title });
  const root = heading.closest('[data-testid="task-card"]');
  if (!root) throw new Error(`No task card for title: ${title}`);
  return root as HTMLElement;
}

function renderDashboard() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("DashboardPage (local storage)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a task and updates stats", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByTestId("task-title-input"), "First task");
    await user.type(screen.getByTestId("task-description-input"), "Details");
    await user.click(screen.getByTestId("task-add-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("stat-total")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("task-card")).toHaveTextContent("First task");
  });

  it("blocks submit when title is empty", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.type(screen.getByTestId("task-description-input"), "Only desc");
    await user.click(screen.getByTestId("task-add-submit"));
    expect(screen.getByTestId("task-form-error")).toHaveTextContent(
      "Title is required",
    );
  });

  it("toggles completion and uses filter chips", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByTestId("task-title-input"), "Open task");
    await user.click(screen.getByTestId("task-add-submit"));
    await user.type(screen.getByTestId("task-title-input"), "Done task");
    await user.click(screen.getByTestId("task-add-submit"));

    const doneCard = cardWithTitle("Done task");
    await user.click(within(doneCard).getByTestId("task-complete-checkbox"));

    await waitFor(() => {
      expect(screen.getByTestId("stat-completed")).toHaveTextContent("1");
    });

    await user.click(screen.getByTestId("filter-active"));
    expect(cardWithTitle("Open task")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Done task" })).toBeNull();

    await user.click(screen.getByTestId("filter-completed"));
    expect(cardWithTitle("Done task")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Open task" })).toBeNull();
  });

  it("edits a task title", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.type(screen.getByTestId("task-title-input"), "Editable");
    await user.click(screen.getByTestId("task-add-submit"));

    const card = cardWithTitle("Editable");
    await user.click(within(card).getByTestId("task-edit-button"));
    await user.clear(screen.getByTestId("task-edit-title"));
    await user.type(screen.getByTestId("task-edit-title"), "Updated");
    await user.click(screen.getByTestId("task-save-edit"));

    expect(
      screen.getByRole("heading", { name: "Updated" }),
    ).toBeInTheDocument();
  });

  it("cancels edit mode", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.type(screen.getByTestId("task-title-input"), "Edit me");
    await user.click(screen.getByTestId("task-add-submit"));

    const card = cardWithTitle("Edit me");
    await user.click(within(card).getByTestId("task-edit-button"));
    await user.clear(screen.getByTestId("task-edit-title"));
    await user.type(screen.getByTestId("task-edit-title"), "changed");
    await user.click(screen.getByTestId("task-cancel-edit"));

    expect(
      screen.getByRole("heading", { name: "Edit me" }),
    ).toBeInTheDocument();
  });

  it("deletes the only task", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.type(screen.getByTestId("task-title-input"), "Remove me");
    await user.click(screen.getByTestId("task-add-submit"));

    const card = cardWithTitle("Remove me");
    await user.click(within(card).getByTestId("task-delete-button"));

    await waitFor(() => {
      expect(screen.getByTestId("task-list-empty")).toHaveTextContent(
        "No tasks yet",
      );
    });
  });
});
