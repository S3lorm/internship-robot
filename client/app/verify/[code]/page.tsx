"use client";

import { useParams } from "next/navigation";
import { DocumentVerificationView } from "@/components/document-verification-view";

export default function VerifyByCodePage() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";

  return <DocumentVerificationView initialCode={code} autoVerify />;
}
