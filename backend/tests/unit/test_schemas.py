"""Marshmallow schema validation rules."""

from __future__ import annotations

import pytest
from marshmallow import ValidationError

from app.schemas import (
    LoginSchema,
    LogoutSchema,
    RegisterSchema,
    TaskCreateSchema,
    TaskUpdateSchema,
)
from app.schemas.user import UserOutSchema

pytestmark = pytest.mark.unit


def test_register_schema_password_rules():
    schema = RegisterSchema()
    base = {
        "name": "Valid Name",
        "email": "a@b.com",
        "password": "Secret123",
        "confirm_password": "Secret123",
    }
    assert schema.load(base)

    with pytest.raises(ValidationError):
        schema.load({**base, "password": "short", "confirm_password": "short"})

    with pytest.raises(ValidationError):
        schema.load({**base, "password": "noupper123", "confirm_password": "noupper123"})

    with pytest.raises(ValidationError):
        schema.load({**base, "password": "NOLOWER123", "confirm_password": "NOLOWER123"})

    with pytest.raises(ValidationError):
        schema.load({**base, "password": "NoDigitsHere", "confirm_password": "NoDigitsHere"})

    with pytest.raises(ValidationError):
        schema.load(
            {
                **base,
                "password": "Secret123",
                "confirm_password": "Secret124",
            }
        )


def test_register_schema_name_too_short():
    with pytest.raises(ValidationError):
        RegisterSchema().load(
            {
                "name": "x",
                "email": "a@b.com",
                "password": "Secret123",
                "confirm_password": "Secret123",
            }
        )


def test_login_schema_requires_email():
    with pytest.raises(ValidationError):
        LoginSchema().load({"password": "x"})


def test_task_create_unknown_fields_stripped():
    data = TaskCreateSchema().load(
        {"title": "T", "description": "d", "evil": "nope"}
    )
    assert "evil" not in data


def test_task_update_partial():
    assert TaskUpdateSchema().load({"completed": True}, partial=True) == {
        "completed": True
    }


def test_logout_schema_optional_refresh():
    assert LogoutSchema().load({}) == {}
    assert LogoutSchema().load({"refresh_token": "tok"}) == {"refresh_token": "tok"}


def test_user_out_schema_dump(app):
    from app.extensions import db
    from app.models import User

    with app.app_context():
        u = User(email="out@example.com", name="Out")
        u.set_password("Secret123")
        db.session.add(u)
        db.session.commit()
        dumped = UserOutSchema().dump(u)
        assert dumped["email"] == "out@example.com"
        assert "created_at" in dumped
