'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { CalendarGrid } from '@/components/features/calendar/calendar-grid';
import { EventModal } from '@/components/features/calendar/event-modal';
import { EventForm } from '@/components/features/calendar/event-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCalendar } from '@/lib/hooks/use-calendar';
import { useEventActions } from '@/lib/hooks/use-event-actions';
import { EventFormData } from '@/lib/utils/validators';

export default function CalendarPage() {
  const {
    year,
    month,
    monthName,
    calendarGrid,
    events,
    eventsByDate,
    loading,
    error,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
  } = useCalendar();

  const { createEventAction, deleteEventAction } = useEventActions();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsEventModalOpen(true);
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    // This is handled by the CalendarGrid component
    // The useCalendar hook manages the state
  };

  const handleCreateEvent = () => {
    setIsEventModalOpen(false);
    setIsEventFormOpen(true);
  };

  const handleEventFormSubmit = async (data: EventFormData) => {
    await createEventAction(data);
    setIsEventFormOpen(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEventAction(eventId);
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return eventsByDate[dateKey] || [];
  };

  if (loading && !calendarGrid.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your events and schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button onClick={handleCreateEvent}>Create Event</Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Failed to load calendar data. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Grid */}
      <CalendarGrid
        year={year}
        month={month}
        events={events}
        eventsByDate={eventsByDate}
        onDateSelect={handleDateSelect}
        onMonthChange={(newYear, newMonth) => {
          if (newYear !== year || newMonth !== month) {
            if (newMonth === 12 && month === 1) {
              goToPreviousMonth();
            } else if (newMonth === 1 && month === 12) {
              goToNextMonth();
            } else if (newMonth > month) {
              goToNextMonth();
            } else {
              goToPreviousMonth();
            }
          }
        }}
      />

      {/* Event Modal - Shows events for selected date */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        date={selectedDate}
        events={getEventsForSelectedDate()}
        onCreateEvent={handleCreateEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      {/* Event Form - Create new event */}
      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        onSubmit={handleEventFormSubmit}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
}
