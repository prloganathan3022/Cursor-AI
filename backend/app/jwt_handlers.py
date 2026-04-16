from flask_jwt_extended import JWTManager

from app.services import token_blocklist
from app.utils.responses import error_response


def register_jwt_error_handlers(jwt: JWTManager) -> None:
    @jwt.expired_token_loader
    def _expired(_jwt_header, _jwt_payload):
        return error_response(
            code="token_expired",
            message="The access token has expired.",
            status=401,
        )

    @jwt.invalid_token_loader
    def _invalid(reason: str):
        return error_response(
            code="invalid_token",
            message=reason or "Invalid token.",
            status=401,
        )

    @jwt.unauthorized_loader
    def _missing(reason: str):
        return error_response(
            code="unauthorized",
            message=reason or "Authorization required.",
            status=401,
        )


def register_jwt_blocklist(jwt: JWTManager, app) -> None:
    if not app.config.get("JWT_BLOCKLIST_ENABLED"):
        return

    @jwt.token_in_blocklist_loader
    def _is_revoked(_jwt_header, jwt_payload: dict) -> bool:
        return token_blocklist.is_jti_revoked(jwt_payload.get("jti"))
