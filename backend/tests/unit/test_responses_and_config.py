"""Response envelope helpers and configuration resolution."""

from __future__ import annotations

import pytest

from app.config import DevelopmentConfig, TestingConfig, get_config
from app.utils.responses import error_response, success_response

pytestmark = pytest.mark.unit


def test_success_response_shape(app):
    with app.test_request_context("/"):
        body, status = success_response({"x": 1}, meta={"extra": "y"}, status=201)
        assert status == 201
        payload = body.get_json()
        assert payload["success"] is True
        assert payload["data"] == {"x": 1}
        assert payload["error"] is None
        assert payload["meta"]["extra"] == "y"
        assert payload["meta"]["request_id"]


def test_error_response_shape(app):
    with app.test_request_context("/"):
        body, status = error_response(
            code="test_code",
            message="hello",
            status=400,
            details={"a": 1},
        )
        assert status == 400
        payload = body.get_json()
        assert payload["success"] is False
        assert payload["data"] is None
        assert payload["error"]["code"] == "test_code"
        assert payload["error"]["details"] == {"a": 1}


def test_get_config_testing():
    assert get_config("testing") is TestingConfig


def test_get_config_unknown_falls_back_to_development():
    assert get_config("not-a-real-env") is DevelopmentConfig


def test_get_config_production():
    from app.config import ProductionConfig

    assert get_config("production") is ProductionConfig
