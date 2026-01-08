/**
 * Journal types
 */

export enum JournalMood {
  VERY_HAPPY = 'very_happy',
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  SAD = 'sad',
  VERY_SAD = 'very_sad',
  ANGRY = 'angry',
  EXCITED = 'excited',
  ANXIOUS = 'anxious',
  GRATEFUL = 'grateful',
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: JournalMood | null;
  sentiment_score: number | null;
  keywords: string[];
  summary: string | null;
  weather: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryFormData {
  title?: string;
  content: string;
  mood?: JournalMood;
  weather?: string;
  location?: string;
}

export interface JournalFilters {
  start_date?: string;
  end_date?: string;
  mood?: JournalMood;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JournalStats {
  total_entries: number;
  current_streak: number;
  longest_streak: number;
  average_sentiment: number;
  most_common_mood: JournalMood | null;
  entries_this_month: number;
  entries_this_week: number;
}

export interface MoodTrend {
  date: string;
  mood: JournalMood;
  sentiment_score: number;
  entry_count: number;
}
