"""Werkzeug HTTP exceptions map to the JSON error envelope."""

from __future__ import annotations

import pytest

from tests.helpers import parse_json

pytestmark = pytest.mark.integration


def test_unknown_route_returns_json_not_found(client):
    resp = client.get("/api/v1/no-such-route")
    assert resp.status_code == 404
    body = parse_json(resp)
    assert body["success"] is False
    assert body["error"]["code"] == "not_found"
