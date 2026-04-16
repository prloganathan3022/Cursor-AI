/**
 * Unit tests with jsdom `localStorage`: still "unit" scope — one feature area,
 * no HTTP and no full app shell. Prefer this over E2E for storage edge cases.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { addTask, deleteTask, listTasks, updateTask } from "./taskStorage";

const userId = "user-1";

describe("taskStorage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("adds and lists tasks newest-first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
    const first = addTask(userId, { title: "A", description: "" });
    vi.setSystemTime(new Date("2026-01-02T12:00:00.000Z"));
    const second = addTask(userId, { title: "B", description: "" });
    vi.useRealTimers();

    const tasks = listTasks(userId);
    expect(tasks.map((t) => t.title)).toEqual(["B", "A"]);
    expect(tasks.find((t) => t.id === first.id)?.completed).toBe(false);
    expect(tasks.find((t) => t.id === second.id)?.title).toBe("B");
  });

  it("updateTask returns null when missing", () => {
    expect(updateTask(userId, "missing", { completed: true })).toBeNull();
  });

  it("deleteTask returns false when id not found", () => {
    expect(deleteTask(userId, "nope")).toBe(false);
  });

  it("updateTask and deleteTask mutate stored tasks", () => {
    const t = addTask(userId, { title: "T", description: "D" });
    const updated = updateTask(userId, t.id, {
      title: " T2 ",
      completed: true,
    });
    expect(updated?.title).toBe("T2");
    expect(updated?.completed).toBe(true);
    expect(deleteTask(userId, t.id)).toBe(true);
    expect(listTasks(userId)).toHaveLength(0);
  });

  it("readTasks returns empty array for corrupt JSON", () => {
    localStorage.setItem(`tm_tasks_${userId}`, "not-json");
    expect(listTasks(userId)).toEqual([]);
  });

  it("readTasks filters invalid task rows", () => {
    localStorage.setItem(
      `tm_tasks_${userId}`,
      JSON.stringify([{ id: 1 }, null, "x"]),
    );
    expect(listTasks(userId)).toEqual([]);
  });
});
