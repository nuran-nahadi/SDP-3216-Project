"""Facade for orchestrating event workflows."""
from __future__ import annotations

import calendar
import json
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status, UploadFile

from app.models.models import User
from app.repositories.event_repository import EventRepository
from app.schemas.events import (
    AIEventParseResponse,
    EventCreate,
    EventOut,
    EventUpdate,
)


class EventFacade:
    """Coordinates event repositories and ancillary logic."""

    def __init__(self, repository: EventRepository, user: User) -> None:
        self._repository = repository
        self._user = user

    # ------------------------------------------------------------------
    # CRUD operations
    # ------------------------------------------------------------------
    def get_events(
        self,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> dict:
        try:
            events, total = self._repository.list_events(
                self._user.id,
                start_date=start_date,
                end_date=end_date,
                tags=tags,
                search=search,
                page=page,
                limit=limit,
            )

            event_data = []
            for event in events:
                # Handle tags parsing safely
                tags_parsed = []
                if event.tags:
                    try:
                        if isinstance(event.tags, str):
                            tags_parsed = json.loads(event.tags)
                        elif isinstance(event.tags, list):
                            tags_parsed = event.tags
                    except (json.JSONDecodeError, TypeError, AttributeError):
                        tags_parsed = []
                
                event_dict = {
                    "id": event.id,
                    "user_id": event.user_id,
                    "title": event.title,
                    "description": event.description,
                    "start_time": event.start_time,
                    "end_time": event.end_time,
                    "location": event.location,
                    "tags": tags_parsed,
                    "is_all_day": event.is_all_day,
                    "reminder_minutes": event.reminder_minutes,
                    "recurrence_rule": event.recurrence_rule,
                    "color": event.color,
                    "created_at": event.created_at,
                    "updated_at": event.updated_at,
                }
                event_data.append(event_dict)

            return {
                "data": event_data,
                "meta": {
                    "total": total,
                    "page": page,
                    "limit": limit,
                    "pages": (total + limit - 1) // limit,
                    "timestamp": datetime.utcnow(),
                },
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error retrieving events: {str(e)}"
            )

    def create_event(self, event_data: EventCreate) -> dict:
        try:
            payload = {
                "title": event_data.title,
                "description": event_data.description,
                "start_time": event_data.start_time,
                "end_time": event_data.end_time,
                "location": event_data.location,
                "tags": json.dumps(event_data.tags) if event_data.tags else None,
                "is_all_day": event_data.is_all_day,
                "reminder_minutes": event_data.reminder_minutes,
                "recurrence_rule": event_data.recurrence_rule,
                "color": event_data.color,
            }
            event = self._repository.create(self._user.id, payload)
            return {"data": EventOut.model_validate(event)}
        except Exception as exc:  # pragma: no cover - defensive rollback
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create event: {exc}",
            ) from exc

    def get_event_by_id(self, event_id: UUID) -> dict:
        event = self._repository.get_by_id(self._user.id, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        return {"data": EventOut.model_validate(event)}

    def update_event(self, event_id: UUID, event_data: EventUpdate) -> dict:
        event = self._repository.get_by_id(self._user.id, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        update_data = event_data.model_dump(exclude_unset=True)
        if "tags" in update_data:
            update_data["tags"] = (
                json.dumps(update_data["tags"]) if update_data["tags"] else None
            )
        try:
            updated = self._repository.update(event, update_data)
            return {"data": EventOut.model_validate(updated)}
        except Exception as exc:  # pragma: no cover
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update event: {exc}",
            ) from exc

    def delete_event(self, event_id: UUID) -> dict:
        event = self._repository.get_by_id(self._user.id, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        try:
            self._repository.delete(event)
            return {"message": "Event deleted successfully"}
        except Exception as exc:  # pragma: no cover
            self._repository.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to delete event: {exc}",
            ) from exc

    # ------------------------------------------------------------------
    # Calendar helpers
    # ------------------------------------------------------------------
    def get_calendar_view(self, year: int, month: int) -> dict:
        events = self._repository.month_view(self._user.id, year, month)
        cal = calendar.monthcalendar(year, month)
        calendar_data = {
            "year": year,
            "month": month,
            "month_name": calendar.month_name[month],
            "calendar_grid": cal,
            "events": [],
            "events_by_date": {},
        }
        for event in events:
            # Handle tags parsing safely
            tags = []
            if event.tags:
                try:
                    if isinstance(event.tags, str):
                        tags = json.loads(event.tags)
                    elif isinstance(event.tags, list):
                        tags = event.tags
                except (json.JSONDecodeError, TypeError):
                    tags = []
            
            event_dict = {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "location": event.location,
                "tags": tags,
                "is_all_day": event.is_all_day,
                "color": event.color,
            }
            calendar_data["events"].append(event_dict)
            event_date = event.start_time.date().isoformat()
            calendar_data.setdefault("events_by_date", {}).setdefault(event_date, []).append(event_dict)
        return {"data": calendar_data}

    def get_upcoming_events(self, days: int = 7) -> dict:
        events = self._repository.upcoming(self._user.id, days)
        event_data = []
        for event in events:
            # Handle tags parsing safely
            tags = []
            if event.tags:
                try:
                    if isinstance(event.tags, str):
                        tags = json.loads(event.tags)
                    elif isinstance(event.tags, list):
                        tags = event.tags
                except (json.JSONDecodeError, TypeError):
                    tags = []
            
            event_dict = {
                "id": event.id,
                "user_id": event.user_id,
                "title": event.title,
                "description": event.description,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "location": event.location,
                "tags": tags,
                "is_all_day": event.is_all_day,
                "reminder_minutes": event.reminder_minutes,
                "recurrence_rule": event.recurrence_rule,
                "color": event.color,
                "created_at": event.created_at,
                "updated_at": event.updated_at,
            }
            event_data.append(event_dict)
        start_date = datetime.now()
        end_date = start_date + timedelta(days=days)
        return {
            "data": event_data,
            "meta": {
                "total": len(event_data),
                "days": days,
                "start_date": start_date,
                "end_date": end_date,
                "timestamp": datetime.utcnow(),
            },
        }

    # ------------------------------------------------------------------
    # Natural language helpers
    # ------------------------------------------------------------------
    @staticmethod
    def parse_natural_language(text: str) -> dict:
        parsed_data = {
            "title": text[:50] + "..." if len(text) > 50 else text,
            "description": text,
            "start_time": None,
            "end_time": None,
            "location": None,
            "tags": [],
            "is_all_day": False,
            "confidence_score": 0.5,
        }
        if "lunch" in text.lower() or "dinner" in text.lower() or "coffee" in text.lower():
            parsed_data["tags"].append("food")
        if "meeting" in text.lower() or "call" in text.lower():
            parsed_data["tags"].append("work")
        if "tomorrow" in text.lower():
            tomorrow = datetime.now() + timedelta(days=1)
            parsed_data["start_time"] = tomorrow.replace(hour=12, minute=0, second=0, microsecond=0)
            parsed_data["end_time"] = tomorrow.replace(hour=13, minute=0, second=0, microsecond=0)
            parsed_data["confidence_score"] = 0.7
        return {"data": parsed_data}

    # ------------------------------------------------------------------
    # AI helpers
    # ------------------------------------------------------------------
    async def parse_text_with_ai(self, text: str) -> AIEventParseResponse:
        from app.services.ai_service import ai_service

        ai_result = await ai_service.parse_text_event(text)
        if not ai_result.get("is_event_related", True):
            return AIEventParseResponse(
                success=False,
                parsed_data=ai_result,
                message=ai_result.get("message", "Not event related"),
            )
        if not ai_result.get("title") or not ai_result.get("start_time") or not ai_result.get("end_time"):
            return AIEventParseResponse(
                success=False,
                parsed_data=ai_result,
                message="Missing required fields",
            )
        event_data = EventCreate(
            title=ai_result["title"],
            description=ai_result.get("description"),
            start_time=ai_result["start_time"],
            end_time=ai_result["end_time"],
            location=ai_result.get("location"),
            tags=ai_result.get("tags", []),
            is_all_day=ai_result.get("is_all_day", False),
            reminder_minutes=ai_result.get("reminder_minutes"),
            recurrence_rule=ai_result.get("recurrence_rule"),
            color=ai_result.get("color"),
        )
        created = self.create_event(event_data)
        return AIEventParseResponse(
            success=True,
            data=created["data"],
            parsed_data=ai_result,
            confidence=ai_result.get("confidence"),
            message="Event created successfully",
        )

    async def parse_voice_with_ai(self, file: UploadFile) -> AIEventParseResponse:
        from app.services.ai_service import ai_service

        ai_result = await ai_service.parse_voice_event(file)
        if not ai_result.get("is_event_related", True):
            return AIEventParseResponse(
                success=False,
                parsed_data=ai_result,
                transcribed_text=ai_result.get("transcribed_text"),
                message=ai_result.get("message", "Not event related"),
            )
        if not ai_result.get("title") or not ai_result.get("start_time") or not ai_result.get("end_time"):
            return AIEventParseResponse(
                success=False,
                parsed_data=ai_result,
                transcribed_text=ai_result.get("transcribed_text"),
                message="Missing required fields",
            )
        event_data = EventCreate(
            title=ai_result["title"],
            description=ai_result.get("description"),
            start_time=ai_result["start_time"],
            end_time=ai_result["end_time"],
            location=ai_result.get("location"),
            tags=ai_result.get("tags", []),
            is_all_day=ai_result.get("is_all_day", False),
            reminder_minutes=ai_result.get("reminder_minutes"),
            recurrence_rule=ai_result.get("recurrence_rule"),
            color=ai_result.get("color"),
        )
        created = self.create_event(event_data)
        return AIEventParseResponse(
            success=True,
            data=created["data"],
            parsed_data=ai_result,
            confidence=ai_result.get("confidence"),
            transcribed_text=ai_result.get("transcribed_text"),
            message="Event created successfully",
        )
