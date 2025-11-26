'use client';

import { useState, useEffect } from 'react';
import { JournalEntry, JournalMood } from '@/lib/types/journal';
import { getJournalEntries, deleteJournalEntry, getJournalStats, parseJournalText, parseVoice } from '@/lib/api/journal';
import { JournalForm, JournalEntryCard } from '@/components/features/journal';
import { AIChatPanel } from '@/components/shared/ai-chat-panel';
import { AIFloatingButton } from '@/components/shared/ai-floating-button';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, BookOpen, TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await getJournalEntries();
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getJournalStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, []);

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowCreateDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingEntryId(id);
  };

  const confirmDelete = async () => {
    if (deletingEntryId) {
      try {
        await deleteJournalEntry(deletingEntryId);
        toast.success('Journal entry deleted');
        fetchEntries();
        fetchStats();
      } catch (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry');
      }
      setDeletingEntryId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingEntry(null);
    fetchEntries();
    fetchStats();
  };

  const handleFormCancel = () => {
    setShowCreateDialog(false);
    setEditingEntry(null);
  };

  const handleAIMessage = async (message: string) => {
    try {
      const response = await parseJournalText(message);
      const parsed = response.data;

      let content = 'I\'ve analyzed your text! Here\'s what I found:\n\n';
      
      if (parsed.title) content += `📝 Title: ${parsed.title}\n`;
      if (parsed.mood) content += `😊 Mood: ${parsed.mood.replace('_', ' ')}\n`;
      if (parsed.weather) content += `🌤️ Weather: ${parsed.weather}\n`;
      if (parsed.location) content += `📍 Location: ${parsed.location}\n`;
      if (parsed.sentiment) content += `💭 Sentiment: ${parsed.sentiment}\n`;
      if (parsed.keywords && parsed.keywords.length > 0) {
        content += `🏷️ Keywords: ${parsed.keywords.join(', ')}\n`;
      }

      content += '\nWould you like to create a journal entry with this information?';

      return {
        content,
        data: {
          title: parsed.title || '',
          content: message,
          mood: parsed.mood as JournalMood,
          weather: parsed.weather || '',
          location: parsed.location || '',
        },
      };
    } catch (error) {
      return {
        content: 'I had trouble analyzing that. Could you try rephrasing or providing more details?',
      };
    }
  };

  const handleAIVoice = async (audioFile: File) => {
    try {
      const response = await parseVoice(audioFile);
      
      // Check if the response indicates failure
      if (!response.success) {
        const transcribedText = (response as any).transcribed_text || (response as any).data?.transcribed_text;
        let errorContent = response.message || 'I had trouble understanding that.';
        if (transcribedText) {
          errorContent = `📝 I heard: "${transcribedText}"\n\n${errorContent}\n\nPlease try again with more details about your thoughts or feelings.`;
        }
        return {
          content: errorContent,
          transcribedText,
        };
      }

      const parsed = response.data;

      let content = 'I\'ve analyzed your voice input! Here\'s what I found:\n\n';
      
      if (parsed.title) content += `📝 Title: ${parsed.title}\n`;
      if (parsed.mood) content += `😊 Mood: ${parsed.mood?.replace('_', ' ') || 'Not detected'}\n`;
      if (parsed.weather) content += `🌤️ Weather: ${parsed.weather}\n`;
      if (parsed.location) content += `📍 Location: ${parsed.location}\n`;
      if (parsed.sentiment) content += `💭 Sentiment: ${parsed.sentiment}\n`;
      if (parsed.keywords && parsed.keywords.length > 0) {
        content += `🏷️ Keywords: ${parsed.keywords.join(', ')}\n`;
      }

      content += '\nWould you like to create a journal entry with this information?';

      const transcribedText = parsed.transcribed_text || '';

      return {
        content,
        transcribedText,
        data: {
          title: parsed.title || '',
          content: transcribedText,
          mood: parsed.mood as JournalMood,
          weather: parsed.weather || '',
          location: parsed.location || '',
        },
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        content: 'I had trouble understanding your voice message. Please try again or speak more clearly.',
      };
    }
  };

  const handleAcceptSuggestion = (data: any) => {
    setAiSuggestion(data);
    setShowCreateDialog(true);
    setShowAIChat(false);
  };

  return (
    <div className="flex h-full">
      <div className={cn(
        'flex-1 transition-all duration-300',
        showAIChat ? 'mr-96' : 'mr-0'
      )}>
        <div className="container mx-auto p-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
              <p className="text-muted-foreground">Reflect on your thoughts and feelings</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.total_entries || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.current_streak || 0} days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.entries_this_week || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.entries_this_month || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No journal entries yet"
          description="Start writing your first journal entry to track your thoughts and feelings"
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Entry
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
            </DialogTitle>
          </DialogHeader>
          <JournalForm
            entry={editingEntry || undefined}
            initialData={aiSuggestion}
            onSuccess={() => {
              handleFormSuccess();
              setAiSuggestion(null);
            }}
            onCancel={() => {
              handleFormCancel();
              setAiSuggestion(null);
            }}
          />
        </DialogContent>
      </Dialog>

        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        title="Journal AI Assistant"
        placeholder="Describe your day or feelings..."
        onSendMessage={handleAIMessage}
        onSendVoice={handleAIVoice}
        onAcceptSuggestion={handleAcceptSuggestion}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        supportsVoice={true}
        supportsImage={false}
      />

      {/* Floating AI Button */}
      <AIFloatingButton onClick={() => setShowAIChat(true)} isOpen={showAIChat} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingEntryId} onOpenChange={(open) => !open && setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add cn import
import { cn } from '@/lib/utils/cn';
