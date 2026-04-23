import { redirect } from "next/navigation";

/**
 * The Applications review page was removed. Old links and bookmarks redirect here.
 */
export default function AdminApplicationsRedirect() {
  redirect("/admin");
}
