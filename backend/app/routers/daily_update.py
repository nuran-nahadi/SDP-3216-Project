"""
API Router for the Proactive Daily Update Agent feature.
Provides endpoints for managing daily update sessions and pending updates.
"""

from fastapi import APIRouter, Depends, Query, Path, status, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID

from app.db.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.models import User
from app.services.daily_update import DailyUpdateService
from app.services.ai_strategies.daily_update import daily_update_interviewer_strategy
from app.services.ai_rate_limit import ai_rate_limit
from app.schemas.daily_update import (
    PendingUpdateCreate,
    PendingUpdateEdit,
    PendingUpdateOut,
    PendingUpdateResponse,
    PendingUpdatesResponse,
    PendingUpdateStatusChange,
    BatchStatusChange,
    UpdateCategory,
    UpdateStatus,
    DailyUpdateSessionResponse,
    DailyUpdateConversationRequest,
    DailyUpdateConversationResponse,
    ConversationStateResponse,
    MessageResponse,
    BatchAcceptResponse,
    DraftEntryCreate,
)


router = APIRouter(tags=["Daily Updates"], prefix="/daily-updates")


# ============== Session Management Endpoints ==============

@router.post(
    "/sessions/start",
    status_code=status.HTTP_201_CREATED,
    response_model=DailyUpdateSessionResponse,
    summary="Start a new daily update session",
    description="Start a new AI-assisted daily update conversation session"
)
def start_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Start a new daily update session with the AI interviewer."""
    session = DailyUpdateService.start_session(db, current_user)
    
    # Get the greeting message
    greeting = daily_update_interviewer_strategy.get_greeting()
    
    # Add greeting to conversation history
    DailyUpdateService.add_conversation_message(db, session, "assistant", greeting)
    
    return {
        "success": True,
        "data": {
            "id": session.id,
            "user_id": session.user_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "is_active": session.is_active,
            "categories_covered": session.categories_covered or [],
            "total_items_captured": 0
        },
        "message": "Daily update session started",
        "meta": {
            "greeting": greeting
        }
    }


@router.get(
    "/sessions/active",
    status_code=status.HTTP_200_OK,
    response_model=DailyUpdateSessionResponse,
    summary="Get active session",
    description="Get the current active daily update session"
)
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get the user's current active daily update session."""
    session = DailyUpdateService.get_active_session(db, current_user)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session found. Start a new session first."
        )
    
    stats = DailyUpdateService.get_session_stats(db, session)
    
    return {
        "success": True,
        "data": {
            "id": session.id,
            "user_id": session.user_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "is_active": session.is_active,
            "categories_covered": session.categories_covered or [],
            "total_items_captured": stats["total_items_count"]
        },
        "message": "Active session retrieved",
        "meta": stats
    }


