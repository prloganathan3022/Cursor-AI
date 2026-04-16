from celery import Celery
from flask_caching import Cache
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_marshmallow import Marshmallow
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()
cache = Cache()
celery = Celery(__name__)
limiter = Limiter(key_func=get_remote_address, default_limits=[])


def init_celery(app):
    """Bind Celery to Flask app context for tasks."""
    celery.conf.update(
        broker_url=app.config["CELERY_BROKER_URL"],
        result_backend=app.config["CELERY_RESULT_BACKEND"],
        task_ignore_result=False,
        task_track_started=True,
        broker_connection_retry_on_startup=True,
        task_always_eager=app.config.get("CELERY_TASK_ALWAYS_EAGER", False),
        task_eager_propagates=app.config.get("CELERY_TASK_EAGER_PROPAGATES", False),
    )
    celery.conf.imports = (
        "app.tasks.email_tasks",
        "app.tasks.processing_tasks",
    )

    class ContextTask(celery.Task):
        abstract = True

        def __call__(self, *args, **kwargs):
            with app.app_context():
                return super().__call__(*args, **kwargs)

    celery.Task = ContextTask
    return celery
