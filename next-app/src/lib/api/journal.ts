import apiClient from './client';
import { ApiResponse } from '../types';
import { JournalEntry, JournalEntryFormData, JournalFilters, JournalStats, MoodTrend } from '../types/journal';

/**
 * Journal API service
 */

export async function getJournalEntries(
  filters?: JournalFilters
): Promise<ApiResponse<JournalEntry[]>> {
  const response = await apiClient.get<ApiResponse<JournalEntry[]>>('/journal/', {
    params: filters,
  });
  return response.data;
}

export async function getJournalEntry(id: string): Promise<ApiResponse<JournalEntry>> {
  const response = await apiClient.get<ApiResponse<JournalEntry>>(`/journal/${id}`);
  return response.data;
}

export async function createJournalEntry(
  data: JournalEntryFormData
): Promise<ApiResponse<JournalEntry>> {
  const response = await apiClient.post<ApiResponse<JournalEntry>>('/journal/', data);
  return response.data;
}

export async function updateJournalEntry(
  id: string,
  data: Partial<JournalEntryFormData>
): Promise<ApiResponse<JournalEntry>> {
  const response = await apiClient.put<ApiResponse<JournalEntry>>(`/journal/${id}`, data);
  return response.data;
}

export async function deleteJournalEntry(id: string): Promise<ApiResponse<void>> {
  const response = await apiClient.delete<ApiResponse<void>>(`/journal/${id}`);
  return response.data;
}

export async function getJournalStats(): Promise<ApiResponse<JournalStats>> {
  const response = await apiClient.get<ApiResponse<JournalStats>>('/journal/stats');
  return response.data;
}

export async function getMoodTrends(days: number = 30): Promise<ApiResponse<{ trends: MoodTrend[] }>> {
  const response = await apiClient.get<ApiResponse<{ trends: MoodTrend[] }>>('/journal/mood-trends', {
    params: { days },
  });
  return response.data;
}

export async function parseJournalText(text: string): Promise<ApiResponse<any>> {
  const response = await apiClient.post<ApiResponse<any>>('/journal/parse', { text });
  return response.data;
}

/**
 * Parse voice recording into journal data using AI
 * @param file - Audio file
 * @returns Parsed journal data with confidence score and transcription
 */
export async function parseVoice(
  file: File
): Promise<ApiResponse<any & { transcribed_text?: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<any & { transcribed_text?: string }>>(
    '/journal/ai/parse-voice',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}
