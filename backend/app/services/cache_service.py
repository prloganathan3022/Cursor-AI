"""Cache key helpers and invalidation — keeps Redis usage consistent."""

TASK_LIST_VERSION = "v1"


def task_list_cache_key(user_id: int) -> str:
    return f"{TASK_LIST_VERSION}:tasks:list:user:{user_id}"


def user_stats_cache_key(user_id: int) -> str:
    return f"{TASK_LIST_VERSION}:tasks:stats:user:{user_id}"
