/**
 * Error handling utilities
 */

import type { ApiError } from '@/lib/types/api';
import { AxiosError } from 'axios';

/**
 * Format API error message for display
 */
export function handleApiError(error: unknown): string {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    if (error.response) {
      // Server responded with error
      const apiError = error.response.data as ApiError;
      return apiError.error?.message || 'An error occurred';
    } else if (error.request) {
      // Request made but no response
      return 'Network error. Please check your connection.';
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback
  return 'An unexpected error occurred';
}

/**
 * Format validation errors from API
 */
export function formatValidationErrors(
  details?: Record<string, unknown>
): Record<string, string> {
  if (!details) return {};

  const errors: Record<string, string> = {};

  Object.entries(details).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      errors[field] = messages.join(', ');
    } else if (typeof messages === 'string') {
      errors[field] = messages;
    }
  });

  return errors;
}

/**
 * Check if error is authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && !!error.request;
  }
  return false;
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 422;
  }
  return false;
}

/**
 * Get error status code
 */
export function getErrorStatusCode(error: unknown): number | null {
  if (error instanceof AxiosError) {
    return error.response?.status || null;
  }
  return null;
}

/**
 * Create user-friendly error message based on status code
 */
export function getErrorMessageByStatus(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'You are not authenticated. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'This resource already exists.',
    422: 'Validation error. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
  };

  return messages[statusCode] || 'An unexpected error occurred.';
}

/**
 * Log error for debugging (can be extended to send to error tracking service)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }

  // In production, you might want to send to error tracking service
  // e.g., Sentry.captureException(error);
}
