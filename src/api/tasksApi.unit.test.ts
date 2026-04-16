import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestJson } = vi.hoisted(() => ({
  apiRequestJson: vi.fn(),
}));

vi.mock("../lib/http", () => ({
  apiRequestJson,
}));

import {
  createTaskApi,
  deleteTaskApi,
  fetchTasksApi,
  updateTaskApi,
} from "./tasksApi";

describe("tasksApi", () => {
  beforeEach(() => {
    apiRequestJson.mockReset();
  });

  it("fetchTasksApi maps rows", async () => {
    apiRequestJson.mockResolvedValueOnce({
      tasks: [
        {
          id: 1,
          title: "A",
          description: null,
          completed: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-02",
        },
      ],
    });
    const tasks = await fetchTasksApi();
    expect(tasks[0]).toEqual({
      id: "1",
      title: "A",
      description: "",
      completed: false,
      createdAt: "2026-01-01",
    });
  });

  it("createTaskApi maps single row", async () => {
    apiRequestJson.mockResolvedValueOnce({
      id: 2,
      title: "B",
      description: "d",
      completed: true,
      created_at: "2026-02-01",
      updated_at: "2026-02-02",
    });
    const task = await createTaskApi({ title: "B", description: "d" });
    expect(task.id).toBe("2");
    expect(task.completed).toBe(true);
  });

  it("updateTaskApi and deleteTaskApi call apiRequestJson", async () => {
    apiRequestJson.mockResolvedValueOnce({
      id: 3,
      title: "C",
      description: "",
      completed: false,
      created_at: "x",
      updated_at: "y",
    });
    await updateTaskApi("3", { completed: true });
    expect(apiRequestJson).toHaveBeenCalledWith(
      "/api/v1/tasks/3",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
      }),
    );

    apiRequestJson.mockResolvedValueOnce({ deleted: true });
    await deleteTaskApi("3");
    expect(apiRequestJson).toHaveBeenCalledWith(
      "/api/v1/tasks/3",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
