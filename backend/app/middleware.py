"""Cross-cutting HTTP concerns: correlation IDs, security headers, request logs."""

from __future__ import annotations

import logging
import time

from flask import Flask, g, request

http_log = logging.getLogger("app.http")


def register_middleware(app: Flask) -> None:
    @app.before_request
    def _request_timer_start():
        g._request_started = time.perf_counter()

    @app.after_request
    def _security_headers_and_request_log(response):
        rid = getattr(g, "request_id", None)
        if rid:
            response.headers["X-Request-ID"] = str(rid)

        if app.config.get("ENABLE_SECURITY_HEADERS"):
            response.headers.setdefault("X-Content-Type-Options", "nosniff")
            response.headers.setdefault("X-Frame-Options", "DENY")
            response.headers.setdefault(
                "Referrer-Policy", "strict-origin-when-cross-origin"
            )
            response.headers.setdefault(
                "Permissions-Policy",
                "geolocation=(), microphone=(), camera=()",
            )
            if request.is_secure:
                response.headers.setdefault(
                    "Strict-Transport-Security",
                    "max-age=31536000; includeSubDomains",
                )

        if app.config.get("API_REQUEST_LOG", True) and request.path.startswith(
            "/api/"
        ):
            duration_ms = None
            if getattr(g, "_request_started", None) is not None:
                duration_ms = round(
                    (time.perf_counter() - g._request_started) * 1000, 2
                )

            user_id = _optional_jwt_subject()
            http_log.info(
                "request completed | %s %s | status=%s | %sms | request_id=%s | remote=%s | user_id=%s",
                request.method,
                request.path,
                response.status_code,
                duration_ms,
                rid,
                request.remote_addr,
                user_id,
            )

        return response


def _optional_jwt_subject():
    """Identity for logs only; never reads or logs raw tokens."""
    try:
        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request_optional

        verify_jwt_in_request_optional()
        return get_jwt_identity()
    except Exception:
        return None
