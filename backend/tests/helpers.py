"""Small helpers for assertions and JSON bodies."""

from __future__ import annotations

import json
from typing import Any

from flask.testing import FlaskClient


def parse_json(response) -> dict[str, Any]:
    return json.loads(response.get_data(as_text=True))


def assert_envelope_success(body: dict) -> dict:
    assert body["success"] is True
    assert body["error"] is None
    assert "meta" in body and "request_id" in body["meta"]
    return body["data"]


def assert_envelope_error(
    body: dict, *, code: str, message_substr: str | None = None
) -> dict:
    assert body["success"] is False
    assert body["data"] is None
    err = body["error"]
    assert err["code"] == code
    if message_substr:
        assert message_substr in err["message"]
    return err


def post_json(client: FlaskClient, path: str, payload: dict | None, **kwargs):
    return client.post(path, json=payload, **kwargs)
