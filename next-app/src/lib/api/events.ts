import apiClient from './client';
import { ApiResponse } from '../types';
import { Event, EventFormData, EventFilters } from '../types/event';

/**
 * Events API service
 * Handles event CRUD operations, calendar views, and natural language parsing
 */

// ============================================================================
// Basic CRUD Operations
// ============================================================================

/**
 * Get list of events with optional filters
 * @param filters - Optional filters for events
 * @returns Paginated list of events
 */
export async function getEvents(
  filters?: EventFilters
): Promise<ApiResponse<Event[]>> {
  const response = await apiClient.get<ApiResponse<Event[]>>('/events/', {
    params: filters,
  });
  return response.data;
}

/**
 * Get a specific event by ID
 * @param id - Event ID
 * @returns Event object
 */
export async function getEvent(id: string): Promise<ApiResponse<Event>> {
  const response = await apiClient.get<ApiResponse<Event>>(`/events/${id}`);
  return response.data;
}

/**
 * Create a new event
 * @param data - Event data
 * @returns Created event object
 */
export async function createEvent(
  data: EventFormData
): Promise<ApiResponse<Event>> {
  const response = await apiClient.post<ApiResponse<Event>>('/events/', data);
  return response.data;
}

/**
 * Update an existing event
 * @param id - Event ID
 * @param data - Updated event data
 * @returns Updated event object
 */
export async function updateEvent(
  id: string,
  data: Partial<EventFormData>
): Promise<ApiResponse<Event>> {
  const response = await apiClient.put<ApiResponse<Event>>(
    `/events/${id}`,
    data
  );
  return response.data;
}

/**
 * Delete an event
 * @param id - Event ID
 * @returns Success response
 */
export async function deleteEvent(id: string): Promise<ApiResponse<void>> {
  const response = await apiClient.delete<ApiResponse<void>>(`/events/${id}`);
  return response.data;
}

// ============================================================================
// Calendar and View Functions
// ============================================================================

export interface CalendarViewData {
  year: number;
  month: number;
  month_name: string;
  calendar_grid: (number | null)[][];
  events: Event[];
  events_by_date: Record<string, Event[]>;
}

/**
 * Get calendar view for a specific month
 * @param year - Year (1900-3000)
 * @param month - Month (1-12)
 * @returns Calendar grid with events organized by date
 */
export async function getCalendarView(
  year: number,
  month: number
): Promise<ApiResponse<CalendarViewData>> {
  const response = await apiClient.get<ApiResponse<CalendarViewData>>(
    `/events/calendar/${year}/${month}`
  );
  return response.data;
}

export interface UpcomingEventsParams {
  days?: number;
}

/**
 * Get upcoming events for the next N days
 * @param params - Optional days parameter (default: 7, min: 1, max: 30)
 * @returns List of upcoming events
 */
export async function getUpcomingEvents(
  params?: UpcomingEventsParams
): Promise<ApiResponse<Event[]>> {
  const response = await apiClient.get<ApiResponse<Event[]>>(
    '/events/upcoming',
    { params }
  );
  return response.data;
}

// ============================================================================
// Natural Language Parsing
// ============================================================================

export interface ParsedEventData {
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  tags: string[];
  is_all_day: boolean;
  confidence_score: number;
}

export interface ParseEventRequest {
  text: string;
}

/**
 * Parse natural language text into event data
 * @param text - Natural language description of event
 * @returns Parsed event data with confidence score
 */
export async function parseEventText(
  text: string
): Promise<ApiResponse<ParsedEventData>> {
  const response = await apiClient.post<ApiResponse<ParsedEventData>>(
    '/events/parse',
    { text }
  );
  return response.data;
}

// ============================================================================
// Additional Utility Functions
// ============================================================================

/**
 * Get events for a specific date
 * @param date - Date in ISO 8601 format (YYYY-MM-DD)
 * @returns List of events for the specified date
 */
export async function getEventsByDate(
  date: string
): Promise<ApiResponse<Event[]>> {
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;
  
  return getEvents({
    start_date: startOfDay,
    end_date: endOfDay,
  });
}

/**
 * Get events for a specific date range
 * @param startDate - Start date in ISO 8601 format
 * @param endDate - End date in ISO 8601 format
 * @returns List of events in the date range
 */
export async function getEventsByDateRange(
  startDate: string,
  endDate: string
): Promise<ApiResponse<Event[]>> {
  return getEvents({
    start_date: startDate,
    end_date: endDate,
  });
}

/**
 * Get events for the current week
 * @returns List of events for the current week
 */
export async function getWeekEvents(): Promise<ApiResponse<Event[]>> {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return getEvents({
    start_date: startOfWeek.toISOString(),
    end_date: endOfWeek.toISOString(),
  });
}

/**
 * Get events for today
 * @returns List of events for today
 */
export async function getTodayEvents(): Promise<ApiResponse<Event[]>> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  return getEvents({
    start_date: startOfDay.toISOString(),
    end_date: endOfDay.toISOString(),
  });
}

/**
 * Search events by query string
 * @param query - Search query
 * @returns List of matching events
 */
export async function searchEvents(
  query: string
): Promise<ApiResponse<Event[]>> {
  return getEvents({
    search: query,
  });
}

/**
 * Get events by tags
 * @param tags - Array of tags to filter by
 * @returns List of events matching the tags
 */
export async function getEventsByTags(
  tags: string[]
): Promise<ApiResponse<Event[]>> {
  return getEvents({
    tags,
  });
}
