"""Server-side JWT revocation via Redis (access + refresh `jti` claims)."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

import redis
from flask import current_app

if TYPE_CHECKING:
    from redis import Redis

_client: Redis | None = None


def _redis() -> Redis:
    global _client
    if _client is None:
        url = current_app.config["REDIS_URL"]
        _client = redis.Redis.from_url(url, decode_responses=True, socket_timeout=3)
    return _client


def reset_client() -> None:
    """Test hook: clear cached Redis client."""
    global _client
    _client = None


def revoke_jti(jti: str, exp_unix: int) -> None:
    """Store revoked `jti` until token would have expired."""
    if not current_app.config.get("JWT_BLOCKLIST_ENABLED"):
        return
    try:
        ttl = max(1, int(exp_unix) - int(time.time()))
        _redis().setex(f"jwt:blk:{jti}", ttl, "1")
    except redis.RedisError:
        current_app.logger.warning(
            "Could not persist JWT revocation in Redis; client should still discard tokens."
        )


def is_jti_revoked(jti: str | None) -> bool:
    if not jti or not current_app.config.get("JWT_BLOCKLIST_ENABLED"):
        return False
    try:
        return _redis().get(f"jwt:blk:{jti}") is not None
    except redis.RedisError:
        current_app.logger.warning("Redis unavailable for JWT blocklist check")
        return False
