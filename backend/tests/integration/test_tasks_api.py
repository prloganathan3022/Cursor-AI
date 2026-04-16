"""Task HTTP API integration tests."""

from __future__ import annotations

import pytest

from tests.helpers import parse_json

pytestmark = pytest.mark.integration


def test_task_crud_and_summary(client, auth_headers, mocker):
    mocker.patch("app.routes.tasks.rebuild_user_task_stats.delay")
    create = client.post(
        "/api/v1/tasks",
        json={"title": "Buy milk", "description": "2%"},
        headers=auth_headers,
    )
    assert create.status_code == 201
    task = parse_json(create)["data"]
    tid = task["id"]

    list_resp = client.get("/api/v1/tasks", headers=auth_headers)
    assert list_resp.status_code == 200
    tasks = parse_json(list_resp)["data"]["tasks"]
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Buy milk"

    summary = client.get("/api/v1/tasks/summary", headers=auth_headers)
    assert summary.status_code == 200
    stats = parse_json(summary)["data"]
    assert stats["total"] == 1
    assert stats["active"] == 1

    one = client.get(f"/api/v1/tasks/{tid}", headers=auth_headers)
    assert one.status_code == 200

    patched = client.patch(
        f"/api/v1/tasks/{tid}",
        json={"completed": True},
        headers=auth_headers,
    )
    assert patched.status_code == 200
    assert parse_json(patched)["data"]["completed"] is True

    deleted = client.delete(f"/api/v1/tasks/{tid}", headers=auth_headers)
    assert deleted.status_code == 200
    missing = client.get(f"/api/v1/tasks/{tid}", headers=auth_headers)
    assert missing.status_code == 404


def test_task_not_found_other_user(client, auth_headers, register_payload, mocker):
    mocker.patch("app.routes.auth.send_welcome_email.delay")
    mocker.patch("app.routes.tasks.rebuild_user_task_stats.delay")

    reg = client.post(
        "/api/v1/auth/register",
        json={
            **register_payload,
            "email": "other@example.com",
            "name": "Other User",
        },
    )
    other_access = parse_json(reg)["data"]["access_token"]
    create = client.post(
        "/api/v1/tasks",
        json={"title": "Secret"},
        headers={"Authorization": f"Bearer {other_access}"},
    )
    tid = parse_json(create)["data"]["id"]

    resp = client.get(f"/api/v1/tasks/{tid}", headers=auth_headers)
    assert resp.status_code == 404
