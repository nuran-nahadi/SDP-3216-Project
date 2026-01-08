/**
 * User type definitions
 */

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  profile_picture_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginCredentials {
  username: string; // Can be username or email
  password: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  username?: string;
  timezone?: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_task_priority: 'low' | 'medium' | 'high';
  default_expense_currency: string;
  notification_settings: {
    email: boolean;
    push: boolean;
    in_app: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  language: string;
  date_format: string;
  time_format: '12h' | '24h';
  week_start_day: 'monday' | 'sunday';
  ai_insights_enabled: boolean;
  created_at: string;
  updated_at: string;
}
