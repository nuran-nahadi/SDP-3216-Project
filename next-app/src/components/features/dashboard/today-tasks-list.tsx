'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getTodayTasks, completeTask } from '@/lib/api/tasks';
import { Task, TaskPriority } from '@/lib/types';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  TASK_CREATED,
  TASK_UPDATED,
  TASK_DELETED,
  TASK_COMPLETED,
} from '@/lib/utils/event-types';
import { eventBus } from '@/lib/utils/event-bus';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function TodayTasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set()
  );

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTodayTasks();
      // Filter to show only incomplete tasks
      const incompleteTasks = response.data.filter((task) => !task.is_completed);
      setTasks(incompleteTasks);
    } catch (err) {
      console.error('Error fetching today tasks:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to task events for auto-refresh
  useEventBus(
    [TASK_CREATED, TASK_UPDATED, TASK_DELETED, TASK_COMPLETED],
    fetchTasks
  );

  const handleCompleteTask = async (taskId: string) => {
    try {
      setCompletingTaskIds((prev) => new Set(prev).add(taskId));
      
      const response = await completeTask(taskId);
      
      // Publish TASK_COMPLETED event
      eventBus.publish(TASK_COMPLETED, response.data);
      
      toast.success('Task completed!');
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task');
    } finally {
      setCompletingTaskIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load tasks. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Today&apos;s Tasks
          {tasks.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {tasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No tasks for today"
            description="You're all caught up! Add a new task to get started."
          />
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 hover:shadow-sm transition-all duration-200"
              >
                <Checkbox
                  id={`task-${task.id}`}
                  checked={false}
                  disabled={completingTaskIds.has(task.id)}
                  onCheckedChange={() => handleCompleteTask(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`task-${task.id}`}
                    className="text-sm font-semibold leading-none cursor-pointer hover:text-primary transition-colors"
                  >
                    {task.title}
                  </label>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge
                      variant="secondary"
                      className={`${priorityColors[task.priority]} text-xs`}
                    >
                      {task.priority}
                    </Badge>
                    {task.estimated_duration && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                        ~{task.estimated_duration}min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
