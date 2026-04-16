"""Auth HTTP API integration tests."""

from __future__ import annotations

import pytest

from tests.helpers import assert_envelope_error, assert_envelope_success, parse_json

pytestmark = pytest.mark.integration


def test_register_login_me_refresh_logout_flow(client, register_payload, mocker):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201
    body = parse_json(reg)
    data = assert_envelope_success(body)
    access = data["access_token"]
    refresh = data["refresh_token"]

    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert me.status_code == 200
    me_data = assert_envelope_success(parse_json(me))
    assert me_data["email"] == register_payload["email"].lower()

    refreshed = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh}"},
    )
    assert refreshed.status_code == 200
    new_access = assert_envelope_success(parse_json(refreshed))["access_token"]
    assert new_access

    out = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {new_access}"},
        json={"refresh_token": refresh},
    )
    assert out.status_code == 200
    assert assert_envelope_success(parse_json(out))["logged_out"] is True


def test_register_duplicate_email(client, register_payload, mocker):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    assert client.post("/api/v1/auth/register", json=register_payload).status_code == 201
    dup = client.post("/api/v1/auth/register", json=register_payload)
    assert dup.status_code == 409
    assert_envelope_error(parse_json(dup), code="conflict")


def test_register_validation_error(client, mocker):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    bad = client.post(
        "/api/v1/auth/register",
        json={
            "name": "AB",
            "email": "not-an-email",
            "password": "Secret123",
            "confirm_password": "Secret123",
        },
    )
    assert bad.status_code == 422


def test_login_validation_error(client):
    bad = client.post("/api/v1/auth/login", json={})
    assert bad.status_code == 422
    assert parse_json(bad)["error"]["code"] == "validation_error"


def test_login_invalid_credentials(client, register_payload, mocker):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    client.post("/api/v1/auth/register", json=register_payload)
    bad = client.post(
        "/api/v1/auth/login",
        json={"email": register_payload["email"], "password": "WrongPass1"},
    )
    assert bad.status_code == 401


def test_refresh_user_deleted(client, register_payload, mocker, app):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    reg = client.post("/api/v1/auth/register", json=register_payload)
    refresh = parse_json(reg)["data"]["refresh_token"]
    with app.app_context():
        from app.models import User

        u = User.query.filter_by(email=register_payload["email"].lower()).one()
        from app.extensions import db

        db.session.delete(u)
        db.session.commit()

    resp = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh}"},
    )
    assert resp.status_code == 404


def test_me_user_missing(client, register_payload, mocker, app):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    reg = client.post("/api/v1/auth/register", json=register_payload)
    access = parse_json(reg)["data"]["access_token"]
    with app.app_context():
        from app.models import User
        from app.extensions import db

        u = User.query.filter_by(email=register_payload["email"].lower()).one()
        db.session.delete(u)
        db.session.commit()

    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert resp.status_code == 404


def test_missing_authorization_me(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert parse_json(resp)["error"]["code"] == "unauthorized"


def test_logout_with_blocklist_rejects_subsequent_requests(
    client_blocklist, register_payload, mocker, app_blocklist
):
    mocker.patch("app.routes.auth.send_welcome_email.delay")

    class _FakeRedis:
        def __init__(self):
            self.store: dict[str, str] = {}

        def setex(self, key, _ttl, value):
            self.store[key] = value

        def get(self, key):
            return self.store.get(key)

    fake = _FakeRedis()
    from app.services import token_blocklist

    mocker.patch("app.services.token_blocklist._redis", lambda: fake)
    token_blocklist.reset_client()

    reg = client_blocklist.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201
    data = parse_json(reg)["data"]
    access = data["access_token"]
    refresh = data["refresh_token"]

    out = client_blocklist.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access}"},
        json={"refresh_token": refresh},
    )
    assert out.status_code == 200

    blocked = client_blocklist.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access}"},
    )
    assert blocked.status_code == 401
