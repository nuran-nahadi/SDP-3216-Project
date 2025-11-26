import { useState } from 'react';
import { toast } from 'sonner';
import { createEvent, updateEvent, deleteEvent } from '@/lib/api/events';
import { EventFormData } from '@/lib/types/event';
import { eventBus } from '@/lib/utils/event-bus';
import {
  EVENT_CREATED,
  EVENT_UPDATED,
  EVENT_DELETED,
} from '@/lib/utils/event-types';
import { handleApiError } from '@/lib/utils/error-handler';

interface UseEventActionsReturn {
  createEventAction: (data: EventFormData) => Promise<void>;
  updateEventAction: (id: string, data: Partial<EventFormData>) => Promise<void>;
  deleteEventAction: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Custom hook for event CRUD actions
 * Handles API calls, error handling, and event bus notifications
 */
export function useEventActions(): UseEventActionsReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const createEventAction = async (data: EventFormData) => {
    try {
      setIsCreating(true);
      const response = await createEvent(data);
      
      // Publish event for Observer pattern
      eventBus.publish(EVENT_CREATED, response.data);
      
      toast.success('Event created successfully');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const updateEventAction = async (
    id: string,
    data: Partial<EventFormData>
  ) => {
    try {
      setIsUpdating(true);
      const response = await updateEvent(id, data);
      
      // Publish event for Observer pattern
      eventBus.publish(EVENT_UPDATED, response.data);
      
      toast.success('Event updated successfully');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteEventAction = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteEvent(id);
      
      // Publish event for Observer pattern
      eventBus.publish(EVENT_DELETED, { id });
      
      toast.success('Event deleted successfully');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createEventAction,
    updateEventAction,
    deleteEventAction,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
