"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { portalApi, noticesApi } from "@/lib/api";
import { usePortalStatus } from "@/hooks/use-portal-status";
import type { Notice } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DoorOpen,
  DoorClosed,
  Loader2,
  Megaphone,
  ArrowRight,
  Shield,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

const theme = {
  navy: "#0a1930",
  blue: "#1d3557",
  accent: "#4dabf7",
};

export default function PortalManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { portal, loading, refresh } = usePortalStatus();
  const [updating, setUpdating] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/admin");
    }
  }, [user, router]);

  useEffect(() => {
    async function loadNotices() {
      const res = await noticesApi.getAll({ manage: "1", limit: "5" });
      if (!res.error) {
        const payload = res.data as { data?: Notice[] };
        const list = Array.isArray(payload?.data) ? payload.data : [];
        setRecentNotices(list.slice(0, 5));
      }
    }
    loadNotices();
  }, []);

  const setStatus = async (status: "open" | "closed") => {
    setUpdating(true);
    const res = await portalApi.setStatus(status);
    setUpdating(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    const delivery = (res.data as { delivery?: { notificationsCreated?: number; emailsSent?: number }; deliveryWarning?: string })
      ?.delivery;
    const deliveryWarning = (res.data as { deliveryWarning?: string })?.deliveryWarning;

    if (delivery) {
      const action = status === "open" ? "opened" : "closed";
      toast.success(
        `Portal ${action}. ${delivery.notificationsCreated ?? 0} in-app notification(s) and ${delivery.emailsSent ?? 0} email(s) sent to verified students.`
      );
    } else if (deliveryWarning) {
      toast.warning(deliveryWarning);
      toast.success(
        status === "open"
          ? "Internship request portal is now open."
          : "Internship request portal is now closed."
      );
    } else {
      toast.success(
        status === "open"
          ? "Internship request portal is now open."
          : "Internship request portal is now closed."
      );
    }
    await refresh();
  };

  const handleOpen = () => setStatus("open");

  const handleCloseConfirmed = async () => {
    setConfirmClose(false);
    await setStatus("closed");
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-6 text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${theme.navy} 0%, ${theme.blue} 100%)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Admin control
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              Internship Portal Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Control when students can submit internship letters, official placements, and
              replacement requests. Publish notices to verified students by email.
            </p>
          </div>
          <Shield className="h-10 w-10 shrink-0 opacity-80" style={{ color: theme.accent }} />
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-0 shadow-md ring-1 ring-slate-200">
          <CardHeader
            className="text-white"
            style={{ background: `linear-gradient(90deg, ${theme.blue}, ${theme.navy})` }}
          >
            <CardTitle className="flex items-center gap-2 text-lg">Portal status</CardTitle>
            <CardDescription className="text-white/80">
              Students see this status on their dashboard and request pages. Opening or closing
              the portal notifies all verified students by app and email at once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading status…
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Current status</span>
                  <Badge
                    className="px-3 py-1 text-sm font-semibold"
                    style={
                      portal.isOpen
                        ? { backgroundColor: "#dcfce7", color: "#166534" }
                        : { backgroundColor: "#fee2e2", color: "#991b1b" }
                    }
                  >
                    {portal.isOpen ? "OPEN" : "CLOSED"}
                  </Badge>
                </div>
                {portal.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(portal.updatedAt).toLocaleString()}
                  </p>
                )}
                <p className="rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                  {portal.isOpen ? portal.openMessage : portal.closedMessage}
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleOpen}
                    disabled={updating || portal.isOpen}
                    className="transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: theme.accent, color: theme.navy }}
                  >
                    {updating && portal.isOpen ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DoorOpen className="mr-2 h-4 w-4" />
                    )}
                    Open internship portal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmClose(true)}
                    disabled={updating || !portal.isOpen}
                    className="border-red-200 text-red-700 hover:bg-red-50 transition-transform hover:scale-[1.02]"
                  >
                    <DoorClosed className="mr-2 h-4 w-4" />
                    Close internship portal
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5" style={{ color: theme.blue }} />
              Notice management
            </CardTitle>
            <CardDescription>
              Create and publish notices. Verified students receive email when you publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full sm:w-auto" style={{ backgroundColor: theme.blue }}>
              <Link href="/admin/notices">
                Manage all notices
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-sm text-slate-700">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
              <p>
                When you publish a notice for students, the system emails only accounts with{" "}
                <strong>verified email addresses</strong> and creates in-app notifications.
              </p>
            </div>
            {recentNotices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent notices
                </p>
                <ul className="divide-y rounded-lg border">
                  {recentNotices.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="truncate font-medium">{n.title}</span>
                      <Badge variant={n.isActive ? "default" : "secondary"}>
                        {n.isActive ? "Active" : "Draft"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close internship request portal?</AlertDialogTitle>
            <AlertDialogDescription>
              Students will not be able to submit new internship letter, placement, or
              replacement requests until you open the portal again. Existing requests are not
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseConfirmed}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, close portal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
