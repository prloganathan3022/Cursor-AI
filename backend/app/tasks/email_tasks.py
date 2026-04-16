"""Example asynchronous email delivery — integrates SMTP when configured."""

import logging
import smtplib
from email.message import EmailMessage

from flask import current_app

from app.extensions import celery, db
from app.models import User

logger = logging.getLogger(__name__)


@celery.task(bind=True, name="email.send_welcome", max_retries=3, default_retry_delay=30)
def send_welcome_email(self, user_id: int) -> str:
    """
    Sends a welcome message. If SMTP is not configured, logs and succeeds
    (safe for local/dev — wire real credentials via environment in production).
    """
    logger.info("celery task start name=email.send_welcome user_id=%s", user_id)
    user = db.session.get(User, user_id)
    if not user:
        logger.warning("send_welcome_email: user %s not found", user_id)
        return "skipped"

    subject = "Welcome to Task Management"
    body = (
        f"Hi {user.name},\n\n"
        "Your account is ready. You can create and track tasks from the dashboard.\n"
    )

    smtp_host = current_app.config.get("SMTP_HOST")
    if not smtp_host:
        logger.info(
            "[email] SMTP_HOST not set — welcome email to %s (simulated)",
            user.email,
        )
        return "simulated"

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = current_app.config["MAIL_FROM"]
        msg["To"] = user.email
        msg.set_content(body)

        port = int(current_app.config.get("SMTP_PORT", "587"))
        use_tls = str(current_app.config.get("SMTP_USE_TLS", "true")).lower() in (
            "1",
            "true",
            "yes",
        )
        with smtplib.SMTP(smtp_host, port, timeout=30) as smtp:
            if use_tls:
                smtp.starttls()
            user_s = current_app.config.get("SMTP_USER")
            password = current_app.config.get("SMTP_PASSWORD")
            if user_s and password:
                smtp.login(user_s, password)
            smtp.send_message(msg)
        logger.info("Welcome email sent to %s", user.email)
        return "sent"
    except Exception as exc:  # pragma: no cover - network
        logger.exception("SMTP error: %s", exc)
        raise self.retry(exc=exc)
