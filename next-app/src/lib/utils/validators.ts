/**
 * Validation utility functions and Zod schemas
 */

import { z } from 'zod';
import { TaskPriority } from '@/lib/types/task';
import { ExpenseCategory, PaymentMethod } from '@/lib/types/expense';

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password strength validation
 */
export function isStrongPassword(password: string): boolean {
  // At least 4 characters
  return password.length >= 4;
}

/**
 * URL validation
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Phone number validation (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Zod Schemas

/**
 * Login form schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Signup form schema
 */
export const signupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters'),
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
});

/**
 * Task form schema
 */
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  due_date: z.string().optional(),
  priority: z.nativeEnum(TaskPriority),
  estimated_duration: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  parent_task_id: z.string().optional(),
});

/**
 * Expense form schema
 */
export const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  category: z.nativeEnum(ExpenseCategory),
  subcategory: z.string().max(100).optional(),
  merchant: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  date: z.string(),
  payment_method: z.nativeEnum(PaymentMethod).optional(),
  tags: z.array(z.string()).optional(),
  is_recurring: z.boolean().optional(),
  recurrence_rule: z.string().optional(),
});

/**
 * Event form schema
 */
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  start_time: z.string(),
  end_time: z.string(),
  location: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  is_all_day: z.boolean().optional(),
  reminder_minutes: z.number().min(0).optional(),
  recurrence_rule: z.string().optional(),
  color: z.string().optional(),
}).refine(
  (data) => {
    // Ensure end_time is after start_time
    return new Date(data.end_time) > new Date(data.start_time);
  },
  {
    message: 'End time must be after start time',
    path: ['end_time'],
  }
);

/**
 * Profile form schema
 */
export const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  timezone: z.string(),
});

/**
 * Type exports for form data
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
