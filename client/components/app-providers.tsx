"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemePreferenceSync } from "@/components/theme-preference-sync";
import { AuthProvider } from "@/contexts/auth-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="rmu-theme">
      <AuthProvider>
        <ThemePreferenceSync />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
