import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../context/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  it("switches theme when clicked", async () => {
    localStorage.setItem("tm_theme", "light");
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole("button", { name: /dark mode/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("theme-toggle"));
    expect(
      screen.getByRole("button", { name: /light mode/i }),
    ).toBeInTheDocument();
  });
});
