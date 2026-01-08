"""
Service layer for the Proactive Daily Update Agent.
Handles business logic for pending updates and daily update sessions.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from fastapi import HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
import json

from app.models.daily_update import PendingUpdate, DailyUpdateSession
from app.models.models import User, Task, Expense, Event, JournalEntry
from app.schemas.daily_update import (
    PendingUpdateCreate,
    PendingUpdateEdit,
    UpdateCategory,
    UpdateStatus,
    DraftEntryCreate,
)
from app.schemas.tasks import TaskCreate
from app.schemas.expenses import ExpenseCreate
from app.schemas.events import EventCreate
from app.schemas.journal import JournalEntryCreate


class DailyUpdateService:
    """Service for managing daily update sessions and pending updates."""
    
    # ============== Session Management ==============
    
    @staticmethod
    def start_session(db: Session, user: User) -> DailyUpdateSession:
        """
        Start a new daily update session.
        Automatically ends any existing active session for the user.
        """
        # End any existing active sessions
        active_sessions = db.query(DailyUpdateSession).filter(
            and_(
                DailyUpdateSession.user_id == user.id,
                DailyUpdateSession.is_active == True
            )
        ).all()
        
        for session in active_sessions:
            session.is_active = False
            session.ended_at = datetime.utcnow()
        
        # Create new session
        new_session = DailyUpdateSession(
            user_id=user.id,
            categories_covered=[],
            conversation_history=[]
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return new_session
    
    @staticmethod
    def get_active_session(db: Session, user: User) -> Optional[DailyUpdateSession]:
        """Get the user's current active session, if any."""
        return db.query(DailyUpdateSession).filter(
            and_(
                DailyUpdateSession.user_id == user.id,
                DailyUpdateSession.is_active == True
            )
        ).first()
    
    @staticmethod
    def get_session_by_id(db: Session, user: User, session_id: UUID) -> DailyUpdateSession:
        """Get a specific session by ID."""
        session = db.query(DailyUpdateSession).filter(
            and_(
                DailyUpdateSession.id == session_id,
                DailyUpdateSession.user_id == user.id
            )
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Daily update session not found"
            )
        
        return session
    
    @staticmethod
    def end_session(db: Session, user: User, session_id: UUID) -> DailyUpdateSession:
        """End a daily update session."""
        session = DailyUpdateService.get_session_by_id(db, user, session_id)
        
        session.is_active = False
        session.ended_at = datetime.utcnow()
        
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def update_session_categories(
        db: Session, 
        session: DailyUpdateSession, 
        category: str
    ) -> DailyUpdateSession:
        """Mark a category as covered in the session."""
        categories = list(session.categories_covered or [])
        if category not in categories:
            categories.append(category)
            session.categories_covered = categories
            db.commit()
            db.refresh(session)
        return session
    
    @staticmethod
    def add_conversation_message(
        db: Session,
        session: DailyUpdateSession,
        role: str,
        content: str
    ) -> DailyUpdateSession:
        """Add a message to the conversation history."""
        history = list(session.conversation_history or [])
        history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        })
        session.conversation_history = history
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def get_session_stats(db: Session, session: DailyUpdateSession) -> Dict[str, Any]:
        """Get statistics for a session."""
        pending_count = db.query(PendingUpdate).filter(
            and_(
                PendingUpdate.session_id == session.id,
                PendingUpdate.status == "pending"
            )
        ).count()
        
        total_count = db.query(PendingUpdate).filter(
            PendingUpdate.session_id == session.id
        ).count()
        
        # Count items per category
        category_counts = {}
        for category in ["task", "expense", "event", "journal"]:
            count = db.query(PendingUpdate).filter(
                and_(
                    PendingUpdate.session_id == session.id,
                    PendingUpdate.category == category
                )
            ).count()
            category_counts[category] = count
        
        return {
            "session_id": session.id,
            "is_active": session.is_active,
            "categories_covered": session.categories_covered or [],
            "pending_items_count": pending_count,
            "total_items_count": total_count,
            "items_by_category": category_counts,
            "all_categories_covered": len(session.categories_covered or []) >= 4
        }
    
    # ============== Pending Updates Management ==============
    
    @staticmethod
    def create_pending_update(
        db: Session,
        user: User,
        update_data: PendingUpdateCreate,
        session_id: Optional[UUID] = None
    ) -> PendingUpdate:
        """Create a new pending update entry."""
        pending = PendingUpdate(
            user_id=user.id,
            category=update_data.category.value,
            summary=update_data.summary,
            raw_text=update_data.raw_text,
            structured_data=update_data.structured_data,
            status="pending",
            session_id=session_id
        )
        
        db.add(pending)
        db.commit()
        db.refresh(pending)
        
        # Update session categories if applicable
        if session_id:
            session = db.query(DailyUpdateSession).filter(
                DailyUpdateSession.id == session_id
            ).first()
            if session:
                DailyUpdateService.update_session_categories(
                    db, session, update_data.category.value
                )
        
        return pending
    
    @staticmethod
    def create_draft_entry(
        db: Session,
        user: User,
        draft: DraftEntryCreate,
        raw_text: Optional[str] = None,
        session_id: Optional[UUID] = None
    ) -> PendingUpdate:
        """
        Create a draft entry from AI function call.
        This matches the AI's create_draft_entry tool signature.
        """
        update_data = PendingUpdateCreate(
            category=draft.category,
            summary=draft.summary,
            raw_text=raw_text,
            structured_data=draft.details
        )
        return DailyUpdateService.create_pending_update(db, user, update_data, session_id)
    
    @staticmethod
    def get_pending_updates(
        db: Session,
        user: User,
        category: Optional[UpdateCategory] = None,
        status_filter: Optional[UpdateStatus] = None,
        session_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get pending updates with optional filters."""
        query = db.query(PendingUpdate).filter(PendingUpdate.user_id == user.id)
        
        if category:
            query = query.filter(PendingUpdate.category == category.value)
        if status_filter:
            query = query.filter(PendingUpdate.status == status_filter.value)
        if session_id:
            query = query.filter(PendingUpdate.session_id == session_id)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(PendingUpdate.created_at))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        updates = query.offset(offset).limit(limit).all()
        
        # Calculate pagination info
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        return {
            "data": updates,
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    
    @staticmethod
    def get_pending_update_by_id(
        db: Session,
        user: User,
        update_id: UUID
    ) -> PendingUpdate:
        """Get a specific pending update by ID."""
        update = db.query(PendingUpdate).filter(
            and_(
                PendingUpdate.id == update_id,
                PendingUpdate.user_id == user.id
            )
        ).first()
        
        if not update:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pending update not found"
            )
        
        return update
    
    @staticmethod
    def edit_pending_update(
        db: Session,
        user: User,
        update_id: UUID,
        edit_data: PendingUpdateEdit
    ) -> PendingUpdate:
        """Edit a pending update before accepting."""
        update = DailyUpdateService.get_pending_update_by_id(db, user, update_id)
        
        if update.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot edit an update that is not pending"
            )
        
        if edit_data.summary is not None:
            update.summary = edit_data.summary
        if edit_data.structured_data is not None:
            update.structured_data = edit_data.structured_data
        
        db.commit()
        db.refresh(update)
        
        return update
    
    @staticmethod
    def change_status(
        db: Session,
        user: User,
        update_id: UUID,
        new_status: UpdateStatus
    ) -> PendingUpdate:
        """Change the status of a pending update."""
        update = DailyUpdateService.get_pending_update_by_id(db, user, update_id)
        
        if update.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only change status of pending updates"
            )
        
        update.status = new_status.value
        db.commit()
        db.refresh(update)
        
        return update
    
    @staticmethod
    def delete_pending_update(db: Session, user: User, update_id: UUID) -> bool:
        """Delete a pending update."""
        update = DailyUpdateService.get_pending_update_by_id(db, user, update_id)
        
        db.delete(update)
        db.commit()
        
        return True
    
    # ============== Accept & Transfer to Real Tables ==============
    
    @staticmethod
    def accept_pending_update(
        db: Session,
        user: User,
        update_id: UUID
    ) -> Dict[str, Any]:
        """
        Accept a pending update and transfer it to the appropriate table.
        Returns the created item ID.
        """
        update = DailyUpdateService.get_pending_update_by_id(db, user, update_id)
        
        if update.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only accept pending updates"
            )
        
        created_item = None
        
        try:
            if update.category == "task":
                created_item = DailyUpdateService._create_task_from_pending(db, user, update)
            elif update.category == "expense":
                created_item = DailyUpdateService._create_expense_from_pending(db, user, update)
            elif update.category == "event":
                created_item = DailyUpdateService._create_event_from_pending(db, user, update)
            elif update.category == "journal":
                created_item = DailyUpdateService._create_journal_from_pending(db, user, update)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown category: {update.category}"
                )
            
            # Mark as accepted
            update.status = "accepted"
            db.commit()
            
            return {
                "pending_update_id": update.id,
                "category": update.category,
                "created_item_id": created_item.id,
                "success": True
            }
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create {update.category}: {str(e)}"
            )
    
    @staticmethod
    def accept_all_pending(
        db: Session,
        user: User,
        session_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """Accept all pending updates (optionally for a specific session)."""
        query = db.query(PendingUpdate).filter(
            and_(
                PendingUpdate.user_id == user.id,
                PendingUpdate.status == "pending"
            )
        )
        
        if session_id:
            query = query.filter(PendingUpdate.session_id == session_id)
        
        pending_updates = query.all()
        results = []
        
        for update in pending_updates:
            try:
                result = DailyUpdateService.accept_pending_update(db, user, update.id)
                results.append(result)
            except Exception as e:
                results.append({
                    "pending_update_id": update.id,
                    "category": update.category,
                    "created_item_id": None,
                    "success": False,
                    "error": str(e)
                })
        
        return results
    
    @staticmethod
    def reject_pending_update(db: Session, user: User, update_id: UUID) -> PendingUpdate:
        """Reject a pending update (marks as rejected, doesn't delete)."""
        return DailyUpdateService.change_status(db, user, update_id, UpdateStatus.rejected)
    
    # ============== Helper Methods for Creating Real Entries ==============
    
    @staticmethod
    def _create_task_from_pending(db: Session, user: User, update: PendingUpdate) -> Task:
        """Create a task from pending update data."""
        data = update.structured_data or {}
        
        task = Task(
            user_id=user.id,
            title=update.summary,
            description=data.get("description"),
            due_date=data.get("due_date"),
            priority=data.get("priority", "medium"),
            status=data.get("status", "pending"),
            is_completed=data.get("is_completed", False),
            estimated_duration=data.get("estimated_duration"),
            tags=json.dumps(data.get("tags", [])) if data.get("tags") else None,
            parent_task_id=data.get("parent_task_id")
        )
        
        db.add(task)
        db.flush()  # Get the ID without committing
        
        return task
    
    @staticmethod
    def _create_expense_from_pending(db: Session, user: User, update: PendingUpdate) -> Expense:
        """Create an expense from pending update data."""
        data = update.structured_data or {}
        
        expense = Expense(
            user_id=user.id,
            amount=data.get("amount", 0),
            currency=data.get("currency", "Taka"),
            category=data.get("category", "other"),
            subcategory=data.get("subcategory"),
            merchant=data.get("merchant") or update.summary,
            description=data.get("description") or update.summary,
            date=data.get("date") or datetime.utcnow(),
            payment_method=data.get("payment_method"),
            is_recurring=data.get("is_recurring", False),
            tags=json.dumps(data.get("tags", [])) if data.get("tags") else None
        )
        
        db.add(expense)
        db.flush()
        
        return expense
    
    @staticmethod
    def _create_event_from_pending(db: Session, user: User, update: PendingUpdate) -> Event:
        """Create an event from pending update data."""
        data = update.structured_data or {}
        
        # Default times if not provided
        start_time = data.get("start_time") or datetime.utcnow()
        end_time = data.get("end_time") or start_time
        
        # Ensure end_time is after start_time
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        if isinstance(end_time, str):
            end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        if end_time <= start_time:
            from datetime import timedelta
            end_time = start_time + timedelta(hours=1)
        
        event = Event(
            user_id=user.id,
            title=update.summary,
            description=data.get("description"),
            start_time=start_time,
            end_time=end_time,
            location=data.get("location"),
            tags=json.dumps(data.get("tags", [])) if data.get("tags") else None,
            is_all_day=data.get("is_all_day", False),
            reminder_minutes=data.get("reminder_minutes"),
            color=data.get("color")
        )
        
        db.add(event)
        db.flush()
        
        return event
    
    @staticmethod
    def _create_journal_from_pending(db: Session, user: User, update: PendingUpdate) -> JournalEntry:
        """Create a journal entry from pending update data."""
        data = update.structured_data or {}
        
        entry = JournalEntry(
            user_id=user.id,
            title=update.summary,
            content=data.get("content") or update.summary,
            mood=data.get("mood"),
            weather=data.get("weather"),
            location=data.get("location")
        )
        
        db.add(entry)
        db.flush()
        
        return entry
    
    # ============== Summary & Statistics ==============
    
    @staticmethod
    def get_pending_summary(db: Session, user: User) -> Dict[str, Any]:
        """Get a summary of all pending updates for the user."""
        # Count by category
        category_counts = {}
        for category in ["task", "expense", "event", "journal"]:
            count = db.query(PendingUpdate).filter(
                and_(
                    PendingUpdate.user_id == user.id,
                    PendingUpdate.category == category,
                    PendingUpdate.status == "pending"
                )
            ).count()
            category_counts[category] = count
        
        total_pending = sum(category_counts.values())
        
        # Get recent items
        recent = db.query(PendingUpdate).filter(
            and_(
                PendingUpdate.user_id == user.id,
                PendingUpdate.status == "pending"
            )
        ).order_by(desc(PendingUpdate.created_at)).limit(5).all()
        
        return {
            "total_pending": total_pending,
            "by_category": category_counts,
            "recent_items": recent,
            "has_pending": total_pending > 0
        }
