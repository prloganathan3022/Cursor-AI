"""Unit tests for task_service (cache + DB)."""

from __future__ import annotations

import json

import pytest

from app.errors.exceptions import NotFoundError
from app.extensions import cache, db
from app.models import Task, User
from app.services import task_service
from app.services.cache_service import task_list_cache_key, user_stats_cache_key

pytestmark = pytest.mark.unit


def _seed_user(app) -> int:
    with app.app_context():
        u = User(email="owner@example.com", name="Owner")
        u.set_password("Secret123")
        db.session.add(u)
        db.session.commit()
        return u.id


def test_list_tasks_cache_miss_and_hit(app):
    uid = _seed_user(app)
    with app.app_context():
        task_service.create_task(
            user_id=uid, title="First", description="d"
        )
        cache.delete(task_list_cache_key(uid))
        rows = task_service.list_tasks_for_user(uid)
        assert len(rows) == 1
        assert rows[0]["title"] == "First"

        raw = cache.get(task_list_cache_key(uid))
        assert raw is not None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        cached = json.loads(raw)
        assert cached == rows

        again = task_service.list_tasks_for_user(uid)
        assert again == rows


def test_list_tasks_use_cache_false_bypasses(app):
    uid = _seed_user(app)
    with app.app_context():
        task_service.create_task(user_id=uid, title="A", description="")
        task_service.list_tasks_for_user(uid, use_cache=True)
        task_service.create_task(user_id=uid, title="B", description="")
        bypass = task_service.list_tasks_for_user(uid, use_cache=False)
        assert len(bypass) == 2


def test_get_task_stats_from_cache_and_compute(app):
    uid = _seed_user(app)
    with app.app_context():
        cache.delete(user_stats_cache_key(uid))
        stats = task_service.get_task_stats(uid)
        assert stats == {"total": 0, "active": 0, "completed": 0}

        task_service.create_task(user_id=uid, title="T", description="")
        cache.delete(user_stats_cache_key(uid))
        stats2 = task_service.compute_task_stats(uid)
        assert stats2["total"] == 1
        assert stats2["active"] == 1

        cached = task_service.get_task_stats(uid)
        assert cached == stats2


def test_get_task_for_user_not_found(app):
    uid = _seed_user(app)
    with app.app_context():
        with pytest.raises(NotFoundError):
            task_service.get_task_for_user(99999, uid)


def test_update_and_delete_task(app):
    uid = _seed_user(app)
    with app.app_context():
        t = task_service.create_task(
            user_id=uid, title="Old", description="x"
        )
        task_service.update_task(
            t, title="New", description="y", completed=True
        )
        db.session.refresh(t)
        assert t.title == "New"
        assert t.completed is True

        task_service.delete_task(t)
        assert Task.query.filter_by(id=t.id).first() is None
