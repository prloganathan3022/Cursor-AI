"""Application logging: levels, noisy library tuning."""

from __future__ import annotations

import logging
import sys
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from flask import Flask


def configure_app_logging(app: Flask) -> None:
    """
    Align Flask app logger and common libraries with LOG_LEVEL.
    HTTP access-style lines are emitted from app.middleware (not Werkzeug)
    to include request_id and duration.
    """
    level_name = app.config.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    app.logger.setLevel(level)

    for name in (
        "app.http",
        "app.task_service",
        "app.tasks.email_tasks",
        "app.tasks.processing_tasks",
    ):
        logging.getLogger(name).setLevel(level)

    # Ensure something handles app.logger in minimal setups (e.g. flask run)
    if not app.logger.handlers and app.debug:
        _h = logging.StreamHandler(sys.stdout)
        _h.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )
        app.logger.addHandler(_h)

    # Avoid duplicate "GET /path" lines; we log richer lines for /api/*
    logging.getLogger("werkzeug").setLevel(logging.WARNING)

    # SQLAlchemy SQL stream (set SQLALCHEMY_ECHO=true)
    if app.config.get("SQLALCHEMY_ECHO"):
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
    else:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
