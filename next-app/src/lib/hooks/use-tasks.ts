import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/lib/types/task';
import { getTasks, getTodayTasks, getOverdueTasks } from '@/lib/api/tasks';
import { useEventBus } from './use-event-bus';
import {
  TASK_CREATED,
  TASK_UPDATED,
  TASK_DELETED,
  TASK_COMPLETED,
} from '@/lib/utils/event-types';
import { handleApiError } from '@/lib/utils/error-handler';

export type TaskFilter = 'today' | 'overdue' | 'all';

interface UseTasksOptions {
  filter?: TaskFilter;
  autoFetch?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { filter = 'all', autoFetch = true } = options;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = useCallback(async (isInitial = false) => {
    try {
      // Only show loading spinner on initial load, not on refreshes
      if (isInitial) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      let response;
      switch (filter) {
        case 'today':
          response = await getTodayTasks();
          break;
        case 'overdue':
          response = await getOverdueTasks();
          break;
        case 'all':
        default:
          response = await getTasks();
          break;
      }

      setTasks(response.data);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filter]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchTasks(true);
    }
  }, [fetchTasks, autoFetch]);

  // Subscribe to task events for auto-refresh (without showing loading state)
  useEventBus([TASK_CREATED, TASK_UPDATED, TASK_DELETED, TASK_COMPLETED], () => fetchTasks(false));

  return {
    tasks,
    loading,
    error,
    refetch: () => fetchTasks(false),
  };
}
