"""Unit tests for auth_service (DB + validation errors)."""

from __future__ import annotations

import pytest

from app.errors.exceptions import ConflictError, UnauthorizedError
from app.extensions import db
from app.models import User
from app.services import auth_service

pytestmark = pytest.mark.unit


def test_register_user_normalizes_email_and_strips_name(app):
    with app.app_context():
        user = auth_service.register_user(
            name="  Alice  ",
            email="Alice@EXAMPLE.com",
            password="Secret123",
        )
        assert user.email == "alice@example.com"
        assert user.name == "Alice"


def test_register_user_conflict(app):
    with app.app_context():
        auth_service.register_user(
            name="A",
            email="dup@example.com",
            password="Secret123",
        )
        with pytest.raises(ConflictError):
            auth_service.register_user(
                name="B",
                email="DUP@example.com",
                password="Secret123",
            )


def test_authenticate_success(app):
    with app.app_context():
        auth_service.register_user(
            name="Bob",
            email="bob@example.com",
            password="Secret123",
        )
        user = auth_service.authenticate(
            email="BOB@example.com",
            password="Secret123",
        )
        assert isinstance(user, User)
        assert user.email == "bob@example.com"


def test_authenticate_wrong_password(app):
    with app.app_context():
        auth_service.register_user(
            name="C",
            email="c@example.com",
            password="Secret123",
        )
        with pytest.raises(UnauthorizedError):
            auth_service.authenticate(email="c@example.com", password="wrongPass1")


def test_authenticate_unknown_user(app):
    with app.app_context():
        with pytest.raises(UnauthorizedError):
            auth_service.authenticate(
                email="nobody@example.com",
                password="Secret123",
            )


def test_issue_tokens_contains_claims(app):
    with app.app_context():
        u = User(email="t@example.com", name="T")
        u.set_password("Secret123")
        db.session.add(u)
        db.session.commit()
        tokens = auth_service.issue_tokens(u)
        assert tokens["token_type"] == "Bearer"
        assert "access_token" in tokens and "refresh_token" in tokens
