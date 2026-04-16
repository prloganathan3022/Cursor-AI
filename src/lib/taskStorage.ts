import type { Task } from "../types";

function tasksKey(userId: string): string {
  return `tm_tasks_${userId}`;
}

function readTasks(userId: string): Task[] {
  try {
    const raw = localStorage.getItem(tasksKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Task =>
        typeof t === "object" &&
        t !== null &&
        typeof (t as Task).id === "string" &&
        typeof (t as Task).title === "string" &&
        typeof (t as Task).description === "string" &&
        typeof (t as Task).completed === "boolean" &&
        typeof (t as Task).createdAt === "string",
    );
  } catch {
    return [];
  }
}

function writeTasks(userId: string, tasks: Task[]): void {
  localStorage.setItem(tasksKey(userId), JSON.stringify(tasks));
}

export function listTasks(userId: string): Task[] {
  return readTasks(userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function addTask(
  userId: string,
  input: { title: string; description: string },
): Task {
  const tasks = readTasks(userId);
  const task: Task = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  writeTasks(userId, [task, ...tasks]);
  return task;
}

export function updateTask(
  userId: string,
  taskId: string,
  patch: Partial<Pick<Task, "title" | "description" | "completed">>,
): Task | null {
  const tasks = readTasks(userId);
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return null;
  const next = { ...tasks[idx], ...patch };
  if (typeof patch.title === "string") next.title = patch.title.trim();
  if (typeof patch.description === "string")
    next.description = patch.description.trim();
  const copy = [...tasks];
  copy[idx] = next;
  writeTasks(userId, copy);
  return next;
}

export function deleteTask(userId: string, taskId: string): boolean {
  const tasks = readTasks(userId);
  const next = tasks.filter((t) => t.id !== taskId);
  if (next.length === tasks.length) return false;
  writeTasks(userId, next);
  return true;
}
