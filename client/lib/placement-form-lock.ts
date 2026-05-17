import type { InternshipPlacement } from "@/types";

export type PlacementFormLockReason =
  | "approved_active"
  | "pending_review"
  | "modification_requested"
  | "weekly_logbook_submitted";

export type PlacementFormLockState = {
  locked: boolean;
  reason?: PlacementFormLockReason;
  placement?: InternshipPlacement;
  unlockAfter?: string;
};

export type PlacementFormLockContext = {
  portalIsOpen?: boolean;
  portalUpdatedAt?: string;
};

function endOfPlacementDay(dateStr: string): Date {
  const end = new Date(dateStr);
  if (Number.isNaN(end.getTime())) return new Date(0);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** True while an approved placement is in effect (locks Stage 2 from new submissions). */
export function isApprovedPlacementInternshipActive(placement: InternshipPlacement): boolean {
  if (placement.status !== "approved") return false;
  if (!placement.internshipEndDate) return true;
  return Date.now() <= endOfPlacementDay(placement.internshipEndDate).getTime();
}

const BLOCKING_PLACEMENT_STATUSES = ["pending", "modification_requested"] as const;
const FINAL_WEEKLY_LOGBOOK_STATUSES = [
  "submitted_final",
  "supervisor_reviewed",
  "hod_approved",
] as const;

function isPortalOpenAfter(
  context: PlacementFormLockContext | undefined,
  timestamp: string
): boolean {
  if (!context?.portalIsOpen || !context.portalUpdatedAt) return false;
  const portalOpenedAt = new Date(context.portalUpdatedAt).getTime();
  const lockedAt = new Date(timestamp).getTime();
  return !Number.isNaN(portalOpenedAt) && !Number.isNaN(lockedAt) && portalOpenedAt > lockedAt;
}

function hasFinalWeeklyLogbookSubmission(placement: InternshipPlacement): boolean {
  return Boolean(
    placement.weeklyLogbookStatus &&
      FINAL_WEEKLY_LOGBOOK_STATUSES.includes(
        placement.weeklyLogbookStatus as (typeof FINAL_WEEKLY_LOGBOOK_STATUSES)[number]
      ) &&
      placement.weeklyLogbookFinalizedAt
  );
}

function isWeeklyLogbookSubmissionLockActive(
  placement: InternshipPlacement,
  context?: PlacementFormLockContext
): boolean {
  if (!hasFinalWeeklyLogbookSubmission(placement) || !placement.weeklyLogbookFinalizedAt) return false;
  return !isPortalOpenAfter(context, placement.weeklyLogbookFinalizedAt);
}

function isWeeklyLogbookSubmissionClearedByPortal(
  placement: InternshipPlacement,
  context?: PlacementFormLockContext
): boolean {
  return (
    hasFinalWeeklyLogbookSubmission(placement) &&
    Boolean(placement.weeklyLogbookFinalizedAt) &&
    isPortalOpenAfter(context, placement.weeklyLogbookFinalizedAt as string)
  );
}

export function getPlacementFormLockState(
  placements: InternshipPlacement[],
  context?: PlacementFormLockContext
): PlacementFormLockState {
  const awaitingReview = placements.find((p) =>
    BLOCKING_PLACEMENT_STATUSES.includes(
      p.status as (typeof BLOCKING_PLACEMENT_STATUSES)[number]
    )
  );
  if (awaitingReview) {
    return {
      locked: true,
      reason:
        awaitingReview.status === "modification_requested"
          ? "modification_requested"
          : "pending_review",
      placement: awaitingReview,
    };
  }

  const submittedLogbookPlacement = placements.find((p) =>
    isWeeklyLogbookSubmissionLockActive(p, context)
  );
  if (submittedLogbookPlacement) {
    return {
      locked: true,
      reason: "weekly_logbook_submitted",
      placement: submittedLogbookPlacement,
    };
  }

  const activeApproved = placements.find(
    (p) =>
      isApprovedPlacementInternshipActive(p) &&
      !isWeeklyLogbookSubmissionClearedByPortal(p, context)
  );
  if (activeApproved) {
    return {
      locked: true,
      reason: "approved_active",
      placement: activeApproved,
      unlockAfter: activeApproved.internshipEndDate,
    };
  }

  return { locked: false };
}

export function formatPlacementLockDate(dateStr?: string) {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
