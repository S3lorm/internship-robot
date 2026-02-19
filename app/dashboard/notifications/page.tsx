"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/types";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  RefreshCw,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.isRead);

  // Load notifications
  const loadNotifications = async () => {
    try {
      const result = await notificationsApi.getAll();
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        // Handle both possible response structures
        let notificationsData: Notification[] = [];
        if (Array.isArray(result.data)) {
          notificationsData = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          notificationsData = result.data.data;
        } else if (result.data.notifications && Array.isArray(result.data.notifications)) {
          notificationsData = result.data.notifications;
        }
        setNotifications(notificationsData);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time polling every 30 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const result = await notificationsApi.markAsRead(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        toast.success("Notification marked as read");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await notificationsApi.markAllAsRead();
      if (result.error) {
        toast.error(result.error);
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to mark all as read");
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification removed");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("All notifications cleared");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
      case "letter_request":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "evaluation_available":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "deadline_reminder":
      case "logbook_deadline":
      case "report_deadline":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case "admin_action_required":
        return <CheckCircle2 className="h-5 w-5 text-purple-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBadge = (notification: Notification) => {
    if (notification.priority === "urgent") {
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    }
    if (notification.priority === "high") {
      return <Badge variant="default" className="text-xs bg-orange-500">High</Badge>;
    }
    if (notification.actionRequired) {
      return <Badge variant="secondary" className="text-xs">Action Required</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your internship applications and opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{readCount}</p>
              <p className="text-sm text-muted-foreground">Read</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                {filteredNotifications.length} notification
                {filteredNotifications.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="read">Read</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : filter === "read"
                    ? "No read notifications yet."
                    : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative rounded-lg border p-4 transition-all ${
                    notification.isRead
                      ? "bg-background border-border"
                      : "bg-primary/5 border-primary/20 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-semibold ${
                                notification.isRead
                                  ? "text-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {getNotificationBadge(notification)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {notification.expiresAt && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires: {new Date(notification.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      {notification.link && (
                        <Button
                          variant="link"
                          size="sm"
                          className="mt-2 h-auto p-0"
                          asChild
                        >
                          <Link href={notification.link}>View details →</Link>
                        </Button>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

