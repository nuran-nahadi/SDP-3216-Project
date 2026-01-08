/**
 * Event type definitions
 */

export interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  tags: string[];
  is_all_day: boolean;
  reminder_minutes: number | null;
  recurrence_rule: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  tags?: string[];
  is_all_day?: boolean;
  reminder_minutes?: number;
  recurrence_rule?: string;
  color?: string;
}

export interface EventFilters {
  start_date?: string;
  end_date?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}
