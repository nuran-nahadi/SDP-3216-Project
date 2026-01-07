"""Data access helpers for task domain."""
from __future__ import annotations

from datetime import datetime, date
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.models.models import Task


class TaskRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Core CRUD helpers
    # ------------------------------------------------------------------
    def list_tasks(
        self,
        user_id: UUID,
        *,
        status_filter: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[datetime] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Tuple[List[Task], int]:
        """Return paginated tasks plus total count for current filters."""
        query = self._base_query(user_id)

        if status_filter:
            query = query.filter(Task.status == status_filter)
        if priority:
            query = query.filter(Task.priority == priority)
        if due_date:
            query = query.filter(func.date(Task.due_date) == due_date.date())
        if start_date and end_date:
            query = query.filter(and_(Task.due_date >= start_date, Task.due_date <= end_date))
        elif start_date:
            query = query.filter(Task.due_date >= start_date)
        elif end_date:
            query = query.filter(Task.due_date <= end_date)
        if tags:
            tag_conditions = [Task.tags.like(f'%"{tag}"%') for tag in tags]
            query = query.filter(or_(*tag_conditions))
        if search:
            like_pattern = f"%{search}%"
            query = query.filter(or_(Task.title.ilike(like_pattern), Task.description.ilike(like_pattern)))

        total = query.count()
        tasks = (
            query.order_by(
                Task.due_date.desc().nullslast(),
                desc(Task.priority == "high"),
                desc(Task.priority == "medium"),
                Task.created_at.desc(),
            )
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return tasks, total

    def get_by_id(self, user_id: UUID, task_id: UUID) -> Optional[Task]:
        """Return a single task for the user or None."""
        return self._base_query(user_id).filter(Task.id == task_id).first()

    def create(self, user_id: UUID, payload: Dict[str, object]) -> Task:
        """Persist a new task and return it."""
        task = Task(user_id=user_id, **payload)
        self._db.add(task)
        self._db.commit()
        self._db.refresh(task)
        return task

    def update(self, task: Task, update_data: Dict[str, object]) -> Task:
        """Apply field updates to an existing task."""
        for key, value in update_data.items():
            setattr(task, key, value)
        self._db.commit()
        self._db.refresh(task)
        return task

    def delete(self, task: Task, *, delete_subtasks: bool = True) -> None:
        """Delete a task (and optionally its subtasks)."""
        if delete_subtasks:
            self._db.query(Task).filter(Task.parent_task_id == task.id).delete()
        self._db.delete(task)
        self._db.commit()

    # ------------------------------------------------------------------
    # Domain-specific helpers
    # ------------------------------------------------------------------
    def list_today(self, user_id: UUID) -> List[Task]:
        today = date.today()
        return (
            self._base_query(user_id)
            .filter(func.date(Task.due_date) == today, Task.status != "completed")
            .order_by(
                desc(Task.priority == "high"),
                desc(Task.priority == "medium"),
                Task.created_at.desc(),
            )
            .all()
        )

    def completed_today_count(self, user_id: UUID) -> int:
        today = date.today()
        return (
            self._base_query(user_id)
            .filter(
                Task.is_completed.is_(True),
                Task.completion_date.isnot(None),
                func.date(Task.completion_date) == today,
            )
            .count()
        )

    def list_overdue(self, user_id: UUID) -> List[Task]:
        now = datetime.now()
        return (
            self._base_query(user_id)
            .filter(Task.due_date < now, Task.status != "completed")
            # Show most recently due tasks first so the latest unfinished items appear at the top
            .order_by(Task.due_date.desc())
            .all()
        )

    def list_for_insights(self, user_id: UUID) -> List[Task]:
        return self._base_query(user_id).all()

    # ------------------------------------------------------------------
    # Transaction helpers
    # ------------------------------------------------------------------
    def rollback(self) -> None:
        self._db.rollback()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _base_query(self, user_id: UUID):
        return self._db.query(Task).filter(Task.user_id == user_id)
