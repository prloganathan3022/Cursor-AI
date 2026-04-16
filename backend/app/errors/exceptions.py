class AppError(Exception):
    """Base application error with HTTP mapping."""

    code = "app_error"
    status_code = 500
    message = "An unexpected error occurred."

    def __init__(self, message: str | None = None, *, details: dict | None = None):
        self.message = message or self.message
        self.details = details or {}
        super().__init__(self.message)


class ValidationAppError(AppError):
    code = "validation_error"
    status_code = 422


class NotFoundError(AppError):
    code = "not_found"
    status_code = 404
    message = "Resource not found."


class ConflictError(AppError):
    code = "conflict"
    status_code = 409
    message = "Resource already exists."


class UnauthorizedError(AppError):
    code = "unauthorized"
    status_code = 401
    message = "Authentication required."


class ForbiddenError(AppError):
    code = "forbidden"
    status_code = 403
    message = "You do not have permission to perform this action."
