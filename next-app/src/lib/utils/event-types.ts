/**
 * Event type constants for Observer pattern
 * Centralized event types to prevent typos and improve discoverability
 */

// Task Events
export const TASK_CREATED = 'task:created';
export const TASK_UPDATED = 'task:updated';
export const TASK_DELETED = 'task:deleted';
export const TASK_COMPLETED = 'task:completed';

// Expense Events
export const EXPENSE_CREATED = 'expense:created';
export const EXPENSE_UPDATED = 'expense:updated';
export const EXPENSE_DELETED = 'expense:deleted';

// Event Events (Calendar)
export const EVENT_CREATED = 'event:created';
export const EVENT_UPDATED = 'event:updated';
export const EVENT_DELETED = 'event:deleted';

// Profile Events
export const PROFILE_UPDATED = 'profile:updated';
export const AVATAR_UPDATED = 'avatar:updated';

// System Events
export const AUTH_STATE_CHANGED = 'auth:state_changed';
export const THEME_CHANGED = 'theme:changed';

// Journal Events (for future use)
export const JOURNAL_CREATED = 'journal:created';
export const JOURNAL_UPDATED = 'journal:updated';
export const JOURNAL_DELETED = 'journal:deleted';

/**
 * Event type groups for convenience
 */
export const TASK_EVENTS = [
  TASK_CREATED,
  TASK_UPDATED,
  TASK_DELETED,
  TASK_COMPLETED,
] as const;

export const EXPENSE_EVENTS = [
  EXPENSE_CREATED,
  EXPENSE_UPDATED,
  EXPENSE_DELETED,
] as const;

export const EVENT_EVENTS = [
  EVENT_CREATED,
  EVENT_UPDATED,
  EVENT_DELETED,
] as const;

export const PROFILE_EVENTS = [PROFILE_UPDATED, AVATAR_UPDATED] as const;

export const SYSTEM_EVENTS = [AUTH_STATE_CHANGED, THEME_CHANGED] as const;

/**
 * Type for all event types
 */
export type EventType =
  | typeof TASK_CREATED
  | typeof TASK_UPDATED
  | typeof TASK_DELETED
  | typeof TASK_COMPLETED
  | typeof EXPENSE_CREATED
  | typeof EXPENSE_UPDATED
  | typeof EXPENSE_DELETED
  | typeof EVENT_CREATED
  | typeof EVENT_UPDATED
  | typeof EVENT_DELETED
  | typeof PROFILE_UPDATED
  | typeof AVATAR_UPDATED
  | typeof AUTH_STATE_CHANGED
  | typeof THEME_CHANGED
  | typeof JOURNAL_CREATED
  | typeof JOURNAL_UPDATED
  | typeof JOURNAL_DELETED;
