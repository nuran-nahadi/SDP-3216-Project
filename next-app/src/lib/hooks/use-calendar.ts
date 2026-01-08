import { useState, useEffect, useCallback } from 'react';
import { getCalendarView, CalendarViewData } from '@/lib/api/events';
import { Event } from '@/lib/types/event';
import { useEventBus } from './use-event-bus';
import { EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED } from '@/lib/utils/event-types';

interface UseCalendarReturn {
  year: number;
  month: number;
  monthName: string;
  calendarGrid: (number | null)[][];
  events: Event[];
  eventsByDate: Record<string, Event[]>;
  loading: boolean;
  error: Error | null;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  goToMonth: (year: number, month: number) => void;
  goToToday: () => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for calendar functionality
 * Fetches events for selected month and handles month navigation
 * Subscribes to event changes for auto-refresh
 */
export function useCalendar(): UseCalendarReturn {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState<CalendarViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCalendarData = useCallback(async (isInitial = false) => {
    try {
      // Only show loading on initial load or month change
      if (isInitial) {
        setLoading(true);
      }
      setError(null);
      const response = await getCalendarView(year, month);
      setCalendarData(response.data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching calendar data:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [year, month]);

  // Initial fetch and refetch when year/month changes
  useEffect(() => {
    fetchCalendarData(true);
  }, [fetchCalendarData]);

  // Subscribe to event changes for auto-refresh (without loading state)
  useEventBus(
    [EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED],
    useCallback(() => {
      fetchCalendarData(false);
    }, [fetchCalendarData])
  );

  const goToNextMonth = useCallback(() => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }, [year, month]);

  const goToPreviousMonth = useCallback(() => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }, [year, month]);

  const goToMonth = useCallback((newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }, []);

  return {
    year,
    month,
    monthName: calendarData?.month_name || '',
    calendarGrid: calendarData?.calendar_grid || [],
    events: calendarData?.events || [],
    eventsByDate: calendarData?.events_by_date || {},
    loading,
    error,
    goToNextMonth,
    goToPreviousMonth,
    goToMonth,
    goToToday,
    refetch: fetchCalendarData,
  };
}
