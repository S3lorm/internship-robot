"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Menu } from "lucide-react";
import { PageTransition } from "@/components/page-transition";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isSecutuary = user?.role === "hod" && user?.originalRole === "secutuary";

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "admin" && user.role !== "hod"))) {
      router.push("/login");
    }
    if (!isLoading && user?.mustChangePassword && pathname !== "/force-password-change") {
      router.push("/force-password-change");
    }
  }, [user, isLoading, router, pathname]);

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
      <aside className="relative z-20 hidden h-full w-64 min-w-[16rem] max-w-[16rem] shrink-0 overflow-hidden bg-sidebar md:flex">
        <AdminSidebar className="h-full min-h-0" />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
            <h1 className="truncate text-lg font-semibold text-foreground">
              {pathname === "/admin" ? "Dashboard" :
               pathname.includes("/users") ? "User Management" :
               pathname.includes("/official-placement-management") ? "Official placement management" :
               pathname.includes("/internship-tracking") ? "Internship Tracking" :
               pathname.includes("/portal-management") ? "Internship Portal Management" :
               pathname.includes("/notices") ? "Notices" :
               pathname.includes("/notifications") ? "Notifications" :
               pathname.includes("/evaluations") ? "Evaluations" :
               pathname.includes("/signature") ? "Digital signature" :
               pathname.includes("/weekly-logbooks") ? "Logbook" :
               pathname.includes("/department-students") ? "Department students" :
               pathname.includes("/letter-requests") ? "Letter Requests" :
               pathname.includes("/letter") ? "Application Letter" :
               pathname.includes("/settings") ? "Settings" :
               pathname.includes("/analytics") ? "Analytics" : user.role === "hod" ? (isSecutuary ? "Secutuary" : "HOD") : "Admin"}
            </h1>
          </div>
        </header>

        <main className="min-h-0 w-full min-w-0 max-w-full flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-full">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
