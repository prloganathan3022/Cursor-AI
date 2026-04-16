"""Unit tests for Redis-backed JWT blocklist helpers."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
import redis

from app.services import token_blocklist

pytestmark = pytest.mark.unit


def test_revoke_jti_noop_when_disabled(app):
    with app.app_context():
        token_blocklist.revoke_jti("jti-1", 9999999999)


def test_revoke_jti_setex_when_enabled(app, monkeypatch):
    with app.app_context():
        app.config["JWT_BLOCKLIST_ENABLED"] = True
        mock_r = MagicMock()
        monkeypatch.setattr(token_blocklist, "_redis", lambda: mock_r)
        token_blocklist.reset_client()
        token_blocklist.revoke_jti("abc", 2_000_000_000)
        mock_r.setex.assert_called_once()
        args = mock_r.setex.call_args[0]
        assert args[0] == "jwt:blk:abc"


def test_is_jti_revoked_false_when_disabled(app):
    with app.app_context():
        assert token_blocklist.is_jti_revoked("x") is False
        assert token_blocklist.is_jti_revoked(None) is False


def test_is_jti_revoked_when_enabled(app, monkeypatch):
    with app.app_context():
        app.config["JWT_BLOCKLIST_ENABLED"] = True
        mock_r = MagicMock()
        mock_r.get.return_value = "1"
        monkeypatch.setattr(token_blocklist, "_redis", lambda: mock_r)
        token_blocklist.reset_client()
        assert token_blocklist.is_jti_revoked("j") is True


def test_revoke_jti_swallows_redis_error(app, monkeypatch):
    with app.app_context():
        app.config["JWT_BLOCKLIST_ENABLED"] = True

        def boom():
            raise redis.RedisError("down")

        monkeypatch.setattr(token_blocklist, "_redis", boom)
        token_blocklist.reset_client()
        token_blocklist.revoke_jti("jti", 2_000_000_000)


def test_is_jti_revoked_redis_error_returns_false(app, monkeypatch):
    with app.app_context():
        app.config["JWT_BLOCKLIST_ENABLED"] = True

        def boom():
            raise redis.RedisError("down")

        monkeypatch.setattr(token_blocklist, "_redis", boom)
        token_blocklist.reset_client()
        assert token_blocklist.is_jti_revoked("jti") is False
