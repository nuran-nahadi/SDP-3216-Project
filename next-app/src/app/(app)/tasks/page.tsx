'use client';

import { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/lib/types/task';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useTaskActions } from '@/lib/hooks/use-task-actions';
import { parseText } from '@/lib/api/tasks';
import { TaskTabs, TaskList, TaskForm, TaskFilter } from '@/components/features/tasks';
import { AIChatPanel } from '@/components/shared/ai-chat-panel';
import { AIFloatingButton } from '@/components/shared/ai-floating-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TaskFilter>('today');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { tasks, loading, error } = useTasks({ filter: activeTab });
  const { completeTaskAction, deleteTaskAction } = useTaskActions();

  const handleComplete = async (taskId: string, actualDuration?: number) => {
    await completeTaskAction(taskId, actualDuration);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowCreateDialog(true);
  };

  const handleDelete = async (taskId: string) => {
    await deleteTaskAction(taskId);
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingTask(null);
    setShowQuickAdd(false);
  };

  const handleFormCancel = () => {
    setShowCreateDialog(false);
    setEditingTask(null);
    setShowQuickAdd(false);
    setAiSuggestion(null);
  };

  const handleAIMessage = async (message: string) => {
    try {
      const response = await parseText(message);
      const parsed = response.data;

      let content = 'I\'ve analyzed your task! Here\'s what I found:\n\n';
      
      if (parsed.title) content += `📝 Title: ${parsed.title}\n`;
      if (parsed.priority) content += `⚡ Priority: ${parsed.priority}\n`;
      if (parsed.due_date) content += `📅 Due Date: ${parsed.due_date}\n`;
      if (parsed.estimated_duration) content += `⏱️ Duration: ${parsed.estimated_duration} min\n`;
      if (parsed.tags && parsed.tags.length > 0) {
        content += `🏷️ Tags: ${parsed.tags.join(', ')}\n`;
      }

      content += '\nWould you like to create this task?';

      // Convert date to datetime-local format if present
      let formattedDueDate = '';
      if (parsed.due_date) {
        try {
          const date = new Date(parsed.due_date);
          // Format as YYYY-MM-DDTHH:MM for datetime-local input
          formattedDueDate = date.toISOString().slice(0, 16);
        } catch (e) {
          formattedDueDate = '';
        }
      }

      return {
        content,
        data: {
          title: parsed.title || '',
          description: parsed.description || '',
          due_date: formattedDueDate,
          priority: parsed.priority || TaskPriority.MEDIUM,
          estimated_duration: parsed.estimated_duration || undefined,
          tags: parsed.tags || [],
        },
      };
    } catch (error) {
      return {
        content: 'I had trouble understanding that. Could you describe the task differently?',
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
              <p className="text-muted-foreground mt-1">
                Manage your tasks and stay organized
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

      {/* Tabs */}
      <div className="mb-6">
        <TaskTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Quick Add Form (Today Tab Only) */}
      {activeTab === 'today' && !showQuickAdd && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setShowQuickAdd(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick add task for today...
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'today' && showQuickAdd && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Add Task</CardTitle>
            <CardDescription>Create a task for today</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <TaskList
        tasks={tasks}
        loading={loading}
        variant={activeTab}
        onComplete={handleComplete}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask || undefined}
            initialData={aiSuggestion}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        title="Task AI Assistant"
        placeholder="Describe your task..."
        onSendMessage={handleAIMessage}
        onAcceptSuggestion={handleAcceptSuggestion}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      {/* Floating AI Button */}
      <AIFloatingButton onClick={() => setShowAIChat(true)} isOpen={showAIChat} />
    </div>
  );
}
