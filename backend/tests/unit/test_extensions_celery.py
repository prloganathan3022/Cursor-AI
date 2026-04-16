"""Celery binding to Flask config."""

from __future__ import annotations

import pytest

from app.extensions import celery

pytestmark = pytest.mark.unit


def test_celery_eager_mode_under_testing_app(app):
    assert celery.conf.task_always_eager is True
    assert celery.conf.task_eager_propagates is True
