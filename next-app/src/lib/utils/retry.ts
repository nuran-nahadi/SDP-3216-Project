/**
 * Retry utility for handling transient errors
 */

import { AxiosError } from 'axios';
import { isNetworkError } from './error-handler';

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoff: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableStatuses: number[]): boolean {
  // Network errors are always retryable
  if (isNetworkError(error)) {
    return true;
  }

  // Check if status code is retryable
  if (error instanceof AxiosError && error.response) {
    return retryableStatuses.includes(error.response.status);
  }

  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, baseDelay: number, useBackoff: boolean): number {
  if (!useBackoff) {
    return baseDelay;
  }
  // Exponential backoff: delay * 2^attempt
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries
 * 
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => apiClient.get('/data'),
 *   { maxRetries: 3, delayMs: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableStatuses)) {
        throw error;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, opts.delayMs, opts.backoff);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of an async function
 * 
 * @param fn - The async function to make retryable
 * @param options - Retry configuration options
 * @returns A new function that automatically retries on failure
 * 
 * @example
 * ```typescript
 * const fetchDataWithRetry = createRetryable(
 *   (id: string) => apiClient.get(`/data/${id}`),
 *   { maxRetries: 3 }
 * );
 * 
 * const data = await fetchDataWithRetry('123');
 * ```
 */
export function createRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}

/**
 * Retry with custom condition
 * 
 * @param fn - The async function to retry
 * @param shouldRetry - Custom function to determine if retry should happen
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries
 * 
 * @example
 * ```typescript
 * const data = await retryWithCondition(
 *   () => apiClient.get('/data'),
 *   (error) => error.response?.status === 503,
 *   { maxRetries: 5 }
 * );
 * ```
 */
export async function retryWithCondition<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check custom retry condition
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt === opts.maxRetries) {
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, opts.delayMs, opts.backoff);
      await sleep(delay);
    }
  }

  throw lastError;
}
