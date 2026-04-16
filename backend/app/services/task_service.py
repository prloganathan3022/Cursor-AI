from __future__ import annotations

import json
import logging

from app.errors.exceptions import NotFoundError
from app.extensions import cache, db
from app.models import Task
from app.schemas.task import TaskOutSchema
from app.services.cache_service import task_list_cache_key, user_stats_cache_key

log = logging.getLogger("app.task_service")


def _serialize_tasks(tasks: list[Task]) -> list[dict]:
    schema = TaskOutSchema(many=True)
    return schema.dump(tasks)


def list_tasks_for_user(user_id: int, *, use_cache: bool = True) -> list[dict]:
    key = task_list_cache_key(user_id)
    if use_cache:
        cached = cache.get(key)
        if cached:
            if isinstance(cached, bytes):
                cached = cached.decode("utf-8")
            log.debug("tasks.list cache_hit user_id=%s", user_id)
            return json.loads(cached)

    log.debug("tasks.list cache_miss user_id=%s", user_id)
    tasks = (
        Task.query.filter_by(user_id=user_id)
        .order_by(Task.created_at.desc())
        .all()
    )
    payload = _serialize_tasks(tasks)
    if use_cache:
        cache.set(key, json.dumps(payload))
        log.debug("tasks.list cache_set user_id=%s rows=%s", user_id, len(payload))
    return payload


def invalidate_task_caches(user_id: int) -> None:
    cache.delete(task_list_cache_key(user_id))
    cache.delete(user_stats_cache_key(user_id))


def compute_task_stats(user_id: int) -> dict:
    """Aggregate task counts; used by API and Celery workers (cache warming)."""
    q = Task.query.filter_by(user_id=user_id)
    total = q.count()
    completed = q.filter_by(completed=True).count()
    active = total - completed
    stats = {"total": total, "active": active, "completed": completed}
    cache.set(user_stats_cache_key(user_id), json.dumps(stats))
    return stats


def get_task_stats(user_id: int) -> dict:
    key = user_stats_cache_key(user_id)
    raw = cache.get(key)
    if raw:
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        return json.loads(raw)
    return compute_task_stats(user_id)


def get_task_for_user(task_id: int, user_id: int) -> Task:
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        raise NotFoundError("Task not found.")
    return task


def create_task(*, user_id: int, title: str, description: str) -> Task:
    task = Task(
        user_id=user_id,
        title=title.strip(),
        description=(description or "").strip(),
        completed=False,
    )
    db.session.add(task)
    db.session.commit()
    invalidate_task_caches(user_id)
    return task


def update_task(
    task: Task, *, title: str | None, description: str | None, completed: bool | None
) -> Task:
    if title is not None:
        task.title = title.strip()
    if description is not None:
        task.description = description.strip()
    if completed is not None:
        task.completed = completed
    db.session.commit()
    invalidate_task_caches(task.user_id)
    return task


def delete_task(task: Task) -> None:
    uid = task.user_id
    db.session.delete(task)
    db.session.commit()
    invalidate_task_caches(uid)
