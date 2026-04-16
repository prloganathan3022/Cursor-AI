from flask import Flask

from app.routes.auth import bp as auth_bp
from app.routes.health import bp as health_bp
from app.routes.tasks import bp as tasks_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/v1/tasks")
