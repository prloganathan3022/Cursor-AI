"""Global error handlers and edge responses."""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from flask_limiter.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from tests.helpers import parse_json

pytestmark = pytest.mark.integration


def test_app_error_subclass_mapped(client, app):
    from app.errors.exceptions import ForbiddenError

    def boom():
        raise ForbiddenError("Nope")

    app.add_url_rule("/__err_test", "err_test", boom, methods=["GET"])
    resp = client.get("/__err_test")
    assert resp.status_code == 403
    assert parse_json(resp)["error"]["code"] == "forbidden"


def test_rate_limit_handler_envelope(client, app):
    def boom():
        lim = SimpleNamespace(error_message=None, limit="5 per minute")
        raise RateLimitExceeded(lim)

    app.add_url_rule("/__rl", "rl", boom, methods=["GET"])
    resp = client.get("/__rl")
    assert resp.status_code == 429
    body = parse_json(resp)
    assert body["error"]["code"] == "rate_limited"


def test_integrity_error_handler(client, app):
    def boom():
        raise IntegrityError("stmt", {}, Exception("orig"))

    app.add_url_rule("/__integrity", "integrity", boom, methods=["POST"])
    resp = client.post("/__integrity")
    assert resp.status_code == 409
    assert parse_json(resp)["error"]["code"] == "integrity_error"


def test_http_exception_with_none_code(client, app):
    class Weird(HTTPException):
        code = None

    def boom():
        raise Weird()

    app.add_url_rule("/__http_none", "http_none", boom, methods=["GET"])
    resp = client.get("/__http_none")
    assert resp.status_code == 500
    assert parse_json(resp)["error"]["code"] == "http_error"


def test_unhandled_exception_returns_internal(client, app):
    def boom():
        raise RuntimeError("surprise")

    app.add_url_rule("/__boom", "boom", boom, methods=["GET"])
    resp = client.get("/__boom")
    assert resp.status_code == 500
    assert parse_json(resp)["error"]["code"] == "internal_error"


def test_invalid_jwt_rejected(client):
    resp = client.get(
        "/api/v1/tasks",
        headers={"Authorization": "Bearer not-a-jwt"},
    )
    assert resp.status_code == 401
    assert parse_json(resp)["error"]["code"] == "invalid_token"


def test_expired_jwt_rejected(client, app):
    from datetime import timedelta

    from flask_jwt_extended import create_access_token

    with app.app_context():
        tok = create_access_token(identity="1", expires_delta=timedelta(seconds=-60))
    resp = client.get(
        "/api/v1/tasks",
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert resp.status_code == 401
    assert parse_json(resp)["error"]["code"] == "token_expired"
