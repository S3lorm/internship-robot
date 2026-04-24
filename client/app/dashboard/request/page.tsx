import { redirect } from "next/navigation";

/** Legacy URL: placement request form was removed from the student dashboard. */
export default function DashboardRequestRedirectPage() {
  redirect("/dashboard/letter-requests");
}
