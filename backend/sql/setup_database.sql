-- Database Setup Script for SDP-3216-Project
-- This script creates all necessary tables and types for the application

-- Set search path to public schema
SET search_path TO public;

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_roles CASCADE;
DROP TYPE IF EXISTS task_priorities CASCADE;
DROP TYPE IF EXISTS task_statuses CASCADE;
DROP TYPE IF EXISTS expense_categories CASCADE;
DROP TYPE IF EXISTS payment_methods CASCADE;
DROP TYPE IF EXISTS themes CASCADE;
DROP TYPE IF EXISTS time_formats CASCADE;
DROP TYPE IF EXISTS week_start_days CASCADE;
DROP TYPE IF EXISTS journal_moods CASCADE;

-- Create ENUM types
CREATE TYPE user_roles AS ENUM ('admin', 'user');
CREATE TYPE task_priorities AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_statuses AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE expense_categories AS ENUM ('food', 'transport', 'entertainment', 'bills', 'shopping', 'health', 'education', 'travel', 'other');
CREATE TYPE payment_methods AS ENUM ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other');
CREATE TYPE themes AS ENUM ('light', 'dark', 'auto');
CREATE TYPE time_formats AS ENUM ('12h', '24h');
CREATE TYPE week_start_days AS ENUM ('monday', 'sunday');
CREATE TYPE journal_moods AS ENUM ('very_happy', 'happy', 'neutral', 'sad', 'very_sad', 'angry', 'excited', 'anxious', 'grateful');

-- Create users table (must be first due to foreign key dependencies)
CREATE TABLE users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  hashed_password text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  profile_picture_url text,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  role user_roles NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  default_task_priority task_priorities NOT NULL DEFAULT 'medium',
  default_expense_currency text NOT NULL DEFAULT 'USD',
  notification_settings jsonb,
  theme themes NOT NULL DEFAULT 'auto',
  language text NOT NULL DEFAULT 'en',
  date_format text NOT NULL DEFAULT 'YYYY-MM-DD',
  time_format time_formats NOT NULL DEFAULT '12h',
  week_start_day week_start_days NOT NULL DEFAULT 'monday',
  ai_insights_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create events table
CREATE TABLE events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  tags jsonb,
  is_all_day boolean NOT NULL DEFAULT false,
  reminder_minutes integer CHECK (reminder_minutes IS NULL OR reminder_minutes >= 0),
  recurrence_rule text,
  color text CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create expenses table
CREATE TABLE expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount double precision NOT NULL,
  currency text NOT NULL DEFAULT 'Taka',
  category expense_categories NOT NULL,
  subcategory text,
  merchant text,
  description text,
  date timestamp with time zone NOT NULL,
  payment_method payment_methods,
  receipt_url text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  tags jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  priority task_priorities NOT NULL DEFAULT 'medium',
  status task_statuses NOT NULL DEFAULT 'pending',
  is_completed boolean NOT NULL DEFAULT false,
  completion_date timestamp with time zone,
  estimated_duration integer CHECK (estimated_duration IS NULL OR estimated_duration > 0),
  actual_duration integer CHECK (actual_duration IS NULL OR actual_duration > 0),
  tags jsonb,
  parent_task_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create journal_entries table
CREATE TABLE journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  mood journal_moods,
  sentiment_score double precision,
  keywords text,
  summary text,
  weather text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert a default development user (password: "password123")
INSERT INTO users (
  id,
  username,
  email,
  first_name,
  last_name,
  hashed_password,
  is_verified,
  role,
  is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'devuser',
  'dev@example.com',
  'Dev',
  'User',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqVr/qvQqK',
  true,
  'user',
  true
);

-- Create default preferences for the dev user
INSERT INTO user_preferences (
  user_id,
  default_task_priority,
  default_expense_currency,
  theme,
  language,
  ai_insights_enabled
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'medium',
  'Taka',
  'auto',
  'en',
  true
);

-- Success message
SELECT 'Database setup completed successfully!' AS status;
