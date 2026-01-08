"""Compatibility service that delegates to the TaskFacade."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.facades.task_facade import TaskFacade
from app.models.models import User
from app.repositories.task_repository import TaskRepository
from app.schemas.tasks import TaskCreate, TaskUpdate, TaskPriority, TaskStatus


class TaskService:
    """Preserves the historical TaskService API while using the new facade."""

    @staticmethod
    def _facade(db: Session, user: User) -> TaskFacade:
        return TaskFacade(TaskRepository(db), user)

    @staticmethod
    def get_tasks(
        db: Session,
        user: User,
        status_filter: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        due_date: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        return TaskService._facade(db, user).get_tasks(
            status_filter=status_filter,
            priority=priority,
            due_date=due_date,
            start_date=start_date,
            end_date=end_date,
            tags=tags,
            search=search,
            page=page,
            limit=limit,
        )

    @staticmethod
    def create_task(db: Session, user: User, task_data: TaskCreate) -> dict:
        return TaskService._facade(db, user).create_task(task_data)

    @staticmethod
    def get_task_by_id(db: Session, user: User, task_id: UUID) -> dict:
        return TaskService._facade(db, user).get_task(task_id)

    @staticmethod
    def update_task(db: Session, user: User, task_id: UUID, task_data: TaskUpdate) -> dict:
        return TaskService._facade(db, user).update_task(task_id, task_data)

    @staticmethod
    def delete_task(db: Session, user: User, task_id: UUID) -> dict:
        return TaskService._facade(db, user).delete_task(task_id)

    @staticmethod
    def complete_task(db: Session, user: User, task_id: UUID, actual_duration: Optional[int] = None) -> dict:
        return TaskService._facade(db, user).complete_task(task_id, actual_duration)

    @staticmethod
    def get_today_tasks(db: Session, user: User) -> List[dict]:
        return TaskService._facade(db, user).get_today_tasks()["data"]

    @staticmethod
    def get_tasks_completed_today_count(db: Session, user: User) -> int:
        return TaskService._facade(db, user).get_today_task_stats()["data"]["completed_today"]

    @staticmethod
    def get_overdue_tasks(db: Session, user: User) -> List[dict]:
        return TaskService._facade(db, user).get_overdue_tasks()["data"]

    @staticmethod
    def parse_natural_language(text: str) -> dict:
        return TaskFacade.parse_natural_language(text)

    @staticmethod
    async def parse_text_with_ai(db: Session, user: User, text: str) -> dict:
        return await TaskService._facade(db, user).parse_text_with_ai(text)

    @staticmethod
    async def parse_voice_with_ai(db: Session, user: User, audio_file) -> dict:
        return await TaskService._facade(db, user).parse_voice_with_ai(audio_file)
