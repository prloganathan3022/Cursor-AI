"""Shared fixtures: Flask app, database lifecycle, auth helpers."""

from __future__ import annotations

import json
from collections.abc import Generator
from typing import Any

import pytest

from app import create_app
from app.extensions import db
from app.services import token_blocklist


@pytest.fixture(autouse=True)
def _reset_token_blocklist_redis_client():
    yield
    token_blocklist.reset_client()


@pytest.fixture
def app() -> Generator:
    application = create_app("testing")
    with application.app_context():
        db.create_all()
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _json(resp):
    return json.loads(resp.get_data(as_text=True))


@pytest.fixture
def register_payload() -> dict[str, Any]:
    return {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "Secret123",
        "confirm_password": "Secret123",
    }


@pytest.fixture
def registered_user(client, register_payload, mocker):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    reg = client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201, reg.get_data(as_text=True)
    data = _json(reg)["data"]
    return {
        "user": data["user"],
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
    }


@pytest.fixture
def auth_headers(registered_user) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {registered_user['access_token']}",
    }


@pytest.fixture
def app_blocklist() -> Generator:
    application = create_app("blocklist_testing")
    with application.app_context():
        db.create_all()
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client_blocklist(app_blocklist):
    return app_blocklist.test_client()
