'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { Event } from '@/lib/types/event';

interface CalendarGridProps {
  year: number;
  month: number;
  events: Event[];
  eventsByDate: Record<string, Event[]>;
  onDateSelect: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function CalendarGrid({
  year,
  month,
  events,
  eventsByDate,
  onDateSelect,
  onMonthChange,
}: CalendarGridProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const grid: (number | null)[][] = [];
    let week: (number | null)[] = [];

    // Fill in empty cells before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    // Fill in the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }

    // Fill in empty cells after the last day
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      grid.push(week);
    }

    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  const handlePreviousMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month - 1, day);
    onDateSelect(date);
  };

  const getEventsForDate = (day: number): Event[] => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventsByDate[dateKey] || [];
  };

  const isToday = (day: number): boolean => {
    return (
      year === currentYear && month === currentMonth && day === currentDay
    );
  };

  const hasEvents = (day: number): boolean => {
    return getEventsForDate(day).length > 0;
  };

  return (
    <Card className="p-4 md:p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {calendarGrid.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${weekIndex}-${dayIndex}`}
                  className="aspect-square"
                />
              );
            }

            const dayEvents = getEventsForDate(day);
            const isTodayDate = isToday(day);
            const hasEventsOnDay = hasEvents(day);

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'min-h-20 md:min-h-24 p-1 md:p-2 rounded-lg border transition-colors',
                  'hover:bg-accent hover:border-primary',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'flex flex-col items-start',
                  isTodayDate &&
                    'bg-primary text-primary-foreground font-bold border-primary shadow-md ring-2 ring-primary/20',
                  !isTodayDate && 'border-border',
                  hasEventsOnDay && !isTodayDate && 'bg-accent/50'
                )}
                aria-label={`${MONTH_NAMES[month - 1]} ${day}, ${year}${hasEventsOnDay ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
              >
                <span className="text-sm md:text-base font-semibold mb-1">{day}</span>
                {hasEventsOnDay && (
                  <div className="flex-1 w-full space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          'text-[9px] md:text-[10px] px-1 py-0.5 rounded truncate font-medium',
                          isTodayDate
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                        )}
                        style={{
                          borderLeft: `2px solid ${event.color || '#8b5cf6'}`,
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        className={cn(
                          'text-[9px] md:text-[10px] px-1 font-medium',
                          isTodayDate
                            ? 'text-white/80'
                            : 'text-muted-foreground'
                        )}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Mobile-friendly legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-accent/50 border border-border" />
          <span>Has events</span>
        </div>
      </div>
    </Card>
  );
}
