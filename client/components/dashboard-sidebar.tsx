"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { notificationsApi, noticesApi } from "@/lib/api";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  User,
  LogOut,
  Anchor,
  Settings,
  ClipboardCheck,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }> };

const overviewItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const workspaceItems: NavItem[] = [
  { name: "Internships", href: "/dashboard/internships", icon: Briefcase },
  { name: "Evaluations", href: "/dashboard/evaluations", icon: ClipboardCheck },
  { name: "Letter Requests", href: "/dashboard/letter-requests", icon: FileText },
];

const accountItems: NavItem[] = [
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

function NavGroup({
  label,
  items,
  pathname,
  unreadCount,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        {label}
      </p>
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"
              )}
            />
            <span className="truncate">{item.name}</span>
            {item.name === "Notifications" && unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}

interface DashboardSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function DashboardSidebar({ className, onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await notificationsApi.getAll();
        if (result.data) {
          let notifications: any[] = [];
          if (Array.isArray(result.data)) {
            notifications = result.data;
          } else if (result.data && typeof result.data === "object") {
            if (Array.isArray((result.data as any).data)) {
              notifications = (result.data as any).data;
            } else if (Array.isArray((result.data as any).notifications)) {
              notifications = (result.data as any).notifications;
            }
          }
          const now = Date.now();
          notifications = notifications.filter((n: any) => {
            if (!n.expiresAt) return true;
            const t = new Date(n.expiresAt).getTime();
            return !Number.isNaN(t) && t > now;
          });
          let unread = notifications.filter((n: any) => !n.isRead).length;

          try {
            const noticesResult = await noticesApi.getAll({ isActive: "true" });
            const noticesData = Array.isArray(noticesResult.data?.data)
              ? noticesResult.data.data
              : Array.isArray(noticesResult.data)
                ? noticesResult.data
                : [];
            const expFiltered = noticesData.filter((n: any) => {
              if (!n.isActive) return false;
              const exp = n.expires_at || n.expiresAt || n.expiryDate;
              if (!exp) return true;
              return new Date(exp).getTime() > Date.now();
            });
            const unreadNotices = expFiltered.filter((n: any) => n.isActive && !n.isRead).length;
            unread += unreadNotices;
          } catch {
            // ignore
          }

          setUnreadCount(unread);
        }
      } catch {
        // ignore
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener("notifications-updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, []);

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  return (
    <div className={cn("flex h-full flex-col bg-sidebar border-r border-sidebar-border", className)}>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
          <Anchor className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold leading-none text-sidebar-foreground truncate">
            RMU Portal
          </span>
          <span className="text-xs leading-none text-sidebar-foreground/70 mt-0.5 truncate">
            Student workspace
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 p-4 overflow-y-auto">
        <NavGroup
          label="Overview"
          items={overviewItems}
          pathname={pathname}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
        />
        <NavGroup
          label="Workspace"
          items={workspaceItems}
          pathname={pathname}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
        />
        <Separator className="bg-sidebar-border" />
        <NavGroup
          label="Account"
          items={accountItems}
          pathname={pathname}
          unreadCount={unreadCount}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-2">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
          <Avatar className="h-10 w-10 border-2 border-sidebar-border shrink-0">
            <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={user?.firstName} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              Student
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            asChild
          >
            <Link href="/dashboard/profile" onClick={onNavigate}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
