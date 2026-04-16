import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from app.config import get_config
from app.errors.handlers import register_error_handlers
from app.extensions import cache, db, init_celery, jwt, limiter, ma
from app.jwt_handlers import register_jwt_blocklist, register_jwt_error_handlers
from app.logging_config import configure_app_logging
from app.middleware import register_middleware
from app.routes import register_blueprints

load_dotenv()

migrate = Migrate()


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)

    cfg = get_config(config_name)
    app.config.from_object(cfg)

    configure_app_logging(app)

    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    cache.init_app(app)
    migrate.init_app(app, db)

    limiter.init_app(app)

    init_celery(app)

    register_jwt_error_handlers(jwt)
    register_jwt_blocklist(jwt, app)
    register_error_handlers(app)
    register_middleware(app)
    register_blueprints(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    if app.config.get("CREATE_TABLES_ON_STARTUP"):
        with app.app_context():
            db.create_all()

    return app
