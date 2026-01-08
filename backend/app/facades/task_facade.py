"""Facade for orchestrating task workflows."""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile, status

from app.models.models import User
from app.repositories.task_repository import TaskRepository
from app.schemas.tasks import (
    TaskCreate,
    TaskOut,
    TaskPriority,
    TaskStatus,
    TaskUpdate,
)
from app.services.ai_rate_limit import ai_rate_limit
from app.services.ai_service import ai_service


def _facade_user_key(instance, *_args, **_kwargs) -> str:
    """Build a stable rate-limit key using the bound user's id."""
    user = getattr(instance, "_user", None)
    user_id = getattr(user, "id", "anonymous")
    return f"user:{user_id}"


class TaskFacade:
    """Coordinates repository calls and ancillary validation for tasks."""

    def __init__(self, repository: TaskRepository, user: User) -> None:
        self._repository = repository
        self._user = user

    # ------------------------------------------------------------------
    # CRUD operations
    # ------------------------------------------------------------------
    def get_tasks(
        self,
        *,
        status_filter: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        due_date: Optional[datetime] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tags: Optional[list[str]] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> dict:
        tasks, total = self._repository.list_tasks(
            self._user.id,
            status_filter=getattr(status_filter, "value", status_filter),
            priority=getattr(priority, "value", priority),
            due_date=due_date,
            start_date=start_date,
            end_date=end_date,
            tags=tags,
            search=search,
            page=page,
            limit=limit,
        )

        task_list = [TaskOut.model_validate(task) for task in tasks]
        return {
            "success": True,
            "data": task_list,
            "message": f"Retrieved {len(task_list)} tasks",
            "meta": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit,
            },
        }

    def create_task(self, task_data: TaskCreate) -> dict:
        if task_data.parent_task_id:
            parent = self._repository.get_by_id(self._user.id, task_data.parent_task_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent task not found",
                )

        payload = {
            "title": task_data.title,
            "description": task_data.description,
            "due_date": task_data.due_date,
            "priority": task_data.priority.value,
            "status": task_data.status.value,
            "estimated_duration": task_data.estimated_duration,
            "tags": json.dumps(task_data.tags) if task_data.tags else None,
            "parent_task_id": task_data.parent_task_id,
        }

        try:
            task = self._repository.create(self._user.id, payload)
            return {
                "success": True,
                "data": TaskOut.model_validate(task),
                "message": "Task created successfully",
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create task: {exc}",
            ) from exc

    def get_task(self, task_id: UUID) -> dict:
        task = self._repository.get_by_id(self._user.id, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )
        return {
            "success": True,
            "data": TaskOut.model_validate(task),
            "message": "Task retrieved successfully",
        }

    def update_task(self, task_id: UUID, task_data: TaskUpdate) -> dict:
        task = self._repository.get_by_id(self._user.id, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        if task_data.parent_task_id:
            parent = self._repository.get_by_id(self._user.id, task_data.parent_task_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent task not found",
                )

        update_data = task_data.model_dump(exclude_unset=True)
        if "tags" in update_data:
            update_data["tags"] = json.dumps(update_data["tags"]) if update_data["tags"] else None
        if "priority" in update_data and update_data["priority"]:
            update_data["priority"] = update_data["priority"].value
        if "status" in update_data and update_data["status"]:
            update_data["status"] = update_data["status"].value

        if task_data.status:
            if task_data.status == TaskStatus.completed:
                update_data["is_completed"] = True
                if not task.completion_date:
                    update_data["completion_date"] = datetime.utcnow()
            else:
                update_data["is_completed"] = False
                update_data["completion_date"] = None

        try:
            updated = self._repository.update(task, update_data)
            return {
                "success": True,
                "data": TaskOut.model_validate(updated),
                "message": "Task updated successfully",
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update task: {exc}",
            ) from exc

    def delete_task(self, task_id: UUID) -> dict:
        task = self._repository.get_by_id(self._user.id, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )
        try:
            self._repository.delete(task, delete_subtasks=True)
            return {
                "success": True,
                "message": "Task deleted successfully",
                "data": None,
            }
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete task: {exc}",
            ) from exc

    def complete_task(self, task_id: UUID, actual_duration: Optional[int] = None) -> dict:
        task = self._repository.get_by_id(self._user.id, task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        update_data = {
            "status": TaskStatus.completed.value,
            "is_completed": True,
            "completion_date": datetime.utcnow(),
        }
        if actual_duration:
            update_data["actual_duration"] = actual_duration

        updated = self._repository.update(task, update_data)
        return {
            "success": True,
            "data": TaskOut.model_validate(updated),
            "message": "Task marked as completed",
        }

    # ------------------------------------------------------------------
    # Listing helpers
    # ------------------------------------------------------------------
    def get_today_tasks(self) -> dict:
        tasks = self._repository.list_today(self._user.id)
        task_list = [TaskOut.model_validate(task) for task in tasks]
        return {
            "success": True,
            "data": task_list,
            "message": "Today's tasks retrieved successfully",
            "meta": {"count": len(task_list)},
        }

    def get_today_task_stats(self) -> dict:
        completed_today = self._repository.completed_today_count(self._user.id)
        return {
            "success": True,
            "data": {"completed_today": completed_today},
            "message": "Today's task statistics retrieved successfully",
            "meta": {},
        }

    def get_overdue_tasks(self) -> dict:
        tasks = self._repository.list_overdue(self._user.id)
        task_list = [TaskOut.model_validate(task) for task in tasks]
        return {
            "success": True,
            "data": task_list,
            "message": "Overdue tasks retrieved successfully",
            "meta": {"count": len(task_list)},
        }

    # ------------------------------------------------------------------
    # Natural language parsing
    # ------------------------------------------------------------------
    @staticmethod
    def parse_natural_language(text: str) -> dict:
        """Simple keyword-based parser (non-AI)."""
        result = {
            "title": "",
            "description": None,
            "due_date": None,
            "priority": "medium",
            "tags": [],
        }

        text_lower = text.lower()
        title_indicators = ["by", "on", "before", "at", "due", "tomorrow", "today", "next"]
        title_parts = text.split()
        title_end = len(title_parts)
        for i, word in enumerate(title_parts):
            if word.lower() in title_indicators:
                title_end = i
                break
        result["title"] = " ".join(title_parts[:title_end]).strip()

        if any(word in text_lower for word in ["urgent", "important", "asap", "high priority"]):
            result["priority"] = "high"
        elif any(word in text_lower for word in ["low priority", "when possible", "sometime"]):
            result["priority"] = "low"

        if "tomorrow" in text_lower:
            result["due_date"] = (datetime.now() + timedelta(days=1)).isoformat()
        elif "today" in text_lower:
            result["due_date"] = datetime.now().isoformat()
        elif "next week" in text_lower:
            result["due_date"] = (datetime.now() + timedelta(weeks=1)).isoformat()

        if "#" in text:
            import re  # Local import to avoid unused dependency when not needed
            tags = re.findall(r"#(\w+)", text)
            result["tags"] = tags

        return result

    # ------------------------------------------------------------------
    # AI-powered helpers
    # ------------------------------------------------------------------
    @ai_rate_limit(feature="tasks:parse_text", key_param=_facade_user_key)
    async def parse_text_with_ai(self, text: str) -> dict:
        try:
            parsed_data = await ai_service.parse_text_task(text)
            if not parsed_data.get("is_task_related", True):
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": None,
                    "confidence": 0,
                    "message": parsed_data.get(
                        "message",
                        'Please provide a valid task description. For example: "Finish the project report by Friday" or "Call the bank tomorrow".',
                    ),
                }
            if parsed_data.get("confidence", 0) < 0.5:
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": parsed_data,
                    "confidence": parsed_data.get("confidence", 0),
                    "message": "Low confidence in parsing. Please provide more details about your task (title, due date, etc.).",
                }
            return {
                "success": True,
                "data": parsed_data,
                "confidence": parsed_data.get("confidence", 0.8),
                "message": "Task parsed successfully",
            }
        except Exception as exc:
            return {
                "success": False,
                "data": None,
                "parsed_data": None,
                "confidence": 0,
                "message": f"Error parsing text: {exc}",
            }

    @ai_rate_limit(feature="tasks:parse_voice", key_param=_facade_user_key)
    async def parse_voice_with_ai(self, audio_file: UploadFile) -> dict:
        try:
            parsed_data = await ai_service.parse_voice_task(audio_file)
            if parsed_data.get("confidence", 0) < 0.5:
                return {
                    "success": False,
                    "data": None,
                    "parsed_data": parsed_data,
                    "confidence": parsed_data.get("confidence", 0),
                    "transcribed_text": parsed_data.get("transcribed_text"),
                    "message": "Low confidence in voice parsing. Please speak more clearly.",
                }
            return {
                "success": True,
                "data": parsed_data,
                "confidence": parsed_data.get("confidence", 0.8),
                "transcribed_text": parsed_data.get("transcribed_text"),
                "message": "Task parsed successfully from voice",
            }
        except Exception as exc:
            return {
                "success": False,
                "data": None,
                "parsed_data": None,
                "confidence": 0,
                "transcribed_text": None,
                "message": f"Error parsing voice: {exc}",
            }

    async def get_ai_insights(self) -> dict:
        tasks = self._repository.list_for_insights(self._user.id)
        if not tasks:
            return {
                "success": True,
                "data": {},
                "message": "No tasks found for insights.",
                "meta": {},
            }

        now = datetime.now()
        week_start = now - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=6)
        today = now.date()

        stats = {
            "total_tasks": len(tasks),
            "completed_tasks": 0,
            "failed_tasks": 0,
            "pending_tasks": 0,
            "in_progress_tasks": 0,
            "cancelled_tasks": 0,
            "completed_today": 0,
            "failed_today": 0,
            "completed_this_week": 0,
            "failed_this_week": 0,
            "high_priority_missed_this_week": [],
            "recurring_missed": [],
            "recurring_completed": [],
            "recurring_total": 0,
            "tasks_per_day": defaultdict(int),
            "completed_per_day": defaultdict(int),
            "failed_per_day": defaultdict(int),
        }

        for task in tasks:
            due = task.due_date.date() if task.due_date else None
            completed = task.completion_date.date() if task.completion_date else None
            is_recurring = bool(getattr(task, "recurrence_rule", None))

            if task.status == "completed":
                stats["completed_tasks"] += 1
                if completed == today:
                    stats["completed_today"] += 1
                if completed and week_start.date() <= completed <= week_end.date():
                    stats["completed_this_week"] += 1
                if due:
                    stats["completed_per_day"][str(due)] += 1
                if is_recurring:
                    stats["recurring_completed"].append(task.title)
            elif task.status == "cancelled":
                stats["cancelled_tasks"] += 1
            elif task.status == "in_progress":
                stats["in_progress_tasks"] += 1
            else:
                stats["pending_tasks"] += 1
                if due == today and (not task.is_completed):
                    stats["failed_today"] += 1
                if due and week_start.date() <= due <= week_end.date() and (not task.is_completed):
                    stats["failed_this_week"] += 1
                if due:
                    stats["failed_per_day"][str(due)] += 1

            if due:
                stats["tasks_per_day"][str(due)] += 1
            if task.priority == "high" and due and week_start.date() <= due <= week_end.date() and not task.is_completed:
                stats["high_priority_missed_this_week"].append(task.title)
            if is_recurring:
                stats["recurring_total"] += 1
                if not task.is_completed and due and due < now.date():
                    stats["recurring_missed"].append(task.title)

        stats["tasks_per_day"] = dict(stats["tasks_per_day"])
        stats["completed_per_day"] = dict(stats["completed_per_day"])
        stats["failed_per_day"] = dict(stats["failed_per_day"])

        prompt = f"""
You are an expert productivity and task management assistant. Analyze the following user's task data and provide actionable insights and recommendations in JSON format.

User's task statistics:
{json.dumps(stats, indent=2)}

Definitions:
- "failed" means a task was due but not completed by its due date.
- "recurring_missed" are recurring tasks that were not completed on time.
- "high_priority_missed_this_week" are high priority tasks due this week but not completed.

Please provide insights in this JSON format:
{{
  "summary": "A brief summary of the user's task performance.",
  "insights": [
    "Insight 1",
    "Insight 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "missed_high_priority_tasks": [
    "Task title 1",
    "Task title 2"
  ],
  "missed_recurring_tasks": [
    "Task title 1",
    "Task title 2"
  ]
}}

Focus on:
- Patterns in completion and failure rates per day and week
- Missed high priority and recurring tasks
- Suggestions for improving productivity and task completion
- Any anomalies or trends (e.g., always missing tasks on certain days)
- Encourage positive habits and address recurring failures

Return only a valid JSON object as specified above.
"""

        ai_response = await ai_service.model.generate_content_async(prompt)
        parsed = ai_service.parse_json_response(ai_response.text) if hasattr(ai_service, "parse_json_response") else None
        if not parsed:
            return {
                "success": False,
                "data": {},
                "message": "Failed to generate AI insights.",
                "meta": {},
            }
        return {
            "success": True,
            "data": parsed,
            "message": "AI task insights generated successfully.",
            "meta": {},
        }
