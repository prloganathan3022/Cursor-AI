from flask import Blueprint, current_app
from redis.exceptions import RedisError
from sqlalchemy import text

from app.extensions import db
from app.utils.responses import error_response, success_response

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    return success_response({"status": "ok"}, meta={"service": "task-api"})


@bp.get("/ready")
def ready():
    checks: dict[str, str] = {}
    try:
        db.session.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:  # pragma: no cover
        current_app.logger.exception("Readiness check failed: %s", exc)
        return error_response(
            code="not_ready",
            message="Database unavailable.",
            status=503,
            details={"checks": {"database": "error"}},
        )

    need_redis = current_app.config.get("READINESS_CHECK_REDIS") and (
        current_app.config.get("CACHE_TYPE") == "RedisCache"
        or current_app.config.get("JWT_BLOCKLIST_ENABLED")
    )
    if need_redis:
        try:
            import redis

            r = redis.Redis.from_url(
                current_app.config["REDIS_URL"],
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            r.ping()
            checks["redis"] = "ok"
        except RedisError as exc:
            current_app.logger.exception("Redis readiness failed: %s", exc)
            return error_response(
                code="not_ready",
                message="Redis unavailable.",
                status=503,
                details={"checks": {**checks, "redis": "error"}},
            )

    return success_response({"status": "ready", "checks": checks})
