"""
Celery worker entrypoint.

Run: celery -A celery_worker.celery worker --loglevel=info
Beat (optional): celery -A celery_worker.celery beat --loglevel=info
"""

from app import create_app
from app.extensions import celery

# Ensure Flask app and Celery bindings load before workers consume tasks.
create_app()

__all__ = ["celery"]
