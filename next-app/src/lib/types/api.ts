/**
 * API response type definitions
 */

// Modern API response format (used by /users/me endpoints)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

// Legacy API response format (used by /me/ and /auth/signup endpoints)
export interface LegacyApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in: number;
}

/**
 * Type guard to check if response is legacy format
 */
export function isLegacyResponse<T>(
  response: ApiResponse<T> | LegacyApiResponse<T>
): response is LegacyApiResponse<T> {
  return !('success' in response);
}

/**
 * Normalize response to modern format
 */
export function normalizeResponse<T>(
  response: ApiResponse<T> | LegacyApiResponse<T>
): ApiResponse<T> {
  if (isLegacyResponse(response)) {
    return {
      success: true,
      data: response.data,
      message: response.message,
    };
  }
  return response;
}
