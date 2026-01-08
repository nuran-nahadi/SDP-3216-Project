from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationSettingsBase(BaseModel):
    email_enabled: bool = False
    preferred_time: str = "08:00"  # HH:MM format

    class Config:
        from_attributes = True


class NotificationSettingsUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    preferred_time: Optional[str] = Field(None, pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$")

    class Config:
        from_attributes = True


class NotificationSettingsResponse(BaseModel):
    success: bool
    data: NotificationSettingsBase
    message: str

    class Config:
        from_attributes = True


class DailySummary(BaseModel):
    tasks_pending: int = 0
    tasks_due_today: int = 0
    tasks_overdue: int = 0
    tasks_completed_today: int = 0
    events_today: int = 0
    events_upcoming: list = []
    expenses_today: float = 0.0
    expenses_this_week: float = 0.0
    top_expense_category: Optional[str] = None
    journal_last_entry_days: Optional[int] = None
    # Upcoming week data
    tasks_due_next_week: int = 0
    events_next_week: int = 0
    events_next_week_list: list = []

    class Config:
        from_attributes = True


class EmailPreviewResponse(BaseModel):
    success: bool
    data: DailySummary
    message: str

    class Config:
        from_attributes = True


class TestEmailResponse(BaseModel):
    success: bool
    message: str

    class Config:
        from_attributes = True
