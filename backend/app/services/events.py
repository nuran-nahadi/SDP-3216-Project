"""Facade-backed event service wrappers."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.facades.event_facade import EventFacade
from app.models.models import User
from app.repositories.event_repository import EventRepository
from app.schemas.events import EventCreate, EventUpdate


class EventService:
	"""Maintains the historic service API via the new facade layer."""

	@staticmethod
	def _facade(db: Session, user: User) -> EventFacade:
		return EventFacade(EventRepository(db), user)

	@staticmethod
	def get_events(
		db: Session,
		user: User,
		start_date: Optional[datetime] = None,
		end_date: Optional[datetime] = None,
		tags: Optional[List[str]] = None,
		search: Optional[str] = None,
		page: int = 1,
		limit: int = 50,
	) -> dict:
		return EventService._facade(db, user).get_events(
			start_date=start_date,
			end_date=end_date,
			tags=tags,
			search=search,
			page=page,
			limit=limit,
		)

	@staticmethod
	def create_event(db: Session, user: User, event_data: EventCreate) -> dict:
		return EventService._facade(db, user).create_event(event_data)

	@staticmethod
	def get_event_by_id(db: Session, user: User, event_id: UUID) -> dict:
		return EventService._facade(db, user).get_event_by_id(event_id)

	@staticmethod
	def update_event(
		db: Session,
		user: User,
		event_id: UUID,
		event_data: EventUpdate,
	) -> dict:
		return EventService._facade(db, user).update_event(event_id, event_data)

	@staticmethod
	def delete_event(db: Session, user: User, event_id: UUID) -> dict:
		return EventService._facade(db, user).delete_event(event_id)

	@staticmethod
	def get_calendar_view(db: Session, user: User, year: int, month: int) -> dict:
		return EventService._facade(db, user).get_calendar_view(year, month)

	@staticmethod
	def get_upcoming_events(db: Session, user: User, days: int = 7) -> dict:
		return EventService._facade(db, user).get_upcoming_events(days)

	@staticmethod
	def parse_natural_language(text: str) -> dict:
		return EventFacade.parse_natural_language(text)

	@staticmethod
	async def parse_text_with_ai(db: Session, user: User, text: str):
		return await EventService._facade(db, user).parse_text_with_ai(text)

	@staticmethod
	async def parse_voice_with_ai(db: Session, user: User, file: UploadFile):
		return await EventService._facade(db, user).parse_voice_with_ai(file)
