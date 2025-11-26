"""
SQLAlchemy model for the PendingUpdate table (Proactive Daily Update Agent).
This model stores draft entries captured during AI conversations before user confirmation.
"""

from sqlalchemy import Boolean, Column, String, ForeignKey, Text, Enum
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.database import Base
import uuid


class PendingUpdate(Base):
    """
    Staging table for AI-captured data entries before user confirmation.
    This is the 'holding area' where the Proactive Interviewer saves draft entries.
    """
    __tablename__ = "pending_updates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Category of the entry: task, expense, event, or journal
    category = Column(
        Enum("task", "expense", "event", "journal", name="pending_update_categories"),
        nullable=False
    )
    
    # Short summary/title of the entry
    summary = Column(String(255), nullable=False)
    
    # The raw text from the user (for context and debugging)
    raw_text = Column(Text, nullable=True)
    
    # Structured data extracted by AI (stored as JSONB for flexible querying)
    # Example for expense: {"amount": 50, "currency": "USD", "merchant": "Subway"}
    # Example for task: {"status": "done", "project": "Website", "due_date": "2024-01-15"}
    structured_data = Column(JSONB, nullable=False, server_default='{}')
    
    # Status: pending (awaiting review), accepted (moved to real table), rejected (discarded)
    status = Column(
        Enum("pending", "accepted", "rejected", name="pending_update_statuses"),
        nullable=False,
        server_default="pending"
    )
    
    # Link to the daily update session that created this entry
    session_id = Column(UUID(as_uuid=True), ForeignKey("daily_update_sessions.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"), nullable=False)
    
    # Relationships
    user = relationship("User", backref="pending_updates")
    session = relationship("DailyUpdateSession", back_populates="pending_updates")


class DailyUpdateSession(Base):
    """
    Tracks a single daily update conversation session.
    Stores state about which categories have been covered.
    """
    __tablename__ = "daily_update_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Session timing
    started_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)
    ended_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Is this session still active?
    is_active = Column(Boolean, server_default="True", nullable=False)
    
    # Track which categories have been covered (stored as JSON array)
    # e.g., ["task", "expense"] means tasks and expenses have been discussed
    categories_covered = Column(JSONB, nullable=False, server_default='[]')
    
    # Conversation history for context (optional, for debugging/review)
    conversation_history = Column(JSONB, nullable=True, server_default='[]')
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"), onupdate=text("NOW()"), nullable=False)
    
    # Relationships
    user = relationship("User", backref="daily_update_sessions")
    pending_updates = relationship("PendingUpdate", back_populates="session")
