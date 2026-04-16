import os
from datetime import timedelta


class BaseConfig:
    CELERY_TASK_ALWAYS_EAGER = False
    CELERY_TASK_EAGER_PROPAGATES = False

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "30"))
    )
    JWT_TOKEN_LOCATION = ("headers",)
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_BLOCKLIST_ENABLED = os.environ.get("JWT_BLOCKLIST_ENABLED", "true").lower() in (
        "1",
        "true",
        "yes",
    )

    # Security / observability
    ENABLE_SECURITY_HEADERS = os.environ.get("ENABLE_SECURITY_HEADERS", "true").lower() in (
        "1",
        "true",
        "yes",
    )
    READINESS_CHECK_REDIS = os.environ.get("READINESS_CHECK_REDIS", "true").lower() in (
        "1",
        "true",
        "yes",
    )

    RATELIMIT_STORAGE_URI = os.environ.get(
        "RATELIMIT_STORAGE_URI",
        os.environ.get("REDIS_URL", "memory://"),
    )
    RATELIMIT_ENABLED = os.environ.get("RATELIMIT_ENABLED", "true").lower() in (
        "1",
        "true",
        "yes",
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 900,
    }

    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CACHE_DEFAULT_TIMEOUT = int(os.environ.get("CACHE_DEFAULT_TIMEOUT", "300"))

    CELERY_BROKER_URL = os.environ.get(
        "CELERY_BROKER_URL", "redis://localhost:6379/1"
    )
    CELERY_RESULT_BACKEND = os.environ.get(
        "CELERY_RESULT_BACKEND", "redis://localhost:6379/2"
    )

    MAIL_FROM = os.environ.get("MAIL_FROM", "noreply@example.com")
    SMTP_HOST = os.environ.get("SMTP_HOST")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
    SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").lower() in (
        "1",
        "true",
        "yes",
    )

    # Comma-separated origins, e.g. "http://localhost:5173,https://app.example.com"
    _cors = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
    CORS_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

    CREATE_TABLES_ON_STARTUP = False

    # Logging: DEBUG, INFO, WARNING, ERROR
    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
    # One structured line per /api/* response (method, path, status, duration, request_id)
    API_REQUEST_LOG = os.environ.get("API_REQUEST_LOG", "true").lower() in (
        "1",
        "true",
        "yes",
    )
    SQLALCHEMY_ECHO = os.environ.get("SQLALCHEMY_ECHO", "").lower() in (
        "1",
        "true",
        "yes",
    )


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///instance/app.db"
    )
    # Use Alembic (`flask db upgrade`) for schema; set true only for quick hacks.
    CREATE_TABLES_ON_STARTUP = os.environ.get("CREATE_TABLES_ON_STARTUP", "").lower() in (
        "1",
        "true",
        "yes",
    )


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]


class TestingConfig(BaseConfig):
    TESTING = True
    LOG_LEVEL = "WARNING"
    API_REQUEST_LOG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    CACHE_TYPE = "SimpleCache"
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
    WTF_CSRF_ENABLED = False
    JWT_BLOCKLIST_ENABLED = False
    READINESS_CHECK_REDIS = False
    RATELIMIT_ENABLED = False


class BlocklistTestingConfig(TestingConfig):
    """Same as testing but JWT revocation checks enabled (Redis mocked in tests)."""

    JWT_BLOCKLIST_ENABLED = True


def get_config(name: str | None):
    mapping = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig,
        "blocklist_testing": BlocklistTestingConfig,
    }
    env = (name or os.environ.get("FLASK_ENV") or "development").lower()
    return mapping.get(env, DevelopmentConfig)

