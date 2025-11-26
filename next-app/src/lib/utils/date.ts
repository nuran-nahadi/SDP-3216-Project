/**
 * Date utility functions using date-fns
 */

import {
  format,
  formatDistance,
  formatRelative,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  differenceInDays,
} from 'date-fns';

/**
 * Format date to display format (e.g., "Jan 15, 2024")
 */
export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format date and time (e.g., "Jan 15, 2024 at 3:30 PM")
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM d, yyyy \'at\' h:mm a');
}

/**
 * Format time only (e.g., "3:30 PM")
 */
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'h:mm a');
}

/**
 * Format date relative to now (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format date relative with context (e.g., "today at 3:30 PM", "yesterday at 2:00 PM")
 */
export function formatRelativeWithContext(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(dateObj, new Date());
}

/**
 * Get friendly date label (e.g., "Today", "Tomorrow", "Yesterday", or formatted date)
 */
export function getFriendlyDateLabel(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) return 'Today';
  if (isTomorrow(dateObj)) return 'Tomorrow';
  if (isYesterday(dateObj)) return 'Yesterday';
  
  return formatDate(dateObj);
}

/**
 * Check if date is today
 */
export function checkIsToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
}

/**
 * Check if date is in the past
 */
export function checkIsPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isPast(dateObj);
}

/**
 * Check if date is in the future
 */
export function checkIsFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isFuture(dateObj);
}

/**
 * Get start of day
 */
export function getStartOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

/**
 * Get end of day
 */
export function getEndOfDay(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

/**
 * Get start of week
 */
export function getStartOfWeek(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(dateObj);
}

/**
 * Get end of week
 */
export function getEndOfWeek(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfWeek(dateObj);
}

/**
 * Get start of month
 */
export function getStartOfMonth(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfMonth(dateObj);
}

/**
 * Get end of month
 */
export function getEndOfMonth(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfMonth(dateObj);
}

/**
 * Add days to date
 */
export function addDaysToDate(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
}

/**
 * Subtract days from date
 */
export function subtractDaysFromDate(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return subDays(dateObj, days);
}

/**
 * Get difference in days between two dates
 */
export function getDaysDifference(date1: string | Date, date2: string | Date): number {
  const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(dateObj1, dateObj2);
}

/**
 * Format date for API (ISO string)
 */
export function formatForAPI(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO date string
 */
export function parseISODate(dateString: string): Date {
  return parseISO(dateString);
}