@router.post(
    "/sessions/{session_id}/end",
    status_code=status.HTTP_200_OK,
    response_model=DailyUpdateSessionResponse,
    summary="End a session",
    description="End a daily update session"
)
def end_session(
    session_id: UUID = Path(..., description="Session ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """End a daily update session."""
    session = DailyUpdateService.end_session(db, current_user, session_id)
    stats = DailyUpdateService.get_session_stats(db, session)
    
    return {
        "success": True,
        "data": {
            "id": session.id,
            "user_id": session.user_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "is_active": session.is_active,
            "categories_covered": session.categories_covered or [],
            "total_items_captured": stats["total_items_count"]
        },
        "message": "Session ended successfully",
        "meta": stats
    }


@router.get(
    "/sessions/{session_id}/state",
    status_code=status.HTTP_200_OK,
    response_model=ConversationStateResponse,
    summary="Get conversation state",
    description="Get the current state of a daily update conversation"
)
def get_conversation_state(
    session_id: UUID = Path(..., description="Session ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get the current conversation state including categories covered."""
    session = DailyUpdateService.get_session_by_id(db, current_user, session_id)
    stats = DailyUpdateService.get_session_stats(db, session)
    
    # Build category status
    categories_status = []
    for cat in ["task", "expense", "event", "journal"]:
        categories_status.append({
            "category": cat,
            "is_covered": cat in (session.categories_covered or []),
            "items_count": stats["items_by_category"].get(cat, 0)
        })
    
    # Get last AI message from history
    history = session.conversation_history or []
    last_ai_msg = None
    for msg in reversed(history):
        if msg.get("role") == "assistant":
            last_ai_msg = msg.get("content")
            break
    
    return {
        "success": True,
        "data": {
            "session_id": session.id,
            "categories_status": categories_status,
            "is_complete": stats["all_categories_covered"],
            "pending_items_count": stats["pending_items_count"],
            "last_ai_response": last_ai_msg
        },
        "message": "Conversation state retrieved",
        "meta": {}
    }


# ============== AI Conversation Endpoint ==============

@router.post(
    "/sessions/{session_id}/chat",
    status_code=status.HTTP_200_OK,
    response_model=DailyUpdateConversationResponse,
    summary="Send message to AI",
    description="Send a message to the AI interviewer and get a response"
)
@ai_rate_limit(
    feature="daily_update:chat",
    key_param="current_user",
    requests=settings.daily_update_rate_limit_requests,
    window_seconds=settings.daily_update_rate_limit_window_seconds,
)
async def chat_with_ai(
    session_id: UUID = Path(..., description="Session ID"),
    request: DailyUpdateConversationRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """
    Send a message to the AI daily update interviewer.
    The AI will respond and may create draft entries automatically.
    """
    session = DailyUpdateService.get_session_by_id(db, current_user, session_id)
    
    if not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is no longer active. Start a new session."
        )
    
    # Add user message to history
    DailyUpdateService.add_conversation_message(
        db, session, "user", request.user_message
    )
    
    # Process with AI
    result = await daily_update_interviewer_strategy.execute(
        service=None,  # We'll use the strategy directly
        user_message=request.user_message,
        conversation_history=session.conversation_history or [],
        categories_covered=session.categories_covered or [],
        is_new_session=len(session.conversation_history or []) <= 1
    )
    
    # Add AI response to history
    DailyUpdateService.add_conversation_message(
        db, session, "assistant", result["ai_response"]
    )
    
    # Create draft entries from AI function calls
    created_entries = []
    for draft in result.get("draft_entries", []):
        try:
            entry_data = DraftEntryCreate(
                category=draft["category"],
                summary=draft["summary"],
                details=draft.get("details", {})
            )
            entry = DailyUpdateService.create_draft_entry(
                db, current_user, entry_data,
                raw_text=request.user_message,
                session_id=session.id
            )
            created_entries.append({
                "id": str(entry.id),
                "category": entry.category,
                "summary": entry.summary
            })
        except Exception as e:
            # Log but don't fail the whole request
            pass
    
    # Update categories covered
    for cat in result.get("categories_covered", []):
        DailyUpdateService.update_session_categories(db, session, cat)
    
    # Check if conversation is complete
    if result.get("is_complete"):
        # Optionally end the session automatically
        pass  # Let user decide when to end
    
    return {
        "success": True,
        "data": {
            "ai_response": result["ai_response"],
            "created_entries": created_entries,
            "categories_covered": result.get("categories_covered", []),
            "is_complete": result.get("is_complete", False)
        },
        "message": "Message processed",
        "meta": {
            "categories_mentioned": result.get("categories_mentioned", [])
        }
    }


# ============== Pending Updates Management ==============

@router.get(
    "/pending",
    status_code=status.HTTP_200_OK,
    response_model=PendingUpdatesResponse,
    summary="List pending updates",
    description="Get all pending updates awaiting review"
)
def get_pending_updates(
    category: Optional[UpdateCategory] = Query(None, description="Filter by category"),
    status_filter: Optional[UpdateStatus] = Query(None, alias="status", description="Filter by status"),
    session_id: Optional[UUID] = Query(None, description="Filter by session"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get pending updates with optional filters."""
    result = DailyUpdateService.get_pending_updates(
        db, current_user, category, status_filter, session_id, page, limit
    )
    
    return {
        "success": True,
        "data": result["data"],
        "message": "Pending updates retrieved",
        "meta": result["meta"]
    }


@router.get(
    "/pending/summary",
    status_code=status.HTTP_200_OK,
    summary="Get pending summary",
    description="Get a summary of all pending updates"
)
def get_pending_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get a summary count of pending updates by category."""
    summary = DailyUpdateService.get_pending_summary(db, current_user)
    
    return {
        "success": True,
        "data": {
            "total_pending": summary["total_pending"],
            "by_category": summary["by_category"],
            "has_pending": summary["has_pending"]
        },
        "message": f"{summary['total_pending']} pending items from your Daily Update",
        "meta": {}
    }


@router.get(
    "/pending/{update_id}",
    status_code=status.HTTP_200_OK,
    response_model=PendingUpdateResponse,
    summary="Get pending update",
    description="Get a specific pending update by ID"
)
def get_pending_update(
    update_id: UUID = Path(..., description="Update ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Get a specific pending update."""
    update = DailyUpdateService.get_pending_update_by_id(db, current_user, update_id)
    
    return {
        "success": True,
        "data": update,
        "message": "Pending update retrieved",
        "meta": {}
    }


@router.patch(
    "/pending/{update_id}",
    status_code=status.HTTP_200_OK,
    response_model=PendingUpdateResponse,
    summary="Edit pending update",
    description="Edit a pending update before accepting"
)
def edit_pending_update(
    update_id: UUID = Path(..., description="Update ID"),
    edit_data: PendingUpdateEdit = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Edit a pending update before accepting."""
    update = DailyUpdateService.edit_pending_update(db, current_user, update_id, edit_data)
    
    return {
        "success": True,
        "data": update,
        "message": "Pending update edited",
        "meta": {}
    }


@router.delete(
    "/pending/{update_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    summary="Delete pending update",
    description="Delete a pending update"
)
def delete_pending_update(
    update_id: UUID = Path(..., description="Update ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Delete a pending update."""
    DailyUpdateService.delete_pending_update(db, current_user, update_id)
    
    return {
        "success": True,
        "message": "Pending update deleted",
        "meta": {}
    }


# ============== Accept/Reject Endpoints ==============

@router.post(
    "/pending/{update_id}/accept",
    status_code=status.HTTP_200_OK,
    summary="Accept pending update",
    description="Accept a pending update and transfer to the real table"
)
def accept_pending_update(
    update_id: UUID = Path(..., description="Update ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """
    Accept a pending update.
    This transfers the data to the appropriate table (tasks, expenses, events, or journal).
    """
    result = DailyUpdateService.accept_pending_update(db, current_user, update_id)
    
    return {
        "success": True,
        "data": result,
        "message": f"{result['category'].title()} created successfully",
        "meta": {}
    }


@router.post(
    "/pending/{update_id}/reject",
    status_code=status.HTTP_200_OK,
    response_model=PendingUpdateResponse,
    summary="Reject pending update",
    description="Reject a pending update (marks as rejected)"
)
def reject_pending_update(
    update_id: UUID = Path(..., description="Update ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Reject a pending update."""
    update = DailyUpdateService.reject_pending_update(db, current_user, update_id)
    
    return {
        "success": True,
        "data": update,
        "message": "Pending update rejected",
        "meta": {}
    }


@router.post(
    "/pending/accept-all",
    status_code=status.HTTP_200_OK,
    response_model=BatchAcceptResponse,
    summary="Accept all pending updates",
    description="Accept all pending updates at once"
)
def accept_all_pending(
    session_id: Optional[UUID] = Query(None, description="Only accept from this session"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Accept all pending updates (optionally for a specific session)."""
    results = DailyUpdateService.accept_all_pending(db, current_user, session_id)
    
    successful = sum(1 for r in results if r.get("success"))
    failed = len(results) - successful
    
    return {
        "success": True,
        "data": results,
        "message": f"Accepted {successful} items" + (f", {failed} failed" if failed else ""),
        "meta": {
            "successful": successful,
            "failed": failed,
            "total": len(results)
        }
    }


# ============== Manual Entry Creation ==============

@router.post(
    "/pending",
    status_code=status.HTTP_201_CREATED,
    response_model=PendingUpdateResponse,
    summary="Create pending update manually",
    description="Create a pending update entry manually (without AI)"
)
def create_pending_update(
    update_data: PendingUpdateCreate,
    session_id: Optional[UUID] = Query(None, description="Link to a session"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user())
):
    """Create a pending update manually."""
    update = DailyUpdateService.create_pending_update(
        db, current_user, update_data, session_id
    )
    
    return {
        "success": True,
        "data": update,
        "message": "Pending update created",
        "meta": {}
    }
