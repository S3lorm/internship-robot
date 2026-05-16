"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InternshipPortalPayload } from "@/lib/internship-portal";

type Props = {
  portal: InternshipPortalPayload;
  loading?: boolean;
  className?: string;
};

export function PortalStatusBanner({ portal, loading, className }: Props) {
  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking internship portal status…
      </div>
    );
  }

  if (portal.isOpen) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-900 shadow-sm",
          className
        )}
        role="status"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
        <p className="text-sm font-medium">{portal.openMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 shadow-sm",
        className
      )}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
      <p className="text-sm font-medium">{portal.closedMessage}</p>
    </div>
  );
}
