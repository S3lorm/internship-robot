"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { noticesApi, notificationsApi } from "@/lib/api";
import type { Notice } from "@/types";
import { toast } from "sonner";
import { Bell, Megaphone, Loader2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [posting, setPosting] = useState(false);
  const [inbox, setInbox] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await noticesApi.getAll({ isActive: "true" });
      const rows = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setNotices(rows);
      if (user?.role === "admin") {
        const n = await notificationsApi.getAll();
        let list: any[] = [];
        if (Array.isArray(n.data)) list = n.data;
        else if (n.data && typeof n.data === "object" && Array.isArray((n.data as any).data)) {
          list = (n.data as any).data;
        }
        setInbox(list);
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void load();
  }, [user?.role, user?.department]);

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
        targetAudience: "students",
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Notice published to your department");
      setTitle("");
      setContent("");
      setExpiresAt("");
      await load();
    } finally {
      setPosting(false);
    }
  };

  if (!user) return null;

  if (user.role === "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications & monitoring</h1>
          <p className="text-muted-foreground mt-1">
            System administrators manage broadcast notices from{" "}
            <Link href="/admin/notices" className="text-primary underline">
              Notices
            </Link>
            . Optional <span className="font-medium">target department</span> can be set there when
            creating a notice to reach one department only.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Your in-app inbox
            </CardTitle>
            <CardDescription>Recent items from the notifications service (system scope).</CardDescription>
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Department notices</h1>
        <p className="text-muted-foreground mt-1">
          Announcements shown here are scoped to <span className="font-medium text-foreground">{user.department}</span>{" "}
          students only. Set an expiry so items disappear from student dashboards when intended.
        </p>
      </div>

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
                  {(n as any).expiresAt || n.expiryDate ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires:{" "}
                      {new Date((n as any).expiresAt || n.expiryDate).toLocaleString()}
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
}
