"""Logging setup and HTTP middleware behavior."""

from __future__ import annotations

import pytest
from flask import Flask

from app.logging_config import configure_app_logging

pytestmark = pytest.mark.unit


def test_configure_app_logging_sqlalchemy_echo_branch():
    app = Flask(__name__)
    app.debug = False
    app.config["LOG_LEVEL"] = "INFO"
    app.config["SQLALCHEMY_ECHO"] = True
    configure_app_logging(app)


def test_configure_app_logging_no_echo():
    app = Flask(__name__)
    app.debug = False
    app.config["LOG_LEVEL"] = "WARNING"
    app.config["SQLALCHEMY_ECHO"] = False
    configure_app_logging(app)


def test_configure_app_logging_adds_handler_when_debug_and_no_handlers():
    app = Flask(__name__)
    app.debug = True
    app.logger.handlers.clear()
    app.config["LOG_LEVEL"] = "DEBUG"
    app.config["SQLALCHEMY_ECHO"] = False
    configure_app_logging(app)
    assert app.logger.handlers


def test_security_headers_on_api_response(app, client):
    resp = client.get("/api/v1/health")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("X-Request-ID")


def test_api_request_log_branch(app, client, monkeypatch):
    """Middleware reads API_REQUEST_LOG per request; enable without re-registering hooks."""
    monkeypatch.setitem(app.config, "API_REQUEST_LOG", True)
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200


def test_middleware_skips_request_log_for_non_api_paths(app, client, monkeypatch):
    monkeypatch.setitem(app.config, "API_REQUEST_LOG", True)

    @app.route("/nolog")
    def nolog():
        return "ok", 200

    client.get("/nolog")
