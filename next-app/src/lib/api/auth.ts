import apiClient from './client';
import { LegacyApiResponse, AuthTokens } from '../types/api';
import { User, SignupData as UserSignupData } from '../types/user';

/**
 * Authentication API service
 * Handles user authentication, registration, and token management
 */

export interface LoginCredentials {
  username: string; // Can be email or username
  password: string;
}

// Re-export SignupData from user types for convenience
export type SignupData = UserSignupData;

/**
 * Login user with credentials
 * @param credentials - User login credentials (username/email and password)
 * @returns Authentication tokens
 */
export async function login(credentials: LoginCredentials): Promise<AuthTokens> {
  // API expects form data for login
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await apiClient.post<AuthTokens>('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data;
}

/**
 * Register a new user
 * @param data - User registration data
 * @returns Created user object (uses legacy response format)
 */
export async function signup(data: SignupData): Promise<LegacyApiResponse<User>> {
  const response = await apiClient.post<LegacyApiResponse<User>>('/auth/signup', data);
  return response.data;
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token
 * @returns New authentication tokens
 */
export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  const response = await apiClient.post<AuthTokens>(
    '/auth/refresh',
    null,
    {
      headers: {
        refresh_token: refreshToken,
      },
    }
  );

  return response.data;
}

/**
 * Get current authenticated user
 * @returns Current user object (uses legacy response format)
 */
export async function getCurrentUser(): Promise<LegacyApiResponse<User>> {
  const response = await apiClient.get<LegacyApiResponse<User>>('/users/me');
  return response.data;
}

/**
 * Logout user (client-side token cleanup)
 * Note: This is a client-side operation. The backend doesn't have a logout endpoint
 * as JWT tokens are stateless.
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
