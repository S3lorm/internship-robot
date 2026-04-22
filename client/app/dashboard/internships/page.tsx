"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Construction, ArrowLeft } from "lucide-react";

export default function InternshipsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Construction className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Briefcase className="h-6 w-6" />
            Internships
          </CardTitle>
          <CardDescription className="text-base">
            The internships directory is not available yet. This page is a preview only: listings,
            search, and applications are disabled until the next release.
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
