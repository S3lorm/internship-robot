export const PORTAL_CLOSED_MESSAGE =
  "Internship request portal is currently closed due to ongoing semester activities.";

export const PORTAL_OPEN_MESSAGE = "Internship request portal is currently open.";

export type InternshipPortalStatus = "open" | "closed";

export type InternshipPortalPayload = {
  status: InternshipPortalStatus;
  isOpen: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
  closedMessage: string;
  openMessage: string;
};
