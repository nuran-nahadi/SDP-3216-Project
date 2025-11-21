'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Plus, Trash2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils/cn';
import { Event } from '@/lib/types/event';
import { EmptyState } from '@/components/shared/empty-state';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: Event[];
  onCreateEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
}

export function EventModal({
  isOpen,
  onClose,
  date,
  events,
  onCreateEvent,
  onDeleteEvent,
}: EventModalProps) {
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  if (!date) return null;

  const formattedDate = format(date, 'EEEE, MMMM d, yyyy');

  const handleDeleteClick = (eventId: string) => {
    setDeleteEventId(eventId);
  };

  const handleConfirmDelete = () => {
    if (deleteEventId) {
      onDeleteEvent(deleteEventId);
      setDeleteEventId(null);
    }
  };

  const getPriorityColor = (color: string | null): string => {
    if (!color) return 'bg-primary';
    
    // Map common color names to Tailwind classes
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      primary: 'bg-primary',
    };

    return colorMap[color.toLowerCase()] || 'bg-primary';
  };

  const formatEventTime = (event: Event): string => {
    if (event.is_all_day) {
      return 'All day';
    }

    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{formattedDate}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={onCreateEvent}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Event</span>
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(80vh-120px)] pr-4">
            {events.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No events"
                description="No events scheduled for this day"
                action={{
                  label: 'Create Event',
                  onClick: onCreateEvent,
                }}
              />
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="group relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Color indicator */}
                    <div
                      className={cn(
                        'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
                        getPriorityColor(event.color)
                      )}
                    />

                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {event.title}
                          </h3>

                          {/* Time */}
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 flex-shrink-0" />
                            <span>{formatEventTime(event)}</span>
                          </div>

                          {/* Location */}
                          {event.location && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}

                          {/* Description */}
                          {event.description && (
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          {/* Tags */}
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {event.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(event.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          aria-label="Delete event"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteEventId !== null}
        onOpenChange={(open) => !open && setDeleteEventId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
