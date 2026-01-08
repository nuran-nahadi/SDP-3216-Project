import apiClient from './client';
import { ApiResponse } from '../types';
import {
  PendingUpdate,
  DailyUpdateSession,
  ConversationState,
  PendingSummary,
  ChatResponseData,
  AcceptResult,
  PendingUpdateCreate,
  PendingUpdateEdit,
  ChatRequest,
  PendingUpdateFilters,
} from '../types/daily-update';

/**
 * Daily Update API service
 * Handles AI-assisted daily update sessions and pending updates management
 */

// ============================================================================
// Session Management
// ============================================================================

/**
 * Start a new daily update session
 * @returns New session with AI greeting
 */
export async function startDailyUpdateSession(): Promise<
  ApiResponse<DailyUpdateSession> & { meta: { greeting: string } }
> {
  const response = await apiClient.post<
    ApiResponse<DailyUpdateSession> & { meta: { greeting: string } }
  >('/daily-updates/sessions/start');
  return response.data;
}

/**
 * Get the active daily update session
 * @returns Active session or null
 */
export async function getActiveDailyUpdateSession(): Promise<
  ApiResponse<DailyUpdateSession>
> {
  const response = await apiClient.get<ApiResponse<DailyUpdateSession>>(
    '/daily-updates/sessions/active'
  );
  return response.data;
}

/**
 * End a daily update session
 * @param sessionId - Session ID
 * @returns Ended session
 */
export async function endDailyUpdateSession(
  sessionId: string
): Promise<ApiResponse<DailyUpdateSession>> {
  const response = await apiClient.post<ApiResponse<DailyUpdateSession>>(
    `/daily-updates/sessions/${sessionId}/end`
  );
  return response.data;
}

/**
 * Get conversation state for a session
 * @param sessionId - Session ID
 * @returns Conversation state with category coverage
 */
export async function getConversationState(
  sessionId: string
): Promise<ApiResponse<ConversationState>> {
  const response = await apiClient.get<ApiResponse<ConversationState>>(
    `/daily-updates/sessions/${sessionId}/state`
  );
  return response.data;
}

// ============================================================================
// AI Conversation
// ============================================================================

/**
 * Send a message to the AI interviewer
 * @param sessionId - Session ID
 * @param message - User message
 * @returns AI response and any created draft entries
 */
export async function chatWithAI(
  sessionId: string,
  message: string
): Promise<ApiResponse<ChatResponseData>> {
  const request: ChatRequest = {
    session_id: sessionId,
    user_message: message,
  };
  const response = await apiClient.post<ApiResponse<ChatResponseData>>(
    `/daily-updates/sessions/${sessionId}/chat`,
    request
  );
  return response.data;
}

// ============================================================================
// Pending Updates Management
// ============================================================================

/**
 * Get pending updates with optional filters
 * @param filters - Optional filters
 * @returns List of pending updates
 */
export async function getPendingUpdates(
  filters?: PendingUpdateFilters
): Promise<ApiResponse<PendingUpdate[]>> {
  const response = await apiClient.get<ApiResponse<PendingUpdate[]>>(
    '/daily-updates/pending',
    { params: filters }
  );
  return response.data;
}

/**
 * Get pending updates summary
 * @returns Summary of pending updates by category
 */
export async function getPendingSummary(): Promise<ApiResponse<PendingSummary>> {
  const response = await apiClient.get<ApiResponse<PendingSummary>>(
    '/daily-updates/pending/summary'
  );
  return response.data;
}

/**
 * Get a single pending update
 * @param updateId - Update ID
 * @returns Pending update
 */
export async function getPendingUpdate(
  updateId: string
): Promise<ApiResponse<PendingUpdate>> {
  const response = await apiClient.get<ApiResponse<PendingUpdate>>(
    `/daily-updates/pending/${updateId}`
  );
  return response.data;
}

/**
 * Create a pending update manually
 * @param data - Update data
 * @param sessionId - Optional session ID
 * @returns Created pending update
 */
export async function createPendingUpdate(
  data: PendingUpdateCreate,
  sessionId?: string
): Promise<ApiResponse<PendingUpdate>> {
  const response = await apiClient.post<ApiResponse<PendingUpdate>>(
    '/daily-updates/pending',
    data,
    { params: sessionId ? { session_id: sessionId } : undefined }
  );
  return response.data;
}

/**
 * Edit a pending update
 * @param updateId - Update ID
 * @param data - Updated data
 * @returns Updated pending update
 */
export async function editPendingUpdate(
  updateId: string,
  data: PendingUpdateEdit
): Promise<ApiResponse<PendingUpdate>> {
  const response = await apiClient.patch<ApiResponse<PendingUpdate>>(
    `/daily-updates/pending/${updateId}`,
    data
  );
  return response.data;
}

/**
 * Delete a pending update
 * @param updateId - Update ID
 * @returns Success message
 */
export async function deletePendingUpdate(
  updateId: string
): Promise<ApiResponse<null>> {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/daily-updates/pending/${updateId}`
  );
  return response.data;
}

// ============================================================================
// Accept/Reject Actions
// ============================================================================

/**
 * Accept a pending update and transfer to real table
 * @param updateId - Update ID
 * @returns Accept result with created item ID
 */
export async function acceptPendingUpdate(
  updateId: string
): Promise<ApiResponse<AcceptResult>> {
  const response = await apiClient.post<ApiResponse<AcceptResult>>(
    `/daily-updates/pending/${updateId}/accept`
  );
  return response.data;
}

/**
 * Reject a pending update
 * @param updateId - Update ID
 * @returns Rejected pending update
 */
export async function rejectPendingUpdate(
  updateId: string
): Promise<ApiResponse<PendingUpdate>> {
  const response = await apiClient.post<ApiResponse<PendingUpdate>>(
    `/daily-updates/pending/${updateId}/reject`
  );
  return response.data;
}

/**
 * Accept all pending updates
 * @param sessionId - Optional session ID to filter
 * @returns Array of accept results
 */
export async function acceptAllPendingUpdates(
  sessionId?: string
): Promise<ApiResponse<AcceptResult[]>> {
  const response = await apiClient.post<ApiResponse<AcceptResult[]>>(
    '/daily-updates/pending/accept-all',
    null,
    { params: sessionId ? { session_id: sessionId } : undefined }
  );
  return response.data;
}

// Export default for consistency
export default {
  startDailyUpdateSession,
  getActiveDailyUpdateSession,
  endDailyUpdateSession,
  getConversationState,
  chatWithAI,
  getPendingUpdates,
  getPendingSummary,
  getPendingUpdate,
  createPendingUpdate,
  editPendingUpdate,
  deletePendingUpdate,
  acceptPendingUpdate,
  rejectPendingUpdate,
  acceptAllPendingUpdates,
};
