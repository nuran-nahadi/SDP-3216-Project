'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTodayTasks } from '../api/tasks';
import { getUpcomingEvents } from '../api/events';
import { getTotalSpend } from '../api/expenses';
import { useEventBus } from './use-event-bus';
import {
  TASK_CREATED,
  TASK_UPDATED,
  TASK_DELETED,
  TASK_COMPLETED,
  EVENT_CREATED,
  EVENT_UPDATED,
  EVENT_DELETED,
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
} from '../utils/event-types';

export interface DashboardMetrics {
  taskCompletionCount: number;
  upcomingEventsCount: number;
  totalExpense: number;
  expenseChange: number;
  expenseChangeDirection: 'increase' | 'decrease' | 'same';
}

export interface UseDashboardMetricsReturn {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage dashboard metrics
 * Automatically refreshes when relevant events are published
 */
export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async (isInitial = false) => {
    try {
      // Only show loading on initial load
      if (isInitial) {
        setLoading(true);
      }
      setError(null);

      // Fetch all metrics in parallel
      const [todayTasksResponse, upcomingEventsResponse, totalSpendResponse] =
        await Promise.all([
          getTodayTasks(),
          getUpcomingEvents({ days: 7 }),
          getTotalSpend(),
        ]);

      // Calculate task completion count (completed tasks today)
      const completedTasks = todayTasksResponse.data.filter(
        (task) => task.is_completed
      );

      setMetrics({
        taskCompletionCount: completedTasks.length,
        upcomingEventsCount: upcomingEventsResponse.data.length,
        totalExpense: totalSpendResponse.data.current_month,
        expenseChange: totalSpendResponse.data.percentage_change,
        expenseChangeDirection: totalSpendResponse.data.change_direction,
      });
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err as Error);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  // Subscribe to task events for auto-refresh (without loading state)
  useEventBus(
    [TASK_CREATED, TASK_UPDATED, TASK_DELETED, TASK_COMPLETED],
    () => fetchMetrics(false)
  );

  // Subscribe to event events for auto-refresh (without loading state)
  useEventBus([EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED], () => fetchMetrics(false));

  // Subscribe to expense events for auto-refresh (without loading state)
  useEventBus(
    [EXPENSE_CREATED, EXPENSE_UPDATED, EXPENSE_DELETED],
    () => fetchMetrics(false)
  );

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  };
}
