"""WSGI entrypoint for production (gunicorn: gunicorn wsgi:app)."""

from app import create_app

app = create_app()
