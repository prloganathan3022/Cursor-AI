import uuid

from flask import Flask, g, request
from flask_limiter.errors import RateLimitExceeded
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from app.errors.exceptions import AppError
from app.utils.responses import error_response


def register_error_handlers(app: Flask) -> None:
    @app.before_request
    def _set_request_id():
        g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

    @app.errorhandler(AppError)
    def handle_app_error(err: AppError):
        return error_response(
            code=err.code,
            message=err.message,
            status=err.status_code,
            details=err.details or None,
        )

    @app.errorhandler(ValidationError)
    def handle_marshmallow_validation(err: ValidationError):
        return error_response(
            code="validation_error",
            message="Request validation failed.",
            status=422,
            details={"fields": err.messages},
        )

    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit(err: RateLimitExceeded):
        return error_response(
            code="rate_limited",
            message="Too many requests. Please try again later.",
            status=429,
            details={"retry_after": getattr(err, "retry_after", None)},
        )

    @app.errorhandler(IntegrityError)
    def handle_integrity(_err: IntegrityError):
        return error_response(
            code="integrity_error",
            message="This operation conflicts with existing data (e.g. duplicate key).",
            status=409,
        )

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        if err.code is None:
            return error_response(
                code="http_error",
                message="Request failed.",
                status=500,
            )
        return error_response(
            code=err.name.lower().replace(" ", "_"),
            message=err.description or err.name,
            status=err.code,
        )

    @app.errorhandler(Exception)
    def handle_unexpected(err: Exception):
        app.logger.exception("Unhandled error: %s", err)
        return error_response(
            code="internal_error",
            message="An unexpected error occurred.",
            status=500,
        )
