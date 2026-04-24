"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import InternshipRequestForm from "@/components/internshipRequestForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function RequestPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user?.id) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit gap-2 px-0" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Internship placement request
        </h1>
        <p className="text-muted-foreground">
          Request a letter or placement consideration for a specific company. Your submissions appear on the dashboard under recent placement requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
          <CardDescription>
            All fields are required. Use accurate contact details so the office can follow up if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InternshipRequestForm studentId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
