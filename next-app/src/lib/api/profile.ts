import apiClient from './client';
import { ApiResponse } from '../types';
import { User, UserProfileUpdate, UserPreferences } from '../types/user';

/**
 * Profile API service
 * Handles user profile and preferences management
 */

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Get current user profile
 * @returns Current user profile data
 */
export async function getProfile(): Promise<ApiResponse<User>> {
  const response = await apiClient.get<ApiResponse<User>>('/users/me');
  return response.data;
}

/**
 * Update current user profile
 * @param data - Profile data to update
 * @returns Updated user profile
 */
export async function updateProfile(
  data: UserProfileUpdate
): Promise<ApiResponse<User>> {
  const response = await apiClient.put<ApiResponse<User>>('/users/me', data);
  return response.data;
}

/**
 * Delete current user account
 * @returns Deleted user data
 */
export async function deleteAccount(): Promise<ApiResponse<User>> {
  const response = await apiClient.delete<ApiResponse<User>>('/users/me');
  return response.data;
}

// ============================================================================
// Avatar Operations
// ============================================================================

/**
 * Upload profile picture
 * @param file - Image file to upload
 * @returns Updated user profile with new avatar URL
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<User>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<User>>(
    '/users/me/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Remove profile picture
 * @returns Success response
 */
export async function removeAvatar(): Promise<ApiResponse<void>> {
  const response = await apiClient.delete<ApiResponse<void>>('/users/me/avatar');
  return response.data;
}

// ============================================================================
// Preferences Operations
// ============================================================================

/**
 * Get user preferences
 * @returns User preferences data
 */
export async function getPreferences(): Promise<ApiResponse<UserPreferences>> {
  const response = await apiClient.get<ApiResponse<UserPreferences>>(
    '/users/me/preferences'
  );
  return response.data;
}

/**
 * Update user preferences
 * @param data - Preferences data to update
 * @returns Updated user preferences
 */
export async function updatePreferences(
  data: Partial<UserPreferences>
): Promise<ApiResponse<UserPreferences>> {
  const response = await apiClient.put<ApiResponse<UserPreferences>>(
    '/users/me/preferences',
    data
  );
  return response.data;
}

// ============================================================================
// Additional Utility Functions
// ============================================================================

/**
 * Update user timezone
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @returns Updated user profile
 */
export async function updateTimezone(
  timezone: string
): Promise<ApiResponse<User>> {
  return updateProfile({ timezone });
}

/**
 * Update user name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Updated user profile
 */
export async function updateName(
  firstName: string,
  lastName: string
): Promise<ApiResponse<User>> {
  return updateProfile({
    first_name: firstName,
    last_name: lastName,
  });
}

/**
 * Update username
 * @param username - New username
 * @returns Updated user profile
 */
export async function updateUsername(
  username: string
): Promise<ApiResponse<User>> {
  return updateProfile({ username });
}

/**
 * Check if avatar exists
 * @param user - User object
 * @returns True if user has a profile picture
 */
export function hasAvatar(user: User): boolean {
  return user.profile_picture_url !== null && user.profile_picture_url !== '';
}

/**
 * Get full avatar URL
 * @param user - User object
 * @param baseUrl - API base URL (optional)
 * @returns Full avatar URL or null
 */
export function getAvatarUrl(user: User, baseUrl?: string): string | null {
  if (!hasAvatar(user)) {
    return null;
  }

  const url = user.profile_picture_url!;
  
  // If URL is already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Otherwise, prepend base URL
  const base = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  return `${base}${url}`;
}

/**
 * Get user initials for avatar placeholder
 * @param user - User object
 * @returns User initials (e.g., "JD" for John Doe)
 */
export function getUserInitials(user: User): string {
  const firstInitial = user.first_name?.charAt(0).toUpperCase() || '';
  const lastInitial = user.last_name?.charAt(0).toUpperCase() || '';
  
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  }
  
  if (firstInitial) {
    return firstInitial;
  }
  
  // Fallback to username
  return user.username.charAt(0).toUpperCase();
}

/**
 * Get user display name
 * @param user - User object
 * @returns Full name or username
 */
export function getUserDisplayName(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  if (user.first_name) {
    return user.first_name;
  }
  
  return user.username;
}
