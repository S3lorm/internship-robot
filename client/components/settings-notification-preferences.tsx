"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Megaphone,
  FileText,
  Briefcase,
  Building2,
  ClipboardList,
  BookOpen,
  Save,
  Loader2,
  ExternalLink,
  Inbox,
} from "lucide-react";

export type NotificationPrefsState = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  applicationUpdates: boolean;
  newInternships: boolean;
  deadlineReminders: boolean;
  letterRequestUpdates: boolean;
  evaluationUpdates: boolean;
};

type PrefKey = keyof NotificationPrefsState;

function PrefRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 py-1">
        <div className="space-y-1 pr-4">
          <Label htmlFor={id} className="text-sm font-medium leading-snug">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
      <Separator />
    </>
  );
}

export function SettingsNotificationPreferences({
  notifications,
  onToggle,
  isLoadingPrefs,
  isSaving,
  onSave,
  role,
}: {
  notifications: NotificationPrefsState;
  onToggle: (key: PrefKey) => void;
  isLoadingPrefs: boolean;
  isSaving: boolean;
  onSave: () => void;
  role: string;
}) {
  const isStudent = role === "student";
  const isStaff = role === "admin" || role === "hod";
  const inboxPath = isStudent ? "/dashboard/notifications" : "/admin/notifications";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5 text-muted-foreground" />
            How alerts work on this portal
          </CardTitle>
          <CardDescription className="leading-relaxed">
            {isStudent ? (
              <>
                The RMU internship portal runs in two stages:{" "}
                <strong>Stage 1</strong> general or company-specific internship letters, then{" "}
                <strong>Stage 2</strong> official placement with your host organisation (PDF letter and
                supervisor evaluation link). Alerts appear in your{" "}
                <Link href={inboxPath} className="font-medium text-primary underline-offset-4 hover:underline">
                  notifications inbox
                </Link>
                . Some events also send email when the portal or your account settings allow it.
              </>
            ) : (
              <>
                You review student work by department: Stage 1 letter requests, Stage 2 official placements,
                weekly logbooks, and published notices. Alerts appear in your{" "}
                <Link href={inboxPath} className="font-medium text-primary underline-offset-4 hover:underline">
                  notifications inbox
                </Link>
                . Email is used for account-related messages where configured.
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Email delivery</CardTitle>
          <CardDescription>
            {isStudent
              ? "Includes portal open/close notices, admin announcements (when emailed), and letter approval messages sent to your registered email."
              : "Account and system emails sent to your staff email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <PrefRow
            id="email-notifications"
            label="Email notifications"
            description="When off, we still record in-app alerts in your inbox; time-sensitive emails may be limited."
            checked={notifications.emailNotifications}
            onCheckedChange={() => onToggle("emailNotifications")}
            disabled={isLoadingPrefs}
          />
        </CardContent>
      </Card>

      {isStudent && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                Portal &amp; announcements
              </CardTitle>
              <CardDescription>
                When the internship request portal opens or closes, and when administrators publish notices
                for students on the dashboard or homepage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <PrefRow
                id="announcements"
                label="Portal status & announcements"
                description="Portal open/closed alerts; new notices targeted to students or all users (in-app, and by email if enabled above)."
                checked={notifications.newInternships}
                onCheckedChange={() => onToggle("newInternships")}
                disabled={isLoadingPrefs}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Stage 1 — Internship letters
              </CardTitle>
              <CardDescription>
                General internship letters and company-specific letter requests reviewed by your department
                (HOD/Secretary).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <PrefRow
                id="letter-updates"
                label="Letter request decisions"
                description="Approved, rejected, or changes requested on your letter requests; when an approved company letter is emailed to the organisation."
                checked={notifications.letterRequestUpdates}
                onCheckedChange={() => onToggle("letterRequestUpdates")}
                disabled={isLoadingPrefs}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Stage 2 — Official placement
              </CardTitle>
              <CardDescription>
                After Stage 1 approval, you register your host organisation for the official placement
                letter and evaluation workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex items-start justify-between gap-4 py-1">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="placement-updates" className="text-sm font-medium leading-snug">
                    Official placement updates
                  </Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Placement approved, rejected, or changes requested; confirmation when the official
                    letter and evaluation link are sent to your host organisation.
                  </p>
                </div>
                <Switch
                  id="placement-updates"
                  checked={notifications.letterRequestUpdates}
                  onCheckedChange={() => onToggle("letterRequestUpdates")}
                  disabled={isLoadingPrefs}
                />
              </div>
              <p className="pb-4 text-xs text-muted-foreground">
                Uses the same preference as Stage 1 letter updates in your saved settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Internship listings
              </CardTitle>
              <CardDescription>
                Applications you submit to internship opportunities posted on the portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <PrefRow
                id="application-updates"
                label="Application status changes"
                description="When an administrator updates the status of your internship listing application (e.g. pending, under review, approved, rejected)."
                checked={notifications.applicationUpdates}
                onCheckedChange={() => onToggle("applicationUpdates")}
                disabled={isLoadingPrefs}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Logbook &amp; evaluations
              </CardTitle>
              <CardDescription>
                Weekly log sheet book and supervisor evaluation reminders during your placement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <PrefRow
                id="evaluation-updates"
                label="Logbook & evaluation activity"
                description="When your weekly logbook is ready for institutional review; supervisor evaluation links and follow-up reminders near the end of placement."
                checked={notifications.evaluationUpdates}
                onCheckedChange={() => onToggle("evaluationUpdates")}
                disabled={isLoadingPrefs}
              />
              <div className="flex items-start justify-between gap-4 pt-1">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="deadline-reminders" className="text-sm font-medium leading-snug">
                    Deadline reminders
                  </Label>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reminders when logbook or report deadlines are approaching or overdue (if scheduled by
                    the system).
                  </p>
                </div>
                <Switch
                  id="deadline-reminders"
                  checked={notifications.deadlineReminders}
                  onCheckedChange={() => onToggle("deadlineReminders")}
                  disabled={isLoadingPrefs}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isStaff && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Department — student requests
              </CardTitle>
              <CardDescription>
                Activity for students in your department (or institution-wide for administrators).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <PrefRow
                id="staff-letter-placement"
                label="Letter & official placement requests"
                description="New Stage 1 letter requests; new Stage 2 official placement submissions; student decision outcomes you need to act on; admin escalations when a HOD has decided."
                checked={notifications.letterRequestUpdates}
                onCheckedChange={() => onToggle("letterRequestUpdates")}
                disabled={isLoadingPrefs}
              />
              <PrefRow
                id="staff-logbook"
                label="Weekly logbook ready for review"
                description="When a student’s log sheet book has been acknowledged by the supervisor and is ready for your review."
                checked={notifications.evaluationUpdates}
                onCheckedChange={() => onToggle("evaluationUpdates")}
                disabled={isLoadingPrefs}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                Notices you publish
              </CardTitle>
              <CardDescription>
                Confirmation when you create a notice (in-app). Student-facing notices also notify recipients
                per audience rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              <PrefRow
                id="staff-announcements"
                label="Notice & announcement activity"
                description="Alerts related to notices and broad announcements (in-app)."
                checked={notifications.newInternships}
                onCheckedChange={() => onToggle("newInternships")}
                disabled={isLoadingPrefs}
              />
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={inboxPath}>
            <Bell className="mr-2 h-4 w-4" />
            Open notifications inbox
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button onClick={onSave} disabled={isSaving || isLoadingPrefs}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save notification preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
