"use client";

import { useCallback, useEffect, useState } from "react";
import { portalApi } from "@/lib/api";
import type { InternshipPortalPayload } from "@/lib/internship-portal";
import { PORTAL_CLOSED_MESSAGE, PORTAL_OPEN_MESSAGE } from "@/lib/internship-portal";

const defaultPayload: InternshipPortalPayload = {
  status: "open",
  isOpen: true,
  closedMessage: PORTAL_CLOSED_MESSAGE,
  openMessage: PORTAL_OPEN_MESSAGE,
};

export function usePortalStatus() {
  const [portal, setPortal] = useState<InternshipPortalPayload>(defaultPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await portalApi.getStatus();
    if (result.error) {
      setError(result.error);
      setPortal(defaultPayload);
    } else {
      const data = (result.data as { data?: InternshipPortalPayload })?.data ?? result.data;
      if (data && typeof data === "object" && "isOpen" in data) {
        setPortal(data as InternshipPortalPayload);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { portal, loading, error, refresh, isOpen: portal.isOpen };
}
