import { useState, useEffect, useCallback } from 'react';
import { getProfile } from '@/lib/api/profile';
import { User } from '@/lib/types/user';
import { useEventBus } from './use-event-bus';
import { PROFILE_UPDATED, AVATAR_UPDATED } from '@/lib/utils/event-types';

interface UseProfileReturn {
  profile: User | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing user profile data
 * Automatically subscribes to profile events for real-time updates
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProfile();
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Subscribe to profile events for auto-refresh
  useEventBus([PROFILE_UPDATED, AVATAR_UPDATED], useCallback((data: unknown) => {
    // Update profile with the new data from the event
    setProfile(data as User);
  }, []));

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}
