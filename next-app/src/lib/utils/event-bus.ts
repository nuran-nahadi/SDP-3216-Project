/**
 * Event Bus implementation for Observer pattern
 * Provides centralized publish-subscribe mechanism for cross-component communication
 */

type EventCallback = (data: unknown) => void;

interface EventHistoryEntry {
  type: string;
  data: unknown;
  timestamp: number;
}

class EventBus {
  private subscribers: Map<string, Set<EventCallback>>;
  private eventHistory: EventHistoryEntry[];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 100) {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribe to an event type
   * @param eventType - The event type to subscribe to
   * @param callback - The callback function to execute when event is published
   * @returns Unsubscribe function
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
      // Clean up empty sets
      if (this.subscribers.get(eventType)?.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  /**
   * Publish an event to all subscribers
   * @param eventType - The event type to publish
   * @param data - Optional data to pass to subscribers
   */
  publish(eventType: string, data?: unknown): void {
    // Log event for debugging
    this.eventHistory.push({
      type: eventType,
      data,
      timestamp: Date.now(),
    });

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify all subscribers
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get event history for debugging
   * @returns Array of event history entries
   */
  getHistory(): EventHistoryEntry[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get all active subscriptions (for debugging)
   * @returns Map of event types to subscriber counts
   */
  getSubscriptions(): Map<string, number> {
    const subscriptions = new Map<string, number>();
    this.subscribers.forEach((callbacks, eventType) => {
      subscriptions.set(eventType, callbacks.size);
    });
    return subscriptions;
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clearAllSubscriptions(): void {
    this.subscribers.clear();
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Export class for testing purposes
export { EventBus };
