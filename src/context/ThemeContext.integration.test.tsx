import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

function Probe() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-label">{theme}</span>
      <button type="button" data-testid="toggle" onClick={toggleTheme}>
        toggle
      </button>
      <button
        type="button"
        data-testid="set-dark"
        onClick={() => setTheme("dark")}
      >
        dark
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("toggleTheme switches between light and dark", async () => {
    localStorage.setItem("tm_theme", "light");
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme-label")).toHaveTextContent("dark");
    await user.click(screen.getByTestId("toggle"));
    expect(screen.getByTestId("theme-label")).toHaveTextContent("light");
  });

  it("setTheme applies explicit theme", async () => {
    localStorage.setItem("tm_theme", "light");
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await user.click(screen.getByTestId("set-dark"));
    expect(screen.getByTestId("theme-label")).toHaveTextContent("dark");
  });
});

describe("useTheme", () => {
  it("throws when used outside ThemeProvider", () => {
    expect(() => render(<Probe />)).toThrow(
      "useTheme must be used within ThemeProvider",
    );
  });
});
