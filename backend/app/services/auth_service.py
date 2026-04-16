from __future__ import annotations

from flask_jwt_extended import create_access_token, create_refresh_token

from app.errors.exceptions import ConflictError, UnauthorizedError
from app.extensions import db
from app.models import User


def register_user(*, name: str, email: str, password: str) -> User:
    normalized = email.strip().lower()
    if User.query.filter_by(email=normalized).first():
        raise ConflictError("An account with this email already exists.")

    user = User(email=normalized, name=name.strip())
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(*, email: str, password: str) -> User:
    normalized = email.strip().lower()
    user = User.query.filter_by(email=normalized).first()
    if not user or not user.check_password(password):
        raise UnauthorizedError("Invalid email or password.")
    return user


def issue_tokens(user: User) -> dict:
    identity = str(user.id)
    additional = {"email": user.email, "name": user.name}
    return {
        "access_token": create_access_token(identity=identity, additional_claims=additional),
        "refresh_token": create_refresh_token(identity=identity),
        "token_type": "Bearer",
    }
