"use client";

import { useAuth } from "@/contexts/auth-context";
import HOD from "./HOD";
import { AdminDashboardContent } from "./admin-dashboard-content";

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role === "hod") {
    return <HOD />;
  }

  return <AdminDashboardContent />;
}
