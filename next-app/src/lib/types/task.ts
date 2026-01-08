/**
 * Task type definitions
 */

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_completed: boolean;
  completion_date: string | null;
  estimated_duration: number | null;
  actual_duration: number | null;
  tags: string[];
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  due_date?: string;
  priority: TaskPriority;
  estimated_duration?: number;
  tags?: string[];
  parent_task_id?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
}
