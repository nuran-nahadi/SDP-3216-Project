'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Filter, CheckCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DailyUpdateChat,
  PendingUpdateCard,
  PendingReviewModal,
} from '@/components/features/daily-update';
import {
  useDailyUpdateSession,
  usePendingUpdates,
} from '@/lib/hooks/use-daily-update';
import {
  PendingUpdate,
  UpdateCategory,
  ConversationMessage,
  PendingUpdateEdit,
} from '@/lib/types/daily-update';
import { cn } from '@/lib/utils/cn';

const categoryFilters: { value: UpdateCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'task', label: 'Tasks' },
  { value: 'expense', label: 'Expenses' },
  { value: 'event', label: 'Events' },
  { value: 'journal', label: 'Journal' },
];

export default function DailyUpdatePage() {
  const [categoryFilter, setCategoryFilter] = useState<UpdateCategory | 'all'>('all');
  const [editingUpdate, setEditingUpdate] = useState<PendingUpdate | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);

  // Session hook
  const {
    session,
    isLoading: sessionLoading,
    startSession,
    endSession,
    sendMessage,
  } = useDailyUpdateSession();

  // Pending updates hook
  const {
    updates,
    isLoading: updatesLoading,
    fetchUpdates,
    updatePending,
    acceptUpdate,
    rejectUpdate,
    acceptAll,
  } = usePendingUpdates();

  // Load pending updates on mount
  useEffect(() => {
    fetchUpdates({ status: 'pending' });
  }, [fetchUpdates]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message to local state immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    setConversationMessages((prev) => [...prev, userMessage]);

    // Send to backend
    const response = await sendMessage(message);

    if (response) {
      // Add assistant response
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.ai_response,
        timestamp: new Date().toISOString(),
      };
      setConversationMessages((prev) => [...prev, assistantMessage]);

      // Refresh pending updates if new entries were created
      if (response.created_entries.length > 0) {
        fetchUpdates({ status: 'pending' });
      }
    }
  }, [sendMessage, fetchUpdates]);

  // Handle starting a session
  const handleStartSession = useCallback(async () => {
    const newSession = await startSession();
    if (newSession) {
      setConversationMessages([]);
      // Add initial assistant greeting
      const greeting: ConversationMessage = {
        role: 'assistant',
        content: "Hello! I'm here to help you capture your daily updates. Tell me about any tasks you've completed, expenses you've made, events you have coming up, or anything you'd like to journal about. I'll organize everything for you!",
        timestamp: new Date().toISOString(),
      };
      setConversationMessages([greeting]);
    }
  }, [startSession]);

  // Handle ending a session
  const handleEndSession = useCallback(async () => {
    await endSession();
    setConversationMessages([]);
    fetchUpdates({ status: 'pending' });
  }, [endSession, fetchUpdates]);

  // Handle edit modal save
  const handleEditSave = useCallback(async (id: string, data: PendingUpdateEdit) => {
    await updatePending(id, data);
  }, [updatePending]);

  // Handle accept
  const handleAccept = useCallback(async (id: string) => {
    await acceptUpdate(id);
    setEditingUpdate(null);
  }, [acceptUpdate]);

  // Handle reject
  const handleReject = useCallback(async (id: string) => {
    await rejectUpdate(id);
    setEditingUpdate(null);
  }, [rejectUpdate]);

  // Handle accept all
  const handleAcceptAll = useCallback(async () => {
    await acceptAll();
  }, [acceptAll]);

  // Filter updates
  const filteredUpdates = updates.filter((update) => {
    if (categoryFilter === 'all') return true;
    return update.category === categoryFilter;
  });

  const pendingCount = updates.filter((u) => u.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-[1600px]">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Daily Update
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Chat with your AI assistant to quickly capture tasks, expenses, events, and journal entries.
          </p>
        </div>

        {/* Main content - two column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column - Chat */}
          <div className="lg:row-span-2 min-h-[600px]">
            <DailyUpdateChat
              session={session}
              messages={conversationMessages}
              isLoading={sessionLoading}
              isSending={sessionLoading}
              onSendMessage={handleSendMessage}
              onStartSession={handleStartSession}
              onEndSession={handleEndSession}
              pendingCount={pendingCount}
            />
          </div>

          {/* Right column - Pending updates */}
          <div className="space-y-4">
            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Pending Updates</h2>
                {pendingCount > 0 && (
                  <Badge variant="secondary">{pendingCount}</Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchUpdates({ status: 'pending' })}
                  disabled={updatesLoading}
                >
                  <RefreshCw className={cn(
                    "h-4 w-4 mr-1",
                    updatesLoading && "animate-spin"
                  )} />
                  Refresh
                </Button>

                {pendingCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAcceptAll}
                    disabled={updatesLoading}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Accept All
                  </Button>
                )}
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <Filter className="h-4 w-4 text-muted-foreground self-center mr-1" />
              {categoryFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={categoryFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Updates list */}
            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              {updatesLoading && filteredUpdates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading pending updates...
                </div>
              ) : filteredUpdates.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {categoryFilter === 'all'
                      ? 'No pending updates to review'
                      : `No pending ${categoryFilter} updates`}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Start a conversation to capture new entries
                  </p>
                </div>
              ) : (
                filteredUpdates.map((update) => (
                  <PendingUpdateCard
                    key={update.id}
                    update={update}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onEdit={setEditingUpdate}
                    isLoading={updatesLoading}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <PendingReviewModal
          update={editingUpdate}
          isOpen={!!editingUpdate}
          onClose={() => setEditingUpdate(null)}
          onSave={handleEditSave}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={updatesLoading}
        />
      </div>
    </div>
  );
}
