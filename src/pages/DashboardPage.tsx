import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createTaskApi,
  deleteTaskApi,
  fetchTasksApi,
  updateTaskApi,
} from '../api/tasksApi'
import { AppShell } from '../components/AppShell'
import { isApiMode } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/http'
import { addTask, deleteTask, listTasks, updateTask } from '../lib/taskStorage'
import type { Task } from '../types'

type Filter = 'all' | 'active' | 'completed'

export function DashboardPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [apiTasks, setApiTasks] = useState<Task[] | null>(null)

  useEffect(() => {
    if (!isApiMode() || !userId) {
      // Reset server-backed list when leaving API mode or logging out (sync with route/user).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional state reset tied to user/mode
      setApiTasks(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const list = await fetchTasksApi()
        if (!cancelled) setApiTasks(list)
      } catch {
        if (!cancelled) setApiTasks([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, reloadKey])

  const localTasks = useMemo(() => {
    if (!userId || isApiMode()) return []
    void reloadKey
    return listTasks(userId)
  }, [userId, reloadKey])

  const tasks = useMemo(
    () => (isApiMode() ? (apiTasks ?? []) : localTasks),
    [apiTasks, localTasks],
  )

  const bump = () => setReloadKey((k) => k + 1)

  const filtered = useMemo(() => {
    if (filter === 'active') return tasks.filter((t) => !t.completed)
    if (filter === 'completed') return tasks.filter((t) => t.completed)
    return tasks
  }, [tasks, filter])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const t = title.trim()
    if (!t) {
      setFormError('Title is required')
      return
    }
    if (!userId) return
    if (isApiMode()) {
      try {
        await createTaskApi({ title: t, description })
        setTitle('')
        setDescription('')
        bump()
      } catch (err) {
        setFormError(
          err instanceof ApiError ? err.message : 'Could not create task.',
        )
      }
      return
    }
    addTask(userId, { title: t, description })
    setTitle('')
    setDescription('')
    bump()
  }

  async function toggleComplete(task: Task) {
    if (!userId) return
    if (isApiMode()) {
      try {
        await updateTaskApi(task.id, { completed: !task.completed })
        bump()
      } catch {
        /* silent — could add toast */
      }
      return
    }
    updateTask(userId, task.id, { completed: !task.completed })
    bump()
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description)
  }

  async function saveEdit() {
    if (!userId || !editingId) return
    const t = editTitle.trim()
    if (!t) return
    if (isApiMode()) {
      try {
        await updateTaskApi(editingId, {
          title: t,
          description: editDescription.trim(),
        })
        setEditingId(null)
        bump()
      } catch {
        /* */
      }
      return
    }
    updateTask(userId, editingId, {
      title: t,
      description: editDescription.trim(),
    })
    setEditingId(null)
    bump()
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function remove(taskId: string) {
    if (!userId) return
    if (isApiMode()) {
      try {
        await deleteTaskApi(taskId)
        bump()
      } catch {
        /* */
      }
      return
    }
    deleteTask(userId, taskId)
    bump()
  }

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.completed).length
    return { total, completed, active: total - completed }
  }, [tasks])

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1
            data-testid="dashboard-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Task dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {isApiMode()
              ? 'Tasks are loaded from the API. Check the Flask terminal for request logs.'
              : 'Add tasks, mark them done, and filter by status. Data is stored in your browser for this demo.'}
          </p>
        </div>

        <section
          aria-label="Summary"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <StatCard label="Total" value={stats.total} testId="stat-total" />
          <StatCard label="Active" value={stats.active} testId="stat-active" />
          <StatCard
            label="Completed"
            value={stats.completed}
            testId="stat-completed"
          />
        </section>

        <section
          aria-labelledby="new-task-heading"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        >
          <h2 id="new-task-heading" className="text-lg font-semibold">
            New task
          </h2>
          <form
            data-testid="task-create-form"
            onSubmit={handleAdd}
            className="mt-4 space-y-4"
          >
            {formError && (
              <p
                role="alert"
                data-testid="task-form-error"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="task-title"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="task-title"
                  data-testid="task-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  placeholder="e.g. Review pull request"
                />
              </div>
              <div className="lg:col-span-2">
                <label
                  htmlFor="task-desc"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="task-desc"
                  data-testid="task-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-400/20"
                  placeholder="Optional details"
                />
              </div>
            </div>
            <button
              type="submit"
              data-testid="task-add-submit"
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-violet-500 dark:hover:bg-violet-400"
            >
              Add task
            </button>
          </form>
        </section>

        <section aria-labelledby="task-list-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="task-list-heading" className="text-lg font-semibold">
              Your tasks
            </h2>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter tasks"
            >
              {(
                [
                  ['all', 'All'],
                  ['active', 'Active'],
                  ['completed', 'Done'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  data-testid={`filter-${key}`}
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    filter === key
                      ? 'bg-violet-600 text-white dark:bg-violet-500'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p
              data-testid="task-list-empty"
              className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
            >
              {tasks.length === 0
                ? 'No tasks yet. Add one above.'
                : 'No tasks match this filter.'}
            </p>
          ) : (
            <ul data-testid="task-list" className="mt-4 space-y-3">
              {filtered.map((task) => (
                <li
                  key={task.id}
                  data-testid="task-item"
                  data-task-id={task.id}
                >
                  {editingId === task.id ? (
                    <div
                      data-testid="task-edit-panel"
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
                    >
                      <div className="space-y-3">
                        <input
                          data-testid="task-edit-title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <textarea
                          data-testid="task-edit-description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={2}
                          className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            data-testid="task-save-edit"
                            onClick={saveEdit}
                            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            data-testid="task-cancel-edit"
                            onClick={cancelEdit}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <article
                      data-testid="task-card"
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            data-testid="task-complete-checkbox"
                            checked={task.completed}
                            onChange={() => toggleComplete(task)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-950"
                            aria-label={
                              task.completed ? 'Mark as active' : 'Mark as done'
                            }
                          />
                          <div className="min-w-0">
                            <h3
                              className={`font-medium ${
                                task.completed
                                  ? 'text-slate-500 line-through dark:text-slate-500'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {task.title}
                            </h3>
                            {task.description ? (
                              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                {task.description}
                              </p>
                            ) : null}
                            <p className="mt-2 text-xs text-slate-400">
                              Added{' '}
                              {new Date(task.createdAt).toLocaleString(
                                undefined,
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch lg:flex-row">
                        <button
                          type="button"
                          data-testid="task-edit-button"
                          onClick={() => startEdit(task)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          data-testid="task-delete-button"
                          onClick={() => remove(task.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950/80"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({
  label,
  value,
  testId,
}: {
  label: string
  value: number
  testId?: string
}) {
  return (
    <div
      data-testid={testId}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  )
}
