from flask import Blueprint, current_app, request
from flask_jwt_extended import (
    create_access_token,
    decode_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.errors.exceptions import NotFoundError
from app.extensions import db, limiter
from app.models import User
from app.schemas import LoginSchema, LogoutSchema, RegisterSchema, UserOutSchema
from app.services import auth_service
from app.services import token_blocklist
from app.tasks.email_tasks import send_welcome_email
from app.utils.responses import success_response

bp = Blueprint("auth", __name__)


@bp.post("/register")
@limiter.limit("5 per minute")
def register():
    data = RegisterSchema().load(request.get_json(silent=True) or {})
    user = auth_service.register_user(
        name=data["name"],
        email=data["email"],
        password=data["password"],
    )
    send_welcome_email.delay(user.id)
    current_app.logger.info(
        "auth.register ok user_id=%s email=%s | celery enqueued=email.send_welcome",
        user.id,
        user.email,
    )
    tokens = auth_service.issue_tokens(user)
    body = {
        "user": UserOutSchema().dump(user),
        **tokens,
    }
    return success_response(body, status=201)


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    data = LoginSchema().load(request.get_json(silent=True) or {})
    user = auth_service.authenticate(
        email=data["email"],
        password=data["password"],
    )
    tokens = auth_service.issue_tokens(user)
    current_app.logger.info("auth.login ok user_id=%s email=%s", user.id, user.email)
    body = {
        "user": UserOutSchema().dump(user),
        **tokens,
    }
    return success_response(body)


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if not user:
        raise NotFoundError("User not found.")
    additional = {"email": user.email, "name": user.name}
    tokens = {
        "access_token": create_access_token(
            identity=str(user.id), additional_claims=additional
        ),
        "token_type": "Bearer",
    }
    current_app.logger.info("auth.refresh ok user_id=%s", user.id)
    return success_response(tokens)


@bp.post("/logout")
@jwt_required()
def logout():
    """
    Revokes the current access token (and optional refresh token) via Redis blocklist.
    Clients should discard tokens locally after success.
    """
    access = get_jwt()
    jti = access.get("jti")
    exp = access.get("exp")
    if jti and exp is not None:
        token_blocklist.revoke_jti(jti, exp)

    data = LogoutSchema().load(request.get_json(silent=True) or {})
    refresh_raw = data.get("refresh_token")
    if refresh_raw:
        try:
            refresh = decode_token(refresh_raw)
            rjti = refresh.get("jti")
            rexp = refresh.get("exp")
            if rjti and rexp is not None:
                token_blocklist.revoke_jti(rjti, rexp)
        except Exception:  # noqa: BLE001 — invalid/expired refresh still completes logout
            pass

    current_app.logger.info("auth.logout user_id=%s", get_jwt_identity())
    return success_response({"logged_out": True})


@bp.get("/me")
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    user = db.session.get(User, uid)
    if not user:
        raise NotFoundError("User not found.")
    return success_response(UserOutSchema().dump(user))
