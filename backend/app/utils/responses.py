from flask import Response, g, jsonify
from typing import Any


def _meta(extra: dict | None = None) -> dict:
    base = {"request_id": getattr(g, "request_id", None)}
    if extra:
        base.update(extra)
    return base


def success_response(
    data: Any = None,
    *,
    meta: dict | None = None,
    status: int = 200,
) -> tuple[Response, int]:
    body = {
        "success": True,
        "data": data,
        "error": None,
        "meta": _meta(meta),
    }
    return jsonify(body), status


def error_response(
    *,
    code: str,
    message: str,
    status: int,
    details: dict | list | None = None,
) -> tuple[Response, int]:
    body = {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
        "meta": _meta(),
    }
    return jsonify(body), status
