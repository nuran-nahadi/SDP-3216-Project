'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getWeekEvents } from '@/lib/api/events';
import { Event } from '@/lib/types';
import { useEventBus } from '@/lib/hooks/use-event-bus';
import {
  EVENT_CREATED,
  EVENT_UPDATED,
  EVENT_DELETED,
} from '@/lib/utils/event-types';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Calendar } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export function WeeklyCalendarGrid() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWeekEvents();
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching week events:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Subscribe to event events for auto-refresh
  useEventBus([EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED], fetchEvents);

  const getWeekDays = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, day);
    });
  };

  const weekDays = getWeekDays();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>This Week&apos;s Events</CardTitle>
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
          <CardTitle>This Week&apos;s Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Failed to load events. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          This Week&apos;s Events
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {events.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events this week"
            description="Your calendar is clear for this week."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    isToday
                      ? 'bg-primary/10 border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-card border-border hover:shadow-sm hover:border-primary/30'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {format(day, 'EEE')}
                    </div>
                    <div
                      className={`text-2xl font-bold mt-1 ${
                        isToday ? 'text-primary' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {dayEvents.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-3 italic">
                        No events
                      </div>
                    ) : (
                      dayEvents.slice(0, 3).map((event) => {
                        const eventTime = parseISO(event.start_time);
                        const priority = event.color || 'low';
                        
                        return (
                          <div
                            key={event.id}
                            className="text-xs p-2 rounded-lg bg-accent/50 hover:bg-accent transition-all duration-200 hover:shadow-sm cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  priorityColors[priority] || priorityColors.low
                                }`}
                              />
                              <span className="font-semibold truncate">
                                {event.title}
                              </span>
                            </div>
                            {!event.is_all_day && (
                              <div className="text-muted-foreground text-[10px] ml-3.5">
                                {format(eventTime, 'h:mm a')}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-primary font-medium text-center pt-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
