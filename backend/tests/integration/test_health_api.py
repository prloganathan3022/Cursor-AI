"""Health and readiness endpoints."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from redis.exceptions import RedisError

from tests.helpers import assert_envelope_success, parse_json

pytestmark = pytest.mark.integration


def test_health_ok(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = assert_envelope_success(parse_json(resp))
    assert data["status"] == "ok"


def test_ready_database_ok(client):
    resp = client.get("/api/v1/ready")
    assert resp.status_code == 200
    body = parse_json(resp)
    data = assert_envelope_success(body)
    assert data["status"] == "ready"
    assert data["checks"]["database"] == "ok"


def test_ready_redis_branch_ok(client, app, monkeypatch):
    monkeypatch.setitem(app.config, "READINESS_CHECK_REDIS", True)
    monkeypatch.setitem(app.config, "CACHE_TYPE", "RedisCache")
    monkeypatch.setitem(app.config, "JWT_BLOCKLIST_ENABLED", False)

    mock_r = MagicMock()
    mock_r.ping.return_value = True
    monkeypatch.setattr("redis.Redis.from_url", MagicMock(return_value=mock_r))
    resp = client.get("/api/v1/ready")
    assert resp.status_code == 200
    assert parse_json(resp)["data"]["checks"]["redis"] == "ok"


def test_ready_redis_failure_returns_503(client, app, monkeypatch):
    monkeypatch.setitem(app.config, "READINESS_CHECK_REDIS", True)
    monkeypatch.setitem(app.config, "CACHE_TYPE", "RedisCache")

    mock_r = MagicMock()
    mock_r.ping.side_effect = RedisError("no redis")
    monkeypatch.setattr("redis.Redis.from_url", MagicMock(return_value=mock_r))
    resp = client.get("/api/v1/ready")
    assert resp.status_code == 503
    assert parse_json(resp)["error"]["code"] == "not_ready"
