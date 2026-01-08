from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fastapi import HTTPException, status
from app.models.models import User, UserPreferences, Task, Event, Expense, JournalEntry
from app.schemas.notifications import NotificationSettingsBase, NotificationSettingsUpdate, DailySummary
from datetime import datetime, timedelta
from typing import Optional
import json


class NotificationService:
    
    @staticmethod
    def get_notification_settings(db: Session, user: User) -> dict:
        """Get user's notification settings from preferences"""
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == user.id
        ).first()
        
        # Default settings
        default_settings = NotificationSettingsBase(
            email_enabled=False,
            preferred_time="08:00"
        )
        
        if not preferences or not preferences.notification_settings:
            return {
                "success": True,
                "data": default_settings.model_dump(),
                "message": "Notification settings retrieved successfully"
            }
        
        # Parse notification_settings from JSONB
        settings_data = preferences.notification_settings
        if isinstance(settings_data, str):
            try:
                settings_data = json.loads(settings_data)
            except json.JSONDecodeError:
                settings_data = {}
        
        return {
            "success": True,
            "data": {
                "email_enabled": settings_data.get("email_enabled", False),
                "preferred_time": settings_data.get("preferred_time", "08:00")
            },
            "message": "Notification settings retrieved successfully"
        }
    
    @staticmethod
    def update_notification_settings(
        db: Session, 
        user: User, 
        settings_data: NotificationSettingsUpdate
    ) -> dict:
        """Update user's notification settings"""
        preferences = db.query(UserPreferences).filter(
            UserPreferences.user_id == user.id
        ).first()
        
        if not preferences:
            # Create preferences if they don't exist
            preferences = UserPreferences(user_id=user.id)
            db.add(preferences)
        
        # Get current notification settings
        current_settings = preferences.notification_settings or {}
        if isinstance(current_settings, str):
            try:
                current_settings = json.loads(current_settings)
            except json.JSONDecodeError:
                current_settings = {}
        
        # Update with new values
        update_data = settings_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                current_settings[key] = value
        
        # Save back to preferences
        preferences.notification_settings = json.dumps(current_settings)
        
        try:
            db.commit()
            db.refresh(preferences)
            
            return {
                "success": True,
                "data": {
                    "email_enabled": current_settings.get("email_enabled", False),
                    "preferred_time": current_settings.get("preferred_time", "08:00")
                },
                "message": "Notification settings updated successfully"
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update notification settings: {str(e)}"
            )
    
    @staticmethod
    def get_daily_summary(db: Session, user: User) -> DailySummary:
        """Generate daily summary data for a user"""
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        week_start = today - timedelta(days=today.weekday())
        week_start_dt = datetime.combine(week_start, datetime.min.time())
        week_end = today + timedelta(days=7)
        week_end_dt = datetime.combine(week_end, datetime.max.time())
        
        # Tasks stats
        tasks_pending = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status != 'completed'
        ).count()
        
        tasks_due_today = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status != 'completed',
            func.date(Task.due_date) == today
        ).count()
        
        tasks_overdue = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status != 'completed',
            Task.due_date < today_start
        ).count()
        
        tasks_completed_today = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status == 'completed',
            func.date(Task.completion_date) == today
        ).count()
        
        # Events stats
        events_today_list = db.query(Event).filter(
            Event.user_id == user.id,
            and_(
                Event.start_time >= today_start,
                Event.start_time <= today_end
            )
        ).order_by(Event.start_time).all()
        
        events_today = len(events_today_list)
        events_upcoming = [
            {
                "title": e.title,
                "start_time": e.start_time.strftime("%I:%M %p") if e.start_time else None
            }
            for e in events_today_list[:5]  # Limit to 5 events
        ]
        
        # Expenses stats
        expenses_today = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user.id,
            func.date(Expense.date) == today
        ).scalar() or 0.0
        
        expenses_this_week = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.user_id == user.id,
            Expense.date >= week_start_dt
        ).scalar() or 0.0
        
        # Top expense category this week
        top_category_result = db.query(
            Expense.category,
            func.sum(Expense.amount).label('total')
        ).filter(
            Expense.user_id == user.id,
            Expense.date >= week_start_dt
        ).group_by(Expense.category).order_by(
            func.sum(Expense.amount).desc()
        ).first()
        
        top_expense_category = top_category_result[0] if top_category_result else None
        
        # Journal stats
        last_journal = db.query(JournalEntry).filter(
            JournalEntry.user_id == user.id
        ).order_by(JournalEntry.created_at.desc()).first()
        
        journal_last_entry_days = None
        if last_journal:
            days_diff = (today - last_journal.created_at.date()).days
            journal_last_entry_days = days_diff
        
        # Upcoming week stats (next 7 days)
        tomorrow = today + timedelta(days=1)
        tomorrow_start = datetime.combine(tomorrow, datetime.min.time())
        
        tasks_due_next_week = db.query(Task).filter(
            Task.user_id == user.id,
            Task.status != 'completed',
            and_(
                Task.due_date >= tomorrow_start,
                Task.due_date <= week_end_dt
            )
        ).count()
        
        events_next_week_list = db.query(Event).filter(
            Event.user_id == user.id,
            and_(
                Event.start_time >= tomorrow_start,
                Event.start_time <= week_end_dt
            )
        ).order_by(Event.start_time).limit(5).all()
        
        events_next_week = db.query(Event).filter(
            Event.user_id == user.id,
            and_(
                Event.start_time >= tomorrow_start,
                Event.start_time <= week_end_dt
            )
        ).count()
        
        events_next_week_formatted = [
            {
                "title": e.title,
                "start_time": e.start_time.strftime("%a, %b %d at %I:%M %p") if e.start_time else None
            }
            for e in events_next_week_list
        ]
        
        return DailySummary(
            tasks_pending=tasks_pending,
            tasks_due_today=tasks_due_today,
            tasks_overdue=tasks_overdue,
            tasks_completed_today=tasks_completed_today,
            events_today=events_today,
            events_upcoming=events_upcoming,
            expenses_today=float(expenses_today),
            expenses_this_week=float(expenses_this_week),
            top_expense_category=top_expense_category,
            journal_last_entry_days=journal_last_entry_days,
            tasks_due_next_week=tasks_due_next_week,
            events_next_week=events_next_week,
            events_next_week_list=events_next_week_formatted
        )
    
    @staticmethod
    def get_email_preview(db: Session, user: User) -> dict:
        """Get preview of what the daily email would contain"""
        summary = NotificationService.get_daily_summary(db, user)
        
        return {
            "success": True,
            "data": summary.model_dump(),
            "message": "Email preview generated successfully"
        }
    
    @staticmethod
    async def send_test_email(db: Session, user: User) -> dict:
        """Send a test email to the user"""
        from app.services.email_service import EmailService
        
        summary = NotificationService.get_daily_summary(db, user)
        
        try:
            success = await EmailService.send_daily_summary_email(
                to_email=user.email,
                first_name=user.first_name,
                summary=summary
            )
            
            if success:
                return {
                    "success": True,
                    "message": f"Test email sent successfully to {user.email}"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send test email. Please check your email configuration."
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to send test email: {str(e)}"
            }
