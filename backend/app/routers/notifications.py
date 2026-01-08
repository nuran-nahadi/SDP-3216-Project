from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.services.notification_service import NotificationService
from app.schemas.notifications import (
    NotificationSettingsUpdate,
    NotificationSettingsResponse,
    EmailPreviewResponse,
    TestEmailResponse
)
from app.models.models import User


router = APIRouter(tags=["Notifications"], prefix="/notifications")


@router.get(
    "/settings",
    status_code=status.HTTP_200_OK,
    response_model=NotificationSettingsResponse,
    summary="Get notification settings",
    description="Get the current user's email notification settings"
)
def get_notification_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get notification settings"""
    return NotificationService.get_notification_settings(db, current_user)


@router.put(
    "/settings",
    status_code=status.HTTP_200_OK,
    response_model=NotificationSettingsResponse,
    summary="Update notification settings",
    description="Update the current user's email notification settings"
)
def update_notification_settings(
    settings_data: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Update notification settings"""
    return NotificationService.update_notification_settings(db, current_user, settings_data)


@router.get(
    "/preview",
    status_code=status.HTTP_200_OK,
    response_model=EmailPreviewResponse,
    summary="Preview daily email",
    description="Get a preview of what the daily summary email would contain"
)
def get_email_preview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get email preview"""
    return NotificationService.get_email_preview(db, current_user)


@router.post(
    "/test",
    status_code=status.HTTP_200_OK,
    response_model=TestEmailResponse,
    summary="Send test email",
    description="Send a test daily summary email to the current user"
)
async def send_test_email(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Send test email"""
    return await NotificationService.send_test_email(db, current_user)
