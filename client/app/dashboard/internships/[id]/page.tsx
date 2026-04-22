"use client";

import Link from "next/link";
import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft, Briefcase } from "lucide-react";

export default function InternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/dashboard/internships">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Construction className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Briefcase className="h-6 w-6" />
            Internship detail
          </CardTitle>
          <CardDescription className="text-base">
            Reference <span className="font-mono text-foreground">{id}</span> — viewing and applying
            are disabled. This area will open in a future upgrade.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button disabled variant="secondary">
            Coming soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
