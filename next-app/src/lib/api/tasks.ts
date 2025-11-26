import apiClient from './client';
import { ApiResponse, Task, TaskPriority, TaskStatus } from '../types';

/**
 * Tasks API service
 * Handles all task-related API operations
 */

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimated_duration?: number;
  tags?: string[];
  parent_task_id?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimated_duration?: number;
  tags?: string[];
  parent_task_id?: string;
}

export interface CompleteTaskData {
  actual_duration?: number;
}

/**
 * Get list of tasks with optional filters
 * @param filters - Optional filters for tasks
 * @returns Paginated list of tasks
 */
export async function getTasks(filters?: TaskFilters): Promise<ApiResponse<Task[]>> {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/', {
    params: filters,
  });
  return response.data;
}

/**
 * Get today's tasks (due today and not completed)
 * @returns List of today's tasks
 */
export async function getTodayTasks(): Promise<ApiResponse<Task[]>> {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/today');
  return response.data;
}

/**
 * Get overdue tasks (past due date and not completed)
 * @returns List of overdue tasks
 */
export async function getOverdueTasks(): Promise<ApiResponse<Task[]>> {
  const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/overdue');
  return response.data;
}

/**
 * Get a specific task by ID
 * @param taskId - Task ID
 * @returns Task object
 */
export async function getTask(taskId: string): Promise<ApiResponse<Task>> {
  const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${taskId}`);
  return response.data;
}

/**
 * Create a new task
 * @param data - Task creation data
 * @returns Created task object
 */
export async function createTask(data: CreateTaskData): Promise<ApiResponse<Task>> {
  const response = await apiClient.post<ApiResponse<Task>>('/tasks/', data);
  return response.data;
}

/**
 * Update an existing task
 * @param taskId - Task ID
 * @param data - Task update data
 * @returns Updated task object
 */
export async function updateTask(
  taskId: string,
  data: UpdateTaskData
): Promise<ApiResponse<Task>> {
  const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${taskId}`, data);
  return response.data;
}

/**
 * Delete a task
 * @param taskId - Task ID
 * @returns Success response
 */
export async function deleteTask(taskId: string): Promise<ApiResponse<void>> {
  const response = await apiClient.delete<ApiResponse<void>>(`/tasks/${taskId}`);
  return response.data;
}

/**
 * Mark a task as complete
 * @param taskId - Task ID
 * @param data - Optional actual duration
 * @returns Updated task object
 */
export async function completeTask(
  taskId: string,
  data?: CompleteTaskData
): Promise<ApiResponse<Task>> {
  const response = await apiClient.patch<ApiResponse<Task>>(
    `/tasks/${taskId}/complete`,
    data || {}
  );
  return response.data;
}

/**
 * Parse natural language text into task data
 * @param text - Natural language text
 * @returns Parsed task data
 */
export async function parseTaskText(text: string): Promise<ApiResponse<Partial<Task>>> {
  const response = await apiClient.post<ApiResponse<Partial<Task>>>('/tasks/parse', {
    text,
  });
  return response.data;
}

// ============================================================================
// AI Parsing Functions
// ============================================================================

export interface ParseTextResponse {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_duration: number | null;
  tags: string[];
  confidence: number;
}

/**
 * Parse natural language text into task data using AI
 * @param text - Natural language description of task
 * @returns Parsed task data with confidence score
 */
export async function parseText(
  text: string
): Promise<ApiResponse<ParseTextResponse>> {
  const response = await apiClient.post<ApiResponse<ParseTextResponse>>(
    '/tasks/ai/parse-text',
    { text }
  );
  return response.data;
}

/**
 * Parse voice recording into task data using AI
 * @param file - Audio file
 * @returns Parsed task data with confidence score and transcription
 */
export async function parseVoice(
  file: File
): Promise<ApiResponse<ParseTextResponse & { transcribed_text?: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<
    ApiResponse<ParseTextResponse & { transcribed_text?: string }>
  >('/tasks/ai/parse-voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
