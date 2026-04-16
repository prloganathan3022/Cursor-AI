import { expect, test } from "@playwright/test";
import {
  makeTestUser,
  registerViaUi,
  uniqueTestEmail,
} from "./helpers/test-user";

test.describe("Error scenarios and route guards", () => {
  test("redirects unauthenticated users from /dashboard to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("rejects corrupted JWT in storage and keeps dashboard protected", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("tm_access_token", "invalid.token.value");
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("after registration failure, user stays on register with fields intact", async ({
    page,
  }) => {
    const first = makeTestUser({ email: uniqueTestEmail("dup") });
    await registerViaUi(page, first);
    await page.getByTestId("logout-button").click();

    await page.goto("/register");
    await page.getByTestId("register-name").fill("Second");
    await page.getByTestId("register-email").fill(first.email);
    await page.getByTestId("register-password").fill(first.password);
    await page.getByTestId("register-confirm").fill(first.password);
    await page.getByTestId("register-submit").click();

    await expect(page.getByTestId("register-form-error")).toBeVisible();
    await expect(page.getByTestId("register-email")).toHaveValue(first.email);
  });

  test("shows empty-state copy when filters exclude all tasks", async ({
    page,
  }) => {
    await registerViaUi(page, makeTestUser());
    await page.goto("/dashboard");

    await page
      .getByTestId("task-create-form")
      .getByTestId("task-title-input")
      .fill("Only active");
    await page.getByTestId("task-add-submit").click();

    await page.getByTestId("filter-completed").click();
    await expect(page.getByTestId("task-list-empty")).toContainText(
      "No tasks match this filter",
    );
  });
});
