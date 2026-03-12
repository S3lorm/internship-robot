"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { remindersApi } from "@/lib/api";
import {
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DeadlineItem {
  id: string;
  title: string;
  submissionDeadline?: string;
  dueDate?: string;
  status?: string;
  type: "logbook" | "report" | "administrative_action";
}

export function DeadlinesWidget() {
  const [upcoming, setUpcoming] = useState<{
    logbooks: DeadlineItem[];
    reports: DeadlineItem[];
    administrativeActions: DeadlineItem[];
  }>({ logbooks: [], reports: [], administrativeActions: [] });
  const [overdue, setOverdue] = useState<{
    logbooks: DeadlineItem[];
    reports: DeadlineItem[];
    administrativeActions: DeadlineItem[];
  }>({ logbooks: [], reports: [], administrativeActions: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    try {
      const [upcomingResult, overdueResult] = await Promise.all([
        remindersApi.getUpcomingDeadlines(),
        remindersApi.getOverdueItems(),
      ]);

      if (upcomingResult.data) {
        setUpcoming({
          logbooks: (upcomingResult.data.logbooks || []).map((l: any) => ({
            ...l,
            type: "logbook" as const,
          })),
          reports: (upcomingResult.data.reports || []).map((r: any) => ({
            ...r,
            type: "report" as const,
          })),
          administrativeActions: (upcomingResult.data.administrativeActions || []).map((a: any) => ({
            ...a,
            type: "administrative_action" as const,
          })),
        });
      }

      if (overdueResult.data) {
        setOverdue({
          logbooks: (overdueResult.data.logbooks || []).map((l: any) => ({
            ...l,
            type: "logbook" as const,
          })),
          reports: (overdueResult.data.reports || []).map((r: any) => ({
            ...r,
            type: "report" as const,
          })),
          administrativeActions: (overdueResult.data.administrativeActions || []).map((a: any) => ({
            ...a,
            type: "administrative_action" as const,
          })),
        });
      }
    } catch (error) {
      console.error("Error loading deadlines:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const allUpcoming = [
    ...upcoming.logbooks,
    ...upcoming.reports,
    ...upcoming.administrativeActions,
  ].sort((a, b) => {
    const dateA = new Date(a.submissionDeadline || a.dueDate || 0);
    const dateB = new Date(b.submissionDeadline || b.dueDate || 0);
    return dateA.getTime() - dateB.getTime();
  });

  const allOverdue = [
    ...overdue.logbooks,
    ...overdue.reports,
    ...overdue.administrativeActions,
  ];

  const getItemLink = (item: DeadlineItem) => {
    switch (item.type) {
      case "logbook":
        return `/dashboard/logbooks/${item.id}`;
      case "report":
        return `/dashboard/reports/${item.id}`;
      case "administrative_action":
        return `/dashboard/actions/${item.id}`;
      default:
        return "#";
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "logbook":
        return <FileText className="h-4 w-4" />;
      case "report":
        return <ClipboardList className="h-4 w-4" />;
      case "administrative_action":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Deadlines & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue Items */}
      {allOverdue.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Overdue Items ({allOverdue.length})
            </CardTitle>
            <CardDescription className="text-red-700">
              These items require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allOverdue.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={getItemLink(item)}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-3 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-red-600">{getItemIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === "administrative_action" ? "Administrative Action" : 
                         item.type === "logbook" ? "Logbook" : "Report"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="ml-2 shrink-0">
                    Overdue
                  </Badge>
                </Link>
              ))}
              {allOverdue.length > 5 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/notifications?filter=overdue">
                    View all {allOverdue.length} overdue items
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Deadlines ({allUpcoming.length})
          </CardTitle>
          <CardDescription>
            Items due within the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allUpcoming.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <p className="text-muted-foreground">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allUpcoming.slice(0, 5).map((item) => {
                const deadline = new Date(item.submissionDeadline || item.dueDate || "");
                const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= 1;

                return (
                  <Link
                    key={item.id}
                    href={getItemLink(item)}
                    className={`flex items-center justify-between rounded-lg border p-3 hover:bg-muted transition-colors ${
                      isUrgent ? "border-amber-200 bg-amber-50/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={isUrgent ? "text-amber-600" : "text-primary"}>
                        {getItemIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(deadline, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isUrgent ? "destructive" : "secondary"}
                      className="ml-2 shrink-0"
                    >
                      {daysUntil === 0 ? "Today" : `${daysUntil}d left`}
                    </Badge>
                  </Link>
                );
              })}
              {allUpcoming.length > 5 && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/notifications?filter=upcoming">
                    View all {allUpcoming.length} upcoming items
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

