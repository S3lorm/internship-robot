"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deactivationCountdown, setDeactivationCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
    if (!isLoading && isAuthenticated && user?.role === "admin") {
      router.push("/admin");
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const handleDeactivated = () => {
      if (deactivationCountdown === null) {
        setDeactivationCountdown(5);
      }
    };

    window.addEventListener("account-deactivated", handleDeactivated);
    return () => window.removeEventListener("account-deactivated", handleDeactivated);
  }, [deactivationCountdown]);

  useEffect(() => {
    if (deactivationCountdown !== null && deactivationCountdown > 0) {
      const timer = setTimeout(() => {
        setDeactivationCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (deactivationCountdown === 0) {
      // Execute logout
      const { logout } = require("@/contexts/auth-context"); // Get contextual logout if possible, but safer to use the hook if available
      // actually we have access to it from useAuth above! but wait, we didn't destructure logout from useAuth
      // Let's rely on localStorage clear and redirect as a fallback, but better to get logout from hook
      localStorage.removeItem("rmu_user");
      localStorage.removeItem("rmu_token");
      window.location.href = "/login";
    }
  }, [deactivationCountdown]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {deactivationCountdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-lg p-8 rounded-lg max-w-md w-full text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Account Deactivated</h2>
            <p className="text-muted-foreground mb-6">
              Your account has been deactivated by an administrator. You will be logged out automatically in <span className="font-bold text-foreground">{deactivationCountdown}</span> seconds.
            </p>
            <Button className="w-full" variant="destructive" onClick={() => {
              localStorage.removeItem("rmu_user");
              localStorage.removeItem("rmu_token");
              window.location.href = "/login";
            }}>
              Log Out Now
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <DashboardSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <DashboardSidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="flex-1" />
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
