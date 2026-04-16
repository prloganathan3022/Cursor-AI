"""Security headers (HSTS only when the request is considered secure)."""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.integration


def test_hsts_header_when_https_scheme(client):
    resp = client.get(
        "/api/v1/health",
        environ_overrides={"wsgi.url_scheme": "https"},
    )
    assert resp.headers.get("Strict-Transport-Security")
