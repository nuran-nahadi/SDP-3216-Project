"""Data access helpers for calendar events."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.models import Event


class EventRepository:
    """Encapsulates persistence operations for :class:`Event`."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def list_events(
        self,
        user_id: UUID,
        *,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Tuple[List[Event], int]:
        """Return paginated events for a user with applied filters."""
        query = self._base_query(user_id)

        if start_date:
            query = query.filter(Event.start_time >= start_date)
        if end_date:
            query = query.filter(Event.end_time <= end_date)
        if tags:
            like_filters = [Event.tags.like(f'%"{tag}"%') for tag in tags]
            query = query.filter(or_(*like_filters))
        if search:
            like_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Event.title.ilike(like_pattern),
                    Event.description.ilike(like_pattern),
                    Event.location.ilike(like_pattern),
                )
            )

        total = query.count()
        events = (
            query.order_by(Event.start_time)
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return events, total

    def get_by_id(self, user_id: UUID, event_id: UUID) -> Optional[Event]:
        """Return a single event for the user."""
        return (
            self._base_query(user_id)
            .filter(Event.id == event_id)
            .first()
        )

    def create(self, user_id: UUID, payload: Dict[str, object]) -> Event:
        """Create and persist an event."""
        event = Event(user_id=user_id, **payload)
        self._db.add(event)
        self._db.commit()
        self._db.refresh(event)
        return event

    def update(self, event: Event, update_data: Dict[str, object]) -> Event:
        """Update an existing event."""
        for key, value in update_data.items():
            setattr(event, key, value)
        self._db.commit()
        self._db.refresh(event)
        return event

    def delete(self, event: Event) -> None:
        """Remove the provided event from storage."""
        self._db.delete(event)
        self._db.commit()

    def month_view(self, user_id: UUID, year: int, month: int) -> List[Event]:
        """Return events intersecting the target month."""
        if month == 12:
            start_date = datetime(year, month, 1)
            end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            start_date = datetime(year, month, 1)
            end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

        return (
            self._base_query(user_id)
            .filter(
                or_(
                    and_(Event.start_time >= start_date, Event.start_time <= end_date),
                    and_(Event.end_time >= start_date, Event.end_time <= end_date),
                    and_(Event.start_time <= start_date, Event.end_time >= end_date),
                )
            )
            .order_by(Event.start_time)
            .all()
        )

    def upcoming(self, user_id: UUID, days: int) -> List[Event]:
        """Return upcoming events inside the next ``days`` window."""
        start_date = datetime.now()
        end_date = start_date + timedelta(days=days)

        return (
            self._base_query(user_id)
            .filter(
                and_(
                    Event.start_time >= start_date,
                    Event.start_time <= end_date,
                )
            )
            .order_by(Event.start_time)
            .all()
        )

    def rollback(self) -> None:
        self._db.rollback()

    def _base_query(self, user_id: UUID):
        return self._db.query(Event).filter(Event.user_id == user_id)
