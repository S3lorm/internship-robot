"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
import type { User, AuthState, LoginFormData, RegisterFormData } from '@/types';
import { authApi } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  loginHod: (department: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  verifyEmail: (payload: { token?: string; email?: string; code?: string }) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (email?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Hydrate from localStorage before paint so protected layouts unblock quickly
  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('rmu_token');
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }
    const raw = localStorage.getItem('rmu_user');
    if (!raw) return;
    try {
      const user = JSON.parse(raw) as User;
      setState({ user, isLoading: false, isAuthenticated: true });
    } catch {
      // Wait for getProfile in init to reconcile or clear bad cache
    }
  }, []);

  // Check for existing session on mount (token + user)
  useEffect(() => {
    const init = async () => {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('rmu_user') : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('rmu_token') : null;

      if (!token) {
        setState({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Try to fetch current user from backend using token
      try {
        const { data, error } = await authApi.getProfile();
        if (error || !data) {
          // Check if it's a network error (backend not available)
          if (error && error.includes('Failed to connect to backend')) {
            // Backend is not available - try to use cached user if available
            const cachedUser = localStorage.getItem('rmu_user');
            if (cachedUser) {
              try {
                const user = JSON.parse(cachedUser) as User;
                setState({
                  user,
                  isLoading: false,
                  isAuthenticated: true,
                });
                console.warn('Using cached user data - backend unavailable');
                return;
              } catch (parseError) {
                // Invalid cached data, clear it
                localStorage.removeItem('rmu_user');
              }
            }
          }
          // Token might be invalid or expired, clear it
          localStorage.removeItem('rmu_token');
          localStorage.removeItem('rmu_user');
          setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
          return;
        }

        const apiUser = (data as any).user as User;
        localStorage.setItem('rmu_user', JSON.stringify(apiUser));
        setState({
          user: apiUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (err) {
        // If API call fails completely (network error, etc.), try to use cached user
        console.warn('Failed to restore session:', err);
        const cachedUser = localStorage.getItem('rmu_user');
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser) as User;
            setState({
              user,
              isLoading: false,
              isAuthenticated: true,
            });
            console.warn('Using cached user data - backend unavailable');
            return;
          } catch (parseError) {
            // Invalid cached data, clear it
            localStorage.removeItem('rmu_user');
          }
        }
        localStorage.removeItem('rmu_token');
        localStorage.removeItem('rmu_user');
        setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
      }
    };

    void init();
  }, []);

  const login = useCallback(
    async (data: LoginFormData): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
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

      const { token, user } = result.data as any;

      if (typeof window !== 'undefined') {
        localStorage.setItem('rmu_token', token);
        localStorage.setItem('rmu_user', JSON.stringify(user));
      }

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    },
    []
  );

  const loginHod = useCallback(
    async (department: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setState(prev => ({ ...prev, isLoading: true }));

      const result = await authApi.loginHod(department, password);
      if (result.error || !result.data) {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error || 'Invalid department or password' };
      }

      const { token, user } = result.data as any;

      if (typeof window !== 'undefined') {
        localStorage.setItem('rmu_token', token);
        localStorage.setItem('rmu_user', JSON.stringify(user));
      }

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
    async (data: RegisterFormData): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
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

  const logout = useCallback(() => {
    localStorage.removeItem('rmu_user');
    localStorage.removeItem('rmu_token');
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updatedUser = { ...prev.user, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('rmu_user', JSON.stringify(updatedUser));
      return { ...prev, user: updatedUser };
    });
  }, []);

  const verifyEmail = useCallback(async (payload: {
    token?: string;
    email?: string;
    code?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const result = await authApi.verifyEmail(payload);
    if (result.error) {
      return { success: false, error: result.error };
    }
    if (state.user) {
      updateUser({ isEmailVerified: true });
    }
    return { success: true };
  }, [state.user, updateUser]);

  const resendVerification = useCallback(async (emailOverride?: string): Promise<{ success: boolean; error?: string }> => {
    const target = (emailOverride ?? state.user?.email)?.trim();
    if (!target) {
      return { success: false, error: 'Enter your student email to resend the verification message.' };
    }

    const result = await authApi.resendVerification(target);
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
        loginHod,
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
