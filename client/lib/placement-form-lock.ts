import type { InternshipPlacement } from "@/types";

export type PlacementFormLockReason =
  | "approved_active"
  | "pending_review"
  | "modification_requested";

export type PlacementFormLockState = {
  locked: boolean;
  reason?: PlacementFormLockReason;
  placement?: InternshipPlacement;
  unlockAfter?: string;
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

export function getPlacementFormLockState(
  placements: InternshipPlacement[]
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

  const activeApproved = placements.find((p) => isApprovedPlacementInternshipActive(p));
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
