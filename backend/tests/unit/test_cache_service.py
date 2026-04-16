"""Cache key helpers."""

from __future__ import annotations

import pytest

from app.services.cache_service import task_list_cache_key, user_stats_cache_key

pytestmark = pytest.mark.unit


def test_cache_keys_stable():
    assert task_list_cache_key(5) == "v1:tasks:list:user:5"
    assert user_stats_cache_key(5) == "v1:tasks:stats:user:5"
