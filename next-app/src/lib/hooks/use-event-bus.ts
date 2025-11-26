/**
 * React hook for subscribing to event bus events
 * Provides automatic cleanup on component unmount
 */

'use client';

import { useEffect, useCallback } from 'react';
import { eventBus } from '@/lib/utils/event-bus';
import type { EventType } from '@/lib/utils/event-types';

/**
 * Hook to subscribe to event bus events
 * @param eventType - Single event type or array of event types to subscribe to
 * @param callback - Callback function to execute when event is published
 *
 * @example
 * // Subscribe to single event
 * useEventBus(TASK_CREATED, (task) => {
 *   console.log('Task created:', task);
 * });
 *
 * @example
 * // Subscribe to multiple events
 * useEventBus([TASK_CREATED, TASK_UPDATED], (task) => {
 *   console.log('Task changed:', task);
 * });
 */
export function useEventBus(
  eventType: EventType | EventType[] | string | string[],
  callback: (data: unknown) => void
): void {
  // Wrap callback in useCallback to prevent unnecessary re-subscriptions
  const memoizedCallback = useCallback(
    (data: unknown) => callback(data),
    [callback]
  );

  useEffect(() => {
    // Convert to array for uniform handling
    const events = Array.isArray(eventType) ? eventType : [eventType];

    // Subscribe to all events
    const unsubscribers = events.map((event) =>
      eventBus.subscribe(event, memoizedCallback)
    );

    // Cleanup: unsubscribe from all events on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [eventType, memoizedCallback]);
}

/**
 * Hook to publish events to the event bus
 * Returns a memoized publish function
 *
 * @example
 * const publishTaskCreated = useEventBusPublish();
 * publishTaskCreated(TASK_CREATED, newTask);
 */
export function useEventBusPublish() {
  return useCallback(
    (eventType: EventType | string, data?: unknown) => {
      eventBus.publish(eventType, data);
    },
    []
  );
}

/**
 * Hook to get event bus history (for debugging)
 * @returns Array of event history entries
 */
export function useEventBusHistory() {
  return eventBus.getHistory();
}

/**
 * Hook to get active subscriptions (for debugging)
 * @returns Map of event types to subscriber counts
 */
export function useEventBusSubscriptions() {
  return eventBus.getSubscriptions();
}
