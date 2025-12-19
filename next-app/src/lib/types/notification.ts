/**
 * Notification type definitions
 */

export interface NotificationSettings {
  email_enabled: boolean;
  preferred_time: string; // HH:MM format
}

export interface DailySummary {
  tasks_pending: number;
  tasks_due_today: number;
  tasks_overdue: number;
  tasks_completed_today: number;
  events_today: number;
  events_upcoming: Array<{
    title: string;
    start_time: string | null;
  }>;
  expenses_today: number;
  expenses_this_week: number;
  top_expense_category: string | null;
  journal_last_entry_days: number | null;
  tasks_due_next_week: number;
  events_next_week: number;
  events_next_week_list: Array<{
    title: string;
    start_time: string | null;
  }>;
}
