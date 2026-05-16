"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api";

/** Applies saved theme from the user profile when they sign in. */
export function ThemePreferenceSync() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return;

    let cancelled = false;
    authApi.getPreferences().then((result) => {
      if (cancelled) return;
      const theme = result.data?.preferences?.theme;
      if (theme === "light" || theme === "dark") {
        setTheme(theme);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, isAuthenticated, isLoading, setTheme]);

  return null;
}
