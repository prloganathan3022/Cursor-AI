"""CPU/light DB aggregation jobs — warm caches after writes."""

import logging

from app.extensions import celery
from app.services import task_service

logger = logging.getLogger(__name__)


@celery.task(name="tasks.rebuild_user_stats")
def rebuild_user_task_stats(user_id: int) -> dict:
    """
    Recomputes cached task aggregates for a user.
    Invoked after task mutations so `/tasks/summary` stays fast under load.
    """
    stats = task_service.compute_task_stats(user_id)
    logger.info(
        "celery task done name=tasks.rebuild_user_stats user_id=%s stats=%s",
        user_id,
        stats,
    )
    return stats
