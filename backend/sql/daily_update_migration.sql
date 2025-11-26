-- =====================================================
-- Migration: Proactive Daily Update Agent Feature
-- Description: Creates tables for pending updates and daily update sessions
-- =====================================================

-- Enable UUID generation (should already exist)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Category types for pending updates
DO $$ BEGIN
    CREATE TYPE pending_update_categories AS ENUM ('task', 'expense', 'event', 'journal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status types for pending updates
DO $$ BEGIN
    CREATE TYPE pending_update_statuses AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =====================================================
-- DAILY UPDATE SESSIONS TABLE
-- Tracks individual conversation sessions with the AI
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_update_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Is this session still active?
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Track which categories have been covered (JSON array)
    -- e.g., ["task", "expense"] means tasks and expenses have been discussed
    categories_covered JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Conversation history for context (optional, for debugging/review)
    -- Array of {role: "user"|"assistant", content: "...", timestamp: "..."}
    conversation_history JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding active sessions
CREATE INDEX IF NOT EXISTS idx_daily_update_sessions_user_active 
ON daily_update_sessions(user_id, is_active) 
WHERE is_active = TRUE;

-- Index for user's session history
CREATE INDEX IF NOT EXISTS idx_daily_update_sessions_user_id 
ON daily_update_sessions(user_id);


-- =====================================================
-- PENDING UPDATES TABLE
-- Staging table for AI-captured data before user confirmation
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Category of the entry: task, expense, event, or journal
    category pending_update_categories NOT NULL,
    
    -- Short summary/title of the entry
    summary VARCHAR(255) NOT NULL,
    
    -- The raw text from the user (for context and debugging)
    raw_text TEXT,
    
    -- Structured data extracted by AI (stored as JSONB for flexible querying)
    -- Example for expense: {"amount": 50, "currency": "USD", "merchant": "Subway"}
    -- Example for task: {"status": "done", "project": "Website", "due_date": "2024-01-15"}
    structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Status: pending (awaiting review), accepted (moved to real table), rejected (discarded)
    status pending_update_statuses NOT NULL DEFAULT 'pending',
    
    -- Link to the daily update session that created this entry
    session_id UUID REFERENCES daily_update_sessions(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding pending items for a user
CREATE INDEX IF NOT EXISTS idx_pending_updates_user_status 
ON pending_updates(user_id, status);

-- Index for finding items by session
CREATE INDEX IF NOT EXISTS idx_pending_updates_session 
ON pending_updates(session_id) 
WHERE session_id IS NOT NULL;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_pending_updates_category 
ON pending_updates(user_id, category, status);

-- GIN index for searching in structured_data
CREATE INDEX IF NOT EXISTS idx_pending_updates_structured_data 
ON pending_updates USING GIN (structured_data);


-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for daily_update_sessions
DROP TRIGGER IF EXISTS update_daily_update_sessions_updated_at ON daily_update_sessions;
CREATE TRIGGER update_daily_update_sessions_updated_at
    BEFORE UPDATE ON daily_update_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for pending_updates
DROP TRIGGER IF EXISTS update_pending_updates_updated_at ON pending_updates;
CREATE TRIGGER update_pending_updates_updated_at
    BEFORE UPDATE ON pending_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE daily_update_sessions IS 
'Tracks daily update conversation sessions with the AI interviewer';

COMMENT ON TABLE pending_updates IS 
'Staging table for AI-captured entries awaiting user review/confirmation';

COMMENT ON COLUMN pending_updates.category IS 
'Type of entry: task, expense, event, or journal';

COMMENT ON COLUMN pending_updates.structured_data IS 
'JSON object containing category-specific extracted data (amount, status, time, etc.)';

COMMENT ON COLUMN pending_updates.status IS 
'pending=awaiting review, accepted=transferred to real table, rejected=discarded';

COMMENT ON COLUMN daily_update_sessions.categories_covered IS 
'JSON array of categories discussed in this session: ["task","expense","event","journal"]';

COMMENT ON COLUMN daily_update_sessions.conversation_history IS 
'Full conversation transcript as JSON array of message objects';
