"use client";

import React from "react";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Menu, Bell, FileText, ClipboardCheck, Users, Briefcase, AlertCircle, X } from "lucide-react";
import { notificationsApi } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const fetchNotifications = async () => {
      try {
        const result = await notificationsApi.getAll();
        if (result.data) {
          let notifs: Notification[] = [];
          if (Array.isArray(result.data)) {
            notifs = result.data;
          } else if (Array.isArray((result.data as any).data)) {
            notifs = (result.data as any).data;
          } else if (Array.isArray((result.data as any).notifications)) {
            notifs = (result.data as any).notifications;
          }
          // Sort by newest first and take top 10
          notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setNotifications(notifs.slice(0, 10));
          setUnreadCount(notifs.filter((n) => !n.isRead).length);
        }
      } catch {
        // silently fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "letter_request":
      case "letter":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "evaluation":
        return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
      case "application":
        return <Briefcase className="h-4 w-4 text-green-500" />;
      case "user":
        return <Users className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
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

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <AdminSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
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

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {pathname === "/admin" ? "Dashboard" : 
               pathname.includes("/users") ? "User Management" :
               pathname.includes("/internships") ? "Internships" :
               pathname.includes("/applications") ? "Applications" :
               pathname.includes("/notices") ? "Notices" :
               pathname.includes("/evaluations") ? "Evaluations" :
               pathname.includes("/letter") ? "Letter Requests" :
               pathname.includes("/analytics") ? "Analytics" : "Admin"}
            </h1>
          </div>

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            {/* Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[380px] rounded-lg border border-border bg-background shadow-lg z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setNotifOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                          !notif.isRead ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                          if (notif.actionUrl) {
                            router.push(notif.actionUrl);
                            setNotifOpen(false);
                          }
                        }}
                      >
                        <div className="mt-0.5 shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${!notif.isRead ? "font-semibold" : "font-medium"}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            {getTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t px-4 py-2 bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        router.push("/admin/notices");
                        setNotifOpen(false);
                      }}
                    >
                      View all notifications
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
