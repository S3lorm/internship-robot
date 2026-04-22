"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  FileCheck,
  Bell,
  Settings,
  LogOut,
  Anchor,
  ClipboardCheck,
  MapPinned,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const hodNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/letter-requests", label: "Letter Requests", icon: FileCheck },
  { href: "/admin/internship-tracking", label: "Official placements", icon: MapPinned },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/evaluations", label: "Evaluations", icon: ClipboardCheck },
  { href: "/admin/internships", label: "Post Internship", icon: Briefcase },
];

const systemAdminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/internship-tracking", label: "Official placements", icon: MapPinned },
  { href: "/admin/notices", label: "Notices", icon: Bell },
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isHod = user?.role === "hod";
  const items = isHod ? hodNavItems : systemAdminNav;

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
            {isHod ? "HOD Portal" : "System Admin"}
          </span>
          <span className="text-xs leading-none text-sidebar-foreground/70 mt-0.5 truncate">
            {isHod ? "Department tools" : "Full monitoring"}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {!isHod && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Administration
          </p>
        )}
        {isHod && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            Department
          </p>
        )}
        {items.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
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
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-2">
        {isHod && user?.department && (
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-xs text-sidebar-foreground/80">
            <span className="font-medium text-sidebar-foreground">Department: </span>
            {user.department}
          </div>
        )}
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
            <Badge variant="outline" className="mt-1 text-xs">
              {isHod ? "Head of Department" : "System Administrator"}
            </Badge>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        <div className="space-y-1">
          {!isHod && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              asChild
            >
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          )}
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
