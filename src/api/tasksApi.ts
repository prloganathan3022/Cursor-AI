import type { Task } from '../types'
import { apiRequestJson } from '../lib/http'

type TaskRow = {
  id: number
  title: string
  description: string
  completed: boolean
  created_at: string
  updated_at: string
}

function mapTask(row: TaskRow): Task {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? '',
    completed: row.completed,
    createdAt: row.created_at,
  }
}

export async function fetchTasksApi(): Promise<Task[]> {
  const data = await apiRequestJson<{ tasks: TaskRow[] }>('/api/v1/tasks', {
    method: 'GET',
  })
  return data.tasks.map(mapTask)
}

export async function createTaskApi(input: {
  title: string
  description: string
}): Promise<Task> {
  const row = await apiRequestJson<TaskRow>('/api/v1/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      description: input.description,
    }),
  })
  return mapTask(row)
}

export async function updateTaskApi(
  taskId: string,
  patch: Partial<{ title: string; description: string; completed: boolean }>,
): Promise<Task> {
  const row = await apiRequestJson<TaskRow>(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return mapTask(row)
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  await apiRequestJson<{ deleted: boolean }>(`/api/v1/tasks/${taskId}`, {
    method: 'DELETE',
  })
}
