"use client";

import React from "react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "admin" && user.role !== "hod"))) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "hod")) {
    return null;
  }

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background md:flex-row">
      {/* Static column: sidebar in normal flow; main area scrolls (md+) */}
      <aside className="hidden h-full w-64 shrink-0 md:flex">
        <AdminSidebar className="h-full min-h-0" />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {pathname === "/admin" ? "Dashboard" :
               pathname.includes("/users") ? "User Management" :
               pathname.includes("/official-placement-management") ? "Official placement management" :
               pathname.includes("/internship-tracking") ? "Internship Tracking" :
               pathname.includes("/internships") ? "Internships" :
               pathname.includes("/notices") ? "Notices" :
               pathname.includes("/notifications") ? "Notifications" :
               pathname.includes("/evaluations") ? "Evaluations" :
               pathname.includes("/letter-requests") ? "Letter Requests" :
               pathname.includes("/letter") ? "Application Letter" :
               pathname.includes("/analytics") ? "Analytics" : user.role === "hod" ? "HOD" : "Admin"}
            </h1>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
