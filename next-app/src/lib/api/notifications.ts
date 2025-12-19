import apiClient from './client';
import { ApiResponse } from '../types';
import { NotificationSettings, DailySummary } from '../types/notification';

/**
 * Notifications API service
 * Handles email notification settings and testing
 */

/**
 * Get notification settings
 * @returns Current notification settings
 */
export async function getNotificationSettings(): Promise<
  ApiResponse<NotificationSettings>
> {
  const response = await apiClient.get<ApiResponse<NotificationSettings>>(
    '/notifications/settings'
  );
  return response.data;
}

/**
 * Update notification settings
 * @param data - Settings to update
 * @returns Updated notification settings
 */
export async function updateNotificationSettings(
  data: Partial<NotificationSettings>
): Promise<ApiResponse<NotificationSettings>> {
  const response = await apiClient.put<ApiResponse<NotificationSettings>>(
    '/notifications/settings',
    data
  );
  return response.data;
}

/**
 * Get email preview
 * @returns Preview of daily summary email content
 */
export async function getEmailPreview(): Promise<ApiResponse<DailySummary>> {
  const response = await apiClient.get<ApiResponse<DailySummary>>(
    '/notifications/preview'
  );
  return response.data;
}

/**
 * Send test email
 * @returns Success/failure response
 */
export async function sendTestEmail(): Promise<ApiResponse<void>> {
  const response = await apiClient.post<ApiResponse<void>>(
    '/notifications/test'
  );
  return response.data;
}
