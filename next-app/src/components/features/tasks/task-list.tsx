'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Task } from '@/lib/types/task';
import { TaskItem } from './task-item';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/shared/skeleton';
import { CheckCircle2 } from 'lucide-react';
import { getFriendlyDateLabel } from '@/lib/utils/date';

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  variant?: 'today' | 'overdue' | 'all';
  onComplete: (taskId: string, actualDuration?: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskList({
  tasks,
  loading = false,
  variant = 'all',
  onComplete,
  onEdit,
  onDelete,
}: TaskListProps) {
  const groupedTasks = useMemo(() => {
    const groups: { key: string; label: string; tasks: Task[] }[] = [];
    const indexMap = new Map<string, number>();

    tasks.forEach((task) => {
      const hasDueDate = Boolean(task.due_date);
      const key = hasDueDate ? format(parseISO(task.due_date as string), 'yyyy-MM-dd') : 'no-date';
      const label = hasDueDate ? getFriendlyDateLabel(task.due_date as string) : 'No due date';

      if (!indexMap.has(key)) {
        indexMap.set(key, groups.length);
        groups.push({ key, label, tasks: [] });
      }

      const groupIndex = indexMap.get(key);
      if (groupIndex !== undefined) {
        groups[groupIndex].tasks.push(task);
      }
    });

    return groups;
  }, [tasks]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    const emptyMessages = {
      today: {
        title: 'No tasks for today',
        description: 'You have no tasks scheduled for today. Create a new task to get started.',
      },
      overdue: {
        title: 'No overdue tasks',
        description: 'Great job! You have no overdue tasks.',
      },
      all: {
        title: 'No tasks yet',
        description: 'Create your first task to start organizing your work.',
      },
    };

    const message = emptyMessages[variant];

    return (
      <EmptyState
        icon={CheckCircle2}
        title={message.title}
        description={message.description}
      />
    );
  }

  return (
    <div className="space-y-6">
      {groupedTasks.map((group) => (
        <div key={group.key} className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {group.tasks.map((task, index) => (
            <div
              key={task.id}
              className="fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TaskItem
                task={task}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
