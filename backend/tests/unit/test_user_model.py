"""User model helpers."""

from __future__ import annotations

import pytest

from app.extensions import db
from app.models import User

pytestmark = pytest.mark.unit


def test_set_and_check_password(app):
    with app.app_context():
        u = User(email="pw@example.com", name="P")
        u.set_password("Secret123")
        assert u.check_password("Secret123")
        assert not u.check_password("wrong")
