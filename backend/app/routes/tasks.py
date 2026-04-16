from flask import Blueprint, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.schemas.task import TaskCreateSchema, TaskOutSchema, TaskUpdateSchema
from app.services import task_service
from app.tasks.processing_tasks import rebuild_user_task_stats
from app.utils.responses import success_response

bp = Blueprint("tasks", __name__)


def _current_user_id() -> int:
    return int(get_jwt_identity())


@bp.get("")
@jwt_required()
def list_tasks():
    uid = _current_user_id()
    tasks = task_service.list_tasks_for_user(uid)
    current_app.logger.info(
        "tasks.list user_id=%s returned=%s", uid, len(tasks)
    )
    return success_response({"tasks": tasks})


@bp.get("/summary")
@jwt_required()
def task_summary():
    uid = _current_user_id()
    stats = task_service.get_task_stats(uid)
    current_app.logger.info("tasks.summary user_id=%s stats=%s", uid, stats)
    return success_response(stats)


@bp.post("")
@jwt_required()
def create_task():
    uid = _current_user_id()
    data = TaskCreateSchema().load(request.get_json(silent=True) or {})
    task = task_service.create_task(
        user_id=uid,
        title=data["title"],
        description=data.get("description") or "",
    )
    rebuild_user_task_stats.delay(uid)
    current_app.logger.info(
        "tasks.create ok user_id=%s task_id=%s | celery enqueued=tasks.rebuild_user_stats",
        uid,
        task.id,
    )
    return success_response(TaskOutSchema().dump(task), status=201)


@bp.get("/<int:task_id>")
@jwt_required()
def get_task(task_id: int):
    uid = _current_user_id()
    task = task_service.get_task_for_user(task_id, uid)
    current_app.logger.info("tasks.get user_id=%s task_id=%s", uid, task_id)
    return success_response(TaskOutSchema().dump(task))


@bp.patch("/<int:task_id>")
@jwt_required()
def patch_task(task_id: int):
    task = task_service.get_task_for_user(task_id, _current_user_id())
    data = TaskUpdateSchema().load(
        request.get_json(silent=True) or {},
        partial=True,
    )
    task = task_service.update_task(
        task,
        title=data.get("title"),
        description=data.get("description"),
        completed=data.get("completed"),
    )
    rebuild_user_task_stats.delay(task.user_id)
    current_app.logger.info(
        "tasks.patch ok user_id=%s task_id=%s | celery enqueued=tasks.rebuild_user_stats",
        task.user_id,
        task.id,
    )
    return success_response(TaskOutSchema().dump(task))


@bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id: int):
    task = task_service.get_task_for_user(task_id, _current_user_id())
    uid = task.user_id
    task_service.delete_task(task)
    rebuild_user_task_stats.delay(uid)
    current_app.logger.info(
        "tasks.delete ok user_id=%s task_id=%s | celery enqueued=tasks.rebuild_user_stats",
        uid,
        task_id,
    )
    return success_response({"deleted": True}, status=200)
