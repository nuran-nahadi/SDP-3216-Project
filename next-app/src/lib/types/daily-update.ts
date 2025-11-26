/**
 * Daily Update type definitions
 */

// Enum types
export type UpdateCategory = 'task' | 'expense' | 'event' | 'journal';
export type UpdateStatus = 'pending' | 'accepted' | 'rejected';

// Pending Update
export interface PendingUpdate {
  id: string;
  user_id: string;
  category: UpdateCategory;
  summary: string;
  raw_text: string | null;
  structured_data: Record<string, unknown>;
  status: UpdateStatus;
  session_id: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

// Daily Update Session
export interface DailyUpdateSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  categories_covered: string[];
  total_items_captured: number;
}

// Category Status
export interface CategoryStatus {
  category: UpdateCategory;
  is_covered: boolean;
  items_count: number;
}

// Conversation Message
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

// Conversation State
export interface ConversationState {
  session_id: string;
  categories_status: CategoryStatus[];
  is_complete: boolean;
  pending_items_count: number;
  last_ai_response: string | null;
}

// Pending Summary
export interface PendingSummary {
  total_pending: number;
  by_category: Record<UpdateCategory, number>;
  has_pending: boolean;
}

// Chat Response Data
export interface ChatResponseData {
  ai_response: string;
  created_entries: Array<{
    id: string;
    category: UpdateCategory;
    summary: string;
  }>;
  categories_covered: string[];
  is_complete: boolean;
}

// Accept Result
export interface AcceptResult {
  pending_update_id: string;
  category: UpdateCategory;
  created_item_id: string;
  success: boolean;
  error?: string;
}

// Form Data Types
export interface PendingUpdateCreate {
  category: UpdateCategory;
  summary: string;
  raw_text?: string;
  structured_data: Record<string, unknown>;
}

export interface PendingUpdateEdit {
  summary?: string;
  structured_data?: Record<string, unknown>;
}

export interface ChatRequest {
  session_id: string;
  user_message: string;
}

// Filters
export interface PendingUpdateFilters {
  category?: UpdateCategory;
  status?: UpdateStatus;
  session_id?: string;
  page?: number;
  limit?: number;
}
