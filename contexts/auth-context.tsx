"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, AuthState, LoginFormData, RegisterFormData } from '@/types';
import { authApi } from '@/lib/supabase/api';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    const init = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Fetch user profile
      try {
        const { data, error } = await authApi.getProfile();
        if (error || !data) {
          setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
          return;
        }

        const apiUser = (data as any).user as User;
        setState({
          user: apiUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (err) {
        console.warn('Failed to restore session:', err);
        setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
      }
    };

    void init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data, error } = await authApi.getProfile();
        if (!error && data) {
          const apiUser = (data as any).user as User;
          setState({
            user: apiUser,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authApi.login(data.email, data.password);
      if (result.error || !result.data) {
        setState(prev => ({ ...prev, isLoading: false }));
        const errorData = result.error || '';
        if (errorData.includes('verify') || errorData.includes('verification')) {
          return { success: false, error: result.error, requiresVerification: true };
        }
        return { success: false, error: result.error || 'Invalid email or password' };
      }
    
      const { user } = result.data as any;
      
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    
      return { success: true };
    },
    []
  );

  const register = useCallback(
    async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
      const payload = {
        email: data.email,
        password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      studentId: data.studentId,
      department: data.department,
      program: data.program,
      yearOfStudy: data.yearOfStudy,
        phone: data.phone,
      };

      const result = await authApi.register(payload);
      setState(prev => ({ ...prev, isLoading: false }));

      if (result.error) {
        return { success: false, error: result.error };
      }

      // Backend sends verification email; user needs to verify before logging in
      // Don't set user as authenticated - they need to verify email first
      return { success: true, requiresVerification: true };
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    const result = await authApi.updateProfile(updates);
    if (result.error || !result.data) {
      return;
    }
    
    const updatedUser = (result.data as any).user as User;
    setState(prev => {
      if (!prev.user) return prev;
      return { ...prev, user: updatedUser };
    });
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authApi.verifyEmail(token);
    if (result.error) {
      return { success: false, error: result.error };
    }
    if (state.user) {
      updateUser({ isEmailVerified: true });
    }
    return { success: true };
  }, [state.user, updateUser]);

  const resendVerification = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.user) {
      return { success: false, error: 'No user logged in' };
    }
    
    const result = await authApi.resendVerification(state.user.email);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
        verifyEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
