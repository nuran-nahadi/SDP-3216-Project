'use client';

import { Task } from '@/lib/types/task';
import { TaskItem } from './task-item';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/shared/skeleton';
import { CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-3">
      {tasks.map((task, index) => (
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
  );
}
