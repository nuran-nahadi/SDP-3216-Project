"""Schemas for the Proactive Daily Update Agent feature."""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


class UpdateCategory(str, Enum):
    """Categories for pending updates."""
    task = "task"
    expense = "expense"
    event = "event"
    journal = "journal"


class UpdateStatus(str, Enum):
    """Status of a pending update."""
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# ============== Create/Update Schemas ==============

class PendingUpdateCreate(BaseModel):
    """Schema for creating a pending update from AI conversation."""
    category: UpdateCategory
    summary: str = Field(..., min_length=1, max_length=255, description="Short title/summary of the entry")
    raw_text: Optional[str] = Field(None, max_length=2000, description="Original user statement")
    structured_data: Dict[str, Any] = Field(default_factory=dict, description="Extracted structured data")


class PendingUpdateEdit(BaseModel):
    """Schema for editing a pending update before accepting."""
    summary: Optional[str] = Field(None, min_length=1, max_length=255)
    structured_data: Optional[Dict[str, Any]] = None


class PendingUpdateStatusChange(BaseModel):
    """Schema for changing the status of a pending update."""
    status: UpdateStatus


class BatchStatusChange(BaseModel):
    """Schema for batch status changes."""
    ids: List[UUID]
    status: UpdateStatus


# ============== Output Schemas ==============

class PendingUpdateOut(BaseModel):
    """Output schema for a pending update."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    category: UpdateCategory
    summary: str
    raw_text: Optional[str]
    structured_data: Dict[str, Any]
    status: UpdateStatus
    session_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime


class PendingUpdatesResponse(BaseModel):
    """Response for listing pending updates."""
    success: bool
    data: List[PendingUpdateOut]
    message: str
    meta: Dict[str, Any] = {}


class PendingUpdateResponse(BaseModel):
    """Response for a single pending update."""
    success: bool
    data: PendingUpdateOut
    message: str
    meta: Dict[str, Any] = {}


class MessageResponse(BaseModel):
    """Simple message response."""
    success: bool
    message: str
    meta: Dict[str, Any] = {}


# ============== Daily Update Session Schemas ==============

class DailyUpdateSessionCreate(BaseModel):
    """Schema for starting a new daily update session."""
    pass  # No parameters needed, session starts automatically


class DailyUpdateSessionOut(BaseModel):
    """Output schema for a daily update session."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    started_at: datetime
    ended_at: Optional[datetime]
    is_active: bool
    categories_covered: List[str]
    total_items_captured: int


class DailyUpdateSessionResponse(BaseModel):
    """Response for a daily update session."""
    success: bool
    data: DailyUpdateSessionOut
    message: str
    meta: Dict[str, Any] = {}


# ============== AI Conversation Schemas ==============

class ConversationMessage(BaseModel):
    """A single message in the conversation."""
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class DailyUpdateConversationRequest(BaseModel):
    """Request for processing user input in daily update conversation."""
    session_id: UUID
    user_message: str = Field(..., min_length=1, max_length=5000)


class DailyUpdateConversationResponse(BaseModel):
    """Response from the AI in daily update conversation."""
    success: bool
    data: Dict[str, Any]
    message: str
    meta: Dict[str, Any] = {}


class CategoryStatus(BaseModel):
    """Status of a category in the daily update."""
    category: UpdateCategory
    is_covered: bool
    items_count: int


class ConversationState(BaseModel):
    """Current state of the daily update conversation."""
    session_id: UUID
    categories_status: List[CategoryStatus]
    is_complete: bool
    pending_items_count: int
    last_ai_response: Optional[str]


class ConversationStateResponse(BaseModel):
    """Response with conversation state."""
    success: bool
    data: ConversationState
    message: str
    meta: Dict[str, Any] = {}


# ============== Draft Entry Schema (for AI function calling) ==============

class DraftEntryCreate(BaseModel):
    """Schema matching the AI's create_draft_entry function parameters."""
    category: UpdateCategory
    summary: str = Field(..., description="A short title (e.g., 'Lunch at Subway')")
    details: Dict[str, Any] = Field(
        default_factory=dict,
        description="Category-specific fields as JSON"
    )


# ============== Accept/Transfer Schemas ==============

class AcceptedItemResult(BaseModel):
    """Result of accepting a single pending update."""
    pending_update_id: UUID
    category: UpdateCategory
    created_item_id: UUID
    success: bool
    error: Optional[str] = None


class BatchAcceptResponse(BaseModel):
    """Response for batch accepting pending updates."""
    success: bool
    data: List[AcceptedItemResult]
    message: str
    meta: Dict[str, Any] = {}
