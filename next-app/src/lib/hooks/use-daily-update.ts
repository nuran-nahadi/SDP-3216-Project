'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  startDailyUpdateSession,
  getActiveDailyUpdateSession,
  endDailyUpdateSession,
  getConversationState,
  chatWithAI,
  getPendingUpdates,
  getPendingSummary,
  acceptPendingUpdate,
  rejectPendingUpdate,
  acceptAllPendingUpdates,
  editPendingUpdate,
  deletePendingUpdate,
} from '../api/daily-update';
import {
  DailyUpdateSession,
  ConversationState,
  PendingUpdate,
  PendingSummary,
  ChatResponseData,
  AcceptResult,
  PendingUpdateEdit,
  UpdateCategory,
  UpdateStatus,
} from '../types/daily-update';

// ============================================================================
// Session Hook
// ============================================================================

export interface UseDailyUpdateSessionReturn {
  session: DailyUpdateSession | null;
  conversationState: ConversationState | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading
  error: Error | null;
  greeting: string | null;
  startSession: () => Promise<DailyUpdateSession | null>;
  endSession: () => Promise<void>;
  refreshState: () => Promise<void>;
  sendMessage: (message: string) => Promise<ChatResponseData | null>;
}

export function useDailyUpdateSession(): UseDailyUpdateSessionReturn {
  const [session, setSession] = useState<DailyUpdateSession | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [greeting, setGreeting] = useState<string | null>(null);

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await getActiveDailyUpdateSession();
        if (response.success && response.data) {
          setSession(response.data);
          // Fetch conversation state
          const stateResponse = await getConversationState(response.data.id);
          if (stateResponse.success) {
            setConversationState(stateResponse.data);
          }
        }
      } catch {
        // No active session, that's fine
      }
    };
    checkActiveSession();
  }, []);

  const startSession = useCallback(async (): Promise<DailyUpdateSession | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await startDailyUpdateSession();
      if (response.success) {
        setSession(response.data);
        setGreeting(response.meta?.greeting || "Hi! Ready for your daily update. How did your day go?");
        // Initialize conversation state
        const stateResponse = await getConversationState(response.data.id);
        if (stateResponse.success) {
          setConversationState(stateResponse.data);
        }
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      await endDailyUpdateSession(session.id);
      setSession(null);
      setConversationState(null);
      setGreeting(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const refreshState = useCallback(async () => {
    if (!session) return;
    try {
      const stateResponse = await getConversationState(session.id);
      if (stateResponse.success) {
        setConversationState(stateResponse.data);
      }
    } catch (err) {
      console.error('Error refreshing conversation state:', err);
    }
  }, [session]);

  const sendMessage = useCallback(async (message: string): Promise<ChatResponseData | null> => {
    if (!session) return null;
    setLoading(true);
    try {
      const response = await chatWithAI(session.id, message);
      if (response.success) {
        // Refresh conversation state
        await refreshState();
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, refreshState]);

  return {
    session,
    conversationState,
    loading,
    isLoading: loading, // Alias
    error,
    greeting,
    startSession,
    endSession,
    refreshState,
    sendMessage,
  };
}

// ============================================================================
// Chat Hook
// ============================================================================

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  createdEntries?: ChatResponseData['created_entries'];
}

export interface UseDailyUpdateChatReturn {
  messages: Message[];
  sending: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<ChatResponseData | null>;
  clearMessages: () => void;
  addAssistantMessage: (content: string) => void;
}

export function useDailyUpdateChat(sessionId: string | null): UseDailyUpdateChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (message: string): Promise<ChatResponseData | null> => {
    if (!sessionId) return null;
    
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    setSending(true);
    setError(null);
    
    try {
      const response = await chatWithAI(sessionId, message);
      if (response.success) {
        // Add assistant response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.data.ai_response,
          timestamp: new Date(),
          createdEntries: response.data.created_entries,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err as Error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble processing that. Could you try again?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return null;
    } finally {
      setSending(false);
    }
  }, [sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addAssistantMessage = useCallback((content: string) => {
    const message: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    sending,
    error,
    sendMessage,
    clearMessages,
    addAssistantMessage,
  };
}

// ============================================================================
// Pending Updates Hook
// ============================================================================

export interface UsePendingUpdatesReturn {
  pendingUpdates: PendingUpdate[];
  updates: PendingUpdate[]; // Alias
  summary: PendingSummary | null;
  loading: boolean;
  isLoading: boolean; // Alias
  error: Error | null;
  refetch: () => Promise<void>;
  fetchUpdates: (filters?: { status?: UpdateStatus; category?: UpdateCategory; sessionId?: string }) => Promise<void>;
  acceptUpdate: (id: string) => Promise<AcceptResult | null>;
  rejectUpdate: (id: string) => Promise<boolean>;
  acceptAll: (sessionId?: string) => Promise<AcceptResult[]>;
  editUpdate: (id: string, data: PendingUpdateEdit) => Promise<boolean>;
  updatePending: (id: string, data: PendingUpdateEdit) => Promise<boolean>; // Alias
  deleteUpdate: (id: string) => Promise<boolean>;
}

export function usePendingUpdates(filters?: {
  category?: UpdateCategory;
  status?: UpdateStatus;
  sessionId?: string;
}): UsePendingUpdatesReturn {
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [summary, setSummary] = useState<PendingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [updatesResponse, summaryResponse] = await Promise.all([
        getPendingUpdates({
          category: filters?.category,
          status: filters?.status || 'pending',
          session_id: filters?.sessionId,
        }),
        getPendingSummary(),
      ]);
      
      if (updatesResponse.success) {
        setPendingUpdates(updatesResponse.data);
      }
      if (summaryResponse.success) {
        setSummary(summaryResponse.data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters?.category, filters?.status, filters?.sessionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const acceptUpdate = useCallback(async (id: string): Promise<AcceptResult | null> => {
    try {
      const response = await acceptPendingUpdate(id);
      if (response.success) {
        await refetch();
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [refetch]);

  const rejectUpdate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await rejectPendingUpdate(id);
      if (response.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [refetch]);

  const acceptAll = useCallback(async (sessionId?: string): Promise<AcceptResult[]> => {
    try {
      const response = await acceptAllPendingUpdates(sessionId);
      if (response.success) {
        await refetch();
        return response.data;
      }
      return [];
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, [refetch]);

  const editUpdate = useCallback(async (id: string, data: PendingUpdateEdit): Promise<boolean> => {
    try {
      const response = await editPendingUpdate(id, data);
      if (response.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [refetch]);

  const deleteUpdate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await deletePendingUpdate(id);
      if (response.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [refetch]);

  return {
    pendingUpdates,
    updates: pendingUpdates, // Alias
    summary,
    loading,
    isLoading: loading, // Alias
    error,
    refetch,
    fetchUpdates: refetch, // Alias
    acceptUpdate,
    rejectUpdate,
    acceptAll,
    editUpdate,
    updatePending: editUpdate, // Alias
    deleteUpdate,
  };
}

// ============================================================================
// Pending Summary Hook (lightweight, for dashboard cards)
// ============================================================================

export interface UsePendingSummaryReturn {
  summary: PendingSummary | null;
  loading: boolean;
  isLoading: boolean; // Alias
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePendingSummary(): UsePendingSummaryReturn {
  const [summary, setSummary] = useState<PendingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const response = await getPendingSummary();
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    summary,
    loading,
    isLoading: loading, // Alias
    error,
    refetch,
  };
}
