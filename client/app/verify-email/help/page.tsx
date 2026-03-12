"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export default function VerificationHelpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Email Verification Help
          </CardTitle>
          <CardDescription>
            Troubleshooting guide for email verification issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you haven't received your verification email, follow these steps:
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                1. Check Your Spam/Junk Folder
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                Verification emails sometimes end up in spam folders. Check your spam or junk mail folder for an email from "RMU Internship Portal".
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                2. Wait a Few Minutes
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                Email delivery can take a few minutes. Please wait 5-10 minutes before requesting a new verification email.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                3. Verify Your Email Address
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                Make sure you registered with the correct email address. For students, it must be an @st.rmu.edu.gh email address.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                4. Resend Verification Email
              </h3>
              <p className="text-sm text-muted-foreground ml-6 mb-2">
                Go back to the verification page and click "Resend Verification Email". Make sure you're logged in first.
              </p>
              <Button asChild variant="outline" className="ml-6">
                <Link href="/verify-email">
                  <Mail className="mr-2 h-4 w-4" />
                  Go to Verification Page
                </Link>
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                5. Check Email Filters
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                Some email providers have filters that block automated emails. Check if your email provider has any filters or rules that might be blocking the verification email.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                6. Contact Support
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                If you've tried all the above steps and still haven't received the verification email after 24 hours, please contact the IT support team at your institution.
              </p>
            </div>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Verification links expire after 24 hours. If your link has expired, you can request a new verification email from the verification page.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/verify-email">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Verification
              </Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
