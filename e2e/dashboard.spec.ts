import { expect, test } from "@playwright/test";
import { addTaskViaUi, makeTestUser, registerViaUi } from "./helpers/test-user";

test.describe("Task dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const user = makeTestUser();
    await registerViaUi(page, user);
  });

  test("creates a task and updates summary cards", async ({ page }) => {
    await expect(page.getByTestId("stat-total")).toContainText("0");
    await addTaskViaUi(page, "Ship feature", "Include E2E tests");

    await expect(page.getByTestId("stat-total")).toContainText("1");
    await expect(page.getByTestId("stat-active")).toContainText("1");
    await expect(page.getByTestId("stat-completed")).toContainText("0");

    const card = page
      .getByTestId("task-card")
      .filter({ hasText: "Ship feature" });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Include E2E tests");
  });

  test("blocks submit when title is empty and shows inline error", async ({
    page,
  }) => {
    await page.getByTestId("task-description-input").fill("Only description");
    await page.getByTestId("task-add-submit").click();

    await expect(page.getByTestId("task-form-error")).toHaveText(
      "Title is required",
    );
    await expect(page.getByTestId("stat-total")).toContainText("0");
  });

  test("toggles completion and filter chips", async ({ page }) => {
    await addTaskViaUi(page, "Open task");
    await addTaskViaUi(page, "Done task");

    const doneCard = page
      .getByTestId("task-card")
      .filter({ hasText: "Done task" });
    await doneCard.getByTestId("task-complete-checkbox").check();

    await expect(page.getByTestId("stat-completed")).toContainText("1");
    await expect(page.getByTestId("stat-active")).toContainText("1");

    await page.getByTestId("filter-active").click();
    await expect(
      page.getByTestId("task-card").filter({ hasText: "Open task" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("task-card").filter({ hasText: "Done task" }),
    ).toHaveCount(0);

    await page.getByTestId("filter-completed").click();
    await expect(
      page.getByTestId("task-card").filter({ hasText: "Done task" }),
    ).toBeVisible();
    await expect(
      page.getByTestId("task-card").filter({ hasText: "Open task" }),
    ).toHaveCount(0);

    await page.getByTestId("filter-all").click();
    await expect(page.getByTestId("task-item")).toHaveCount(2);
  });

  test("edits and deletes a task", async ({ page }) => {
    await addTaskViaUi(page, "Original title", "Original desc");

    const card = page
      .getByTestId("task-card")
      .filter({ hasText: "Original title" });
    await card.getByTestId("task-edit-button").click();

    await page.getByTestId("task-edit-title").fill("Updated title");
    await page.getByTestId("task-edit-description").fill("Updated desc");
    await page.getByTestId("task-save-edit").click();

    await expect(
      page.getByTestId("task-card").filter({ hasText: "Updated title" }),
    ).toBeVisible();
    await expect(page.getByText("Updated desc")).toBeVisible();

    await page
      .getByTestId("task-card")
      .filter({ hasText: "Updated title" })
      .getByTestId("task-delete-button")
      .click();

    await expect(page.getByTestId("task-list-empty")).toContainText(
      "No tasks yet",
    );
  });

  test("theme toggle applies dark class on the document element", async ({
    page,
  }) => {
    const html = page.locator("html");
    await expect(html).not.toHaveAttribute("class", /\bdark\b/);

    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("class", /\bdark\b/);

    await page.getByTestId("theme-toggle").click();
    await expect(html).not.toHaveAttribute("class", /\bdark\b/);
  });
});
