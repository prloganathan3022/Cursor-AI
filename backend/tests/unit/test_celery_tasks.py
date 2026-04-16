"""Celery task modules (SMTP and stats) with external I/O mocked."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.extensions import db
from app.models import User
from app.tasks.email_tasks import send_welcome_email
from app.tasks.processing_tasks import rebuild_user_task_stats

pytestmark = pytest.mark.unit


def test_send_welcome_email_user_missing(app):
    with app.app_context():
        assert send_welcome_email.run(999_999) == "skipped"


def test_send_welcome_email_simulated_without_smtp(app):
    with app.app_context():
        u = User(email="welcome@example.com", name="W")
        u.set_password("Secret123")
        db.session.add(u)
        db.session.commit()
        app.config["SMTP_HOST"] = None
        assert send_welcome_email.run(u.id) == "simulated"


def test_send_welcome_email_sends_with_mock_smtp(app, monkeypatch):
    with app.app_context():
        u = User(email="smtp@example.com", name="S")
        u.set_password("Secret123")
        db.session.add(u)
        db.session.commit()
        app.config["SMTP_HOST"] = "smtp.example.com"
        app.config["SMTP_PORT"] = 587
        app.config["SMTP_USE_TLS"] = True
        app.config["MAIL_FROM"] = "from@example.com"

        mock_smtp = MagicMock()
        mock_smtp.__enter__ = MagicMock(return_value=mock_smtp)
        mock_smtp.__exit__ = MagicMock(return_value=None)
        monkeypatch.setattr(
            "app.tasks.email_tasks.smtplib.SMTP",
            MagicMock(return_value=mock_smtp),
        )
        assert send_welcome_email.run(u.id) == "sent"
        mock_smtp.send_message.assert_called_once()


def test_rebuild_user_task_stats(app):
    with app.app_context():
        u = User(email="stats@example.com", name="S")
        u.set_password("Secret123")
        db.session.add(u)
        db.session.commit()
        out = rebuild_user_task_stats.run(u.id)
        assert out["total"] == 0
