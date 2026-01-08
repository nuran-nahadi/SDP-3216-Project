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
import { AIChatPanel } from '@/components/shared/ai-chat-panel';
import { AIFloatingButton } from '@/components/shared/ai-floating-button';
import { parseText, parseVoice } from '@/lib/api/events';
import { isoToDatetimeLocal } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';

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
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

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
    setAiSuggestion(null);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEventAction(eventId);
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return eventsByDate[dateKey] || [];
  };

  const handleAIMessage = async (message: string) => {
    try {
      const response = await parseText(message);
      const parsed = response.data;

      let content = 'I\'ve analyzed your event! Here\'s what I found:\n\n';
      
      if (parsed.title) content += `📝 Title: ${parsed.title}\n`;
      if (parsed.start_time) content += `🕐 Start: ${parsed.start_time}\n`;
      if (parsed.end_time) content += `🕕 End: ${parsed.end_time}\n`;
      if (parsed.location) content += `📍 Location: ${parsed.location}\n`;
      if (parsed.is_all_day) content += `📅 All Day Event\n`;
      if (parsed.tags && parsed.tags.length > 0) {
        content += `🏷️ Tags: ${parsed.tags.join(', ')}\n`;
      }

      content += '\nWould you like to create this event?';

      return {
        content,
        data: {
          title: parsed.title || '',
          description: parsed.description || '',
          start_time: parsed.start_time ? isoToDatetimeLocal(parsed.start_time) : '',
          end_time: parsed.end_time ? isoToDatetimeLocal(parsed.end_time) : '',
          location: parsed.location || '',
          is_all_day: parsed.is_all_day || false,
          tags: parsed.tags || [],
        },
      };
    } catch (error) {
      return {
        content: 'I had trouble understanding that. Could you describe the event differently?',
      };
    }
  };

  const handleAIVoice = async (audioFile: File) => {
    try {
      const response = await parseVoice(audioFile);
      
      // Check if the response indicates failure
      if (!response.success) {
        const transcribedText = (response as any).transcribed_text;
        let errorContent = response.message || 'I had trouble understanding that.';
        if (transcribedText) {
          errorContent = `📝 I heard: "${transcribedText}"\n\n${errorContent}\n\nPlease try describing the event with more details like date and time.`;
        }
        return {
          content: errorContent,
          transcribedText,
        };
      }

      const parsed = response.data;

      let content = 'I\'ve analyzed your voice input! Here\'s what I found:\n\n';
      
      if (parsed.title) content += `📝 Title: ${parsed.title}\n`;
      if (parsed.start_time) content += `🕐 Start: ${parsed.start_time}\n`;
      if (parsed.end_time) content += `🕕 End: ${parsed.end_time}\n`;
      if (parsed.location) content += `📍 Location: ${parsed.location}\n`;
      if (parsed.is_all_day) content += `📅 All Day Event\n`;
      if (parsed.tags && parsed.tags.length > 0) {
        content += `🏷️ Tags: ${parsed.tags.join(', ')}\n`;
      }

      content += '\nWould you like to create this event?';

      return {
        content,
        transcribedText: parsed.transcribed_text,
        data: {
          title: parsed.title || '',
          description: parsed.description || '',
          start_time: parsed.start_time ? isoToDatetimeLocal(parsed.start_time) : '',
          end_time: parsed.end_time ? isoToDatetimeLocal(parsed.end_time) : '',
          location: parsed.location || '',
          is_all_day: parsed.is_all_day || false,
          tags: parsed.tags || [],
        },
      };
    } catch (error) {
      console.error('Voice parsing error:', error);
      return {
        content: 'I had trouble understanding your voice message. Please try again or speak more clearly.',
      };
    }
  };

  const handleAcceptSuggestion = (data: any) => {
    setAiSuggestion(data);
    setIsEventFormOpen(true);
    setShowAIChat(false);
  };

  if (loading && !calendarGrid.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className={cn(
        'flex-1 transition-all duration-300',
        showAIChat ? 'mr-96' : 'mr-0'
      )}>
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
            onClose={() => {
              setIsEventFormOpen(false);
              setAiSuggestion(null);
            }}
            onSubmit={handleEventFormSubmit}
            initialDate={selectedDate || undefined}
            initialData={aiSuggestion}
          />
        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        title="Event AI Assistant"
        placeholder="Describe your event..."
        onSendMessage={handleAIMessage}
        onSendVoice={handleAIVoice}
        onAcceptSuggestion={handleAcceptSuggestion}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        supportsVoice={true}
        supportsImage={false}
      />

      {/* Floating AI Button */}
      <AIFloatingButton onClick={() => setShowAIChat(true)} isOpen={showAIChat} />
    </div>
  );
}
