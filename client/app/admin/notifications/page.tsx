"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { authApi, noticesApi, notificationsApi } from "@/lib/api";
import type { Notice } from "@/types";
import { toast } from "sonner";
import {
  Bell,
  Megaphone,
  Loader2,
  CheckCircle2,
  Trash2,
  CheckCheck,
  Clock,
} from "lucide-react";

type InboxItem = {
  id: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
};

function parseInboxPayload(raw: unknown): InboxItem[] {
  if (Array.isArray(raw)) return raw as InboxItem[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: InboxItem[] }).data;
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as { notifications?: unknown }).notifications)) {
    return (raw as { notifications: InboxItem[] }).notifications;
  }
  return [];
}

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const isSecutuary = user?.role === "hod" && user?.originalRole === "secutuary";
  const roleLabel = isSecutuary ? "Secutuary" : "HOD";
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [posting, setPosting] = useState(false);
  const [targetAudience, setTargetAudience] = useState<Notice["targetAudience"]>("students");
  const [targetDepartment, setTargetDepartment] = useState("all");
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [inboxBusyId, setInboxBusyId] = useState<string | null>(null);

  const unreadInbox = useMemo(() => inbox.filter((n) => !n.isRead).length, [inbox]);

  const load = async () => {
    setLoading(true);
    try {
      const res =
        user?.role === "admin"
          ? await noticesApi.getAll({ manage: "1", limit: "120" })
          : await noticesApi.getAll();
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setNotices(rows);

      let list: InboxItem[] = [];
      if (user?.role === "admin" || user?.role === "hod") {
        const n = await notificationsApi.getAll();
        if (!n.error && n.data) {
          list = parseInboxPayload(n.data);
        }
      }
      setInbox(list);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void load();
  }, [user?.role, user?.department]);

  useEffect(() => {
    let mounted = true;
    async function loadDepartmentCatalog() {
      if (user?.role !== "admin") return;
      const result = await authApi.getRegistrationCatalog();
      if (!mounted) return;
      const rows = ((result.data as any)?.departments || []) as Array<{ name?: string }>;
      const departments = rows
        .map((d) => String(d?.name || "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setDepartmentOptions(departments);
    }
    void loadDepartmentCatalog();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setPosting(true);
    try {
      const result = await noticesApi.create({
        title: title.trim(),
        content: content.trim(),
        priority: "medium",
        targetAudience: user?.role === "admin" ? targetAudience : "students",
        targetDepartment:
          user?.role === "admin"
            ? targetDepartment === "all"
              ? undefined
              : targetDepartment
            : user?.department || undefined,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        user?.role === "admin"
          ? "Notice published successfully"
          : "Notice published to your department"
      );
      setTitle("");
      setContent("");
      setExpiresAt("");
      if (user?.role === "admin") {
        setTargetAudience("students");
        setTargetDepartment("all");
      }
      await load();
    } finally {
      setPosting(false);
    }
  };

  const markInboxRead = async (id: string) => {
    setInboxBusyId(id);
    try {
      const res = await notificationsApi.markAsRead(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setInbox((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      toast.success("Marked as read");
    } finally {
      setInboxBusyId(null);
    }
  };

  const markAllInboxRead = async () => {
    try {
      const res = await notificationsApi.markAllAsRead();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setInbox((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteInboxItem = async (id: string) => {
    setInboxBusyId(id);
    try {
      const res = await notificationsApi.remove(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setInbox((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } finally {
      setInboxBusyId(null);
    }
  };

  if (!user) return null;

  if (user.role === "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Post role-based notices and review your in-app messages.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Post notice
            </CardTitle>
            <CardDescription>
              Choose who should receive this notice: all users, students, HODs, or secutuaries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePost} className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="admin-notice-title">Title</Label>
                <Input
                  id="admin-notice-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short headline"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-notice-message">Message</Label>
                <Textarea
                  id="admin-notice-message"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Write your notice..."
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target audience</Label>
                  <Select
                    value={targetAudience}
                    onValueChange={(value: Notice["targetAudience"]) => setTargetAudience(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All users</SelectItem>
                      <SelectItem value="students">Students only</SelectItem>
                      <SelectItem value="hod">HOD only</SelectItem>
                      <SelectItem value="secutuary">Secutuary only</SelectItem>
                      <SelectItem value="admins">Admins only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department scope (optional)</Label>
                  <Select value={targetDepartment} onValueChange={setTargetDepartment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-notice-exp">Expires at (optional)</Label>
                <Input
                  id="admin-notice-exp"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={posting}>
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish notice"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently published notices</CardTitle>
            <CardDescription>Latest notices posted from this admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            ) : (
              <ul className="space-y-3">
                {notices.slice(0, 12).map((n) => (
                  <li key={n.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{n.title}</p>
                      <Badge variant="secondary" className="capitalize">
                        {n.targetAudience}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{n.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Your in-app inbox
            </CardTitle>
            <CardDescription>Recent items from the notifications service.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : inbox.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications.</p>
            ) : (
              <ul className="space-y-3">
                {inbox.slice(0, 25).map((n) => (
                  <li key={n.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground line-clamp-2">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const noticesSection = (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Post notice
          </CardTitle>
          <CardDescription>Students in your department will see this on their dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePost} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="n-title">Title</Label>
              <Input
                id="n-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short headline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-body">Message</Label>
              <Textarea
                id="n-body"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Full message for students"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-exp">Hide from students after (optional)</Label>
              <Input
                id="n-exp"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={posting}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published for your department</CardTitle>
          <CardDescription>Active notices targeted to {user.department}.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : notices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices yet.</p>
          ) : (
            <ul className="space-y-4">
              {notices.map((n) => (
                <li key={n.id} className="rounded-lg border p-4">
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{n.content}</p>
                  {(n as Notice & { expiresAt?: string }).expiresAt || n.expiryDate ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires:{" "}
                      {new Date(
                        (n as Notice & { expiresAt?: string }).expiresAt || n.expiryDate || ""
                      ).toLocaleString()}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const inboxSection = (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Incoming notifications
          </CardTitle>
          <CardDescription>
            Alerts for your {roleLabel} account (e.g. system messages). Mark as read or remove when you are done.
          </CardDescription>
        </div>
        {unreadInbox > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => void markAllInboxRead()}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : inbox.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications in your inbox.</p>
        ) : (
          <ul className="space-y-3">
            {inbox.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border p-4 text-sm ${n.isRead ? "bg-background" : "border-primary/25 bg-primary/5"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.isRead && (
                        <Badge variant="secondary" className="text-xs">
                          Unread
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{n.message}</p>
                    {n.createdAt && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {!n.isRead && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={inboxBusyId === n.id}
                        onClick={() => void markInboxRead(n.id)}
                      >
                        {inboxBusyId === n.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Read
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={inboxBusyId === n.id}
                      onClick={() => void deleteInboxItem(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Inbox for your {roleLabel} account, and department notices for{" "}
          <span className="font-medium text-foreground">{user.department}</span> students — on one page.
        </p>
      </div>

      <Tabs defaultValue="inbox" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inbox" className="gap-2">
            <Bell className="h-4 w-4" />
            Inbox
            {unreadInbox > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0 text-xs">
                {unreadInbox}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notices" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Department notices
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-0">
          {inboxSection}
        </TabsContent>
        <TabsContent value="notices" className="mt-0">
          {noticesSection}
        </TabsContent>
      </Tabs>
    </div>
  );
}
