'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { login as apiLogin, signup as apiSignup, getCurrentUser } from '@/lib/api/auth';
import { eventBus } from '@/lib/utils/event-bus';
import { AUTH_STATE_CHANGED } from '@/lib/utils/event-types';

interface SignupData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Check for existing token and fetch user on mount
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetchCurrentUser();
      }
      setLoading(false);
    };
    
    initAuth();
  }, [fetchCurrentUser]);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiLogin({ username, password });
    
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    
    await fetchCurrentUser();
    eventBus.publish(AUTH_STATE_CHANGED, { user });
  }, [fetchCurrentUser, user]);

  const signup = useCallback(async (data: SignupData) => {
    // Signup returns user object, not tokens
    await apiSignup(data);
    
    // After successful signup, automatically log the user in with username
    await login(data.username, data.password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    eventBus.publish(AUTH_STATE_CHANGED, { user: null });
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
