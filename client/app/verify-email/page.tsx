"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  Mail,
  AlertCircle,
  Loader2,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, verifyEmail, resendVerification } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailFromQuery = searchParams.get("email");
  const [verificationEmail, setVerificationEmail] = useState(() => emailFromQuery || "");
  const [verificationCode, setVerificationCode] = useState("");

  const token = searchParams.get("token");
  const displayEmail = user?.email || emailFromQuery || verificationEmail.trim();

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (user?.isEmailVerified) {
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (emailFromQuery) setVerificationEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (user?.email) {
      setVerificationEmail((prev) => (prev.trim() ? prev : user.email!));
    }
  }, [user?.email]);

  const handleVerifyWithToken = async (verifyToken?: string) => {
    const tokenToUse = verifyToken || token;
    if (!tokenToUse) {
      setError("No verification token provided");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setMessage(null);

    const result = await verifyEmail({ token: tokenToUse });
    setIsVerifying(false);

    if (result.success) {
      setMessage("Email verified successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push(user?.role === "admin" ? "/admin" : "/dashboard");
      }, 2000);
    } else {
      setError(result.error || "Verification failed. Please try again.");
    }
  };

  useEffect(() => {
    if (!token) return;
    const key = `rmu_email_verify_attempt_${token}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    void handleVerifyWithToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-run once per token in URL
  }, [token]);

  const handleVerifyWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = verificationEmail.trim().toLowerCase();
    const code = verificationCode.replace(/\D/g, "").slice(0, 6);

    setError(null);
    setMessage(null);
    if (!email) {
      setError("Enter your student email address.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setIsVerifying(true);
    const result = await verifyEmail({ email, code });
    setIsVerifying(false);
    if (result.success) {
      setMessage("Email verified successfully! You can sign in now.");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(result.error || "Verification failed. Please try again.");
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setMessage(null);

    const target = verificationEmail.trim() || user?.email;
    const result = await resendVerification(target || undefined);
    setIsResending(false);

    if (result.success) {
      setMessage("Verification email sent! Please check your inbox.");
    } else {
      setError(result.error || "Failed to resend verification email.");
    }
  };

  if (user?.isEmailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h2 className="text-xl font-semibold">Email Already Verified</h2>
              <p className="text-muted-foreground">
                Your email has already been verified.
              </p>
              <Button asChild>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verify Your Email
          </CardTitle>
          <CardDescription>
            Please verify your email address to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              We've sent a verification email to{" "}
              {displayEmail ? <strong>{displayEmail}</strong> : "your email address"}
            </p>
            <p>
              Click the link in the email to verify your account. The link will
              expire in 24 hours. Your email may also include a <strong>6-digit code</strong> you can use below instead of the link.
            </p>

            <form onSubmit={handleVerifyWithCode} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">Verify with email + code (optional)</p>
                <div className="space-y-2">
                  <Label htmlFor="verify-email-input">Student email</Label>
                  <Input
                    id="verify-email-input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@st.rmu.edu.gh"
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    disabled={isVerifying}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verify-code-input">6-digit code</Label>
                  <Input
                    id="verify-code-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    className="font-mono text-lg tracking-[0.35em]"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isVerifying}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify with code"
                  )}
                </Button>
              </form>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs">
              <p className="font-semibold text-blue-900 mb-1">Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Check your spam/junk folder</li>
                <li>Wait a few minutes - emails can be delayed</li>
                <li>Click "Resend Verification Email" below</li>
                <li>Make sure you entered the correct email address</li>
              </ul>
            </div>
          </div>

          {token && (
            <Button
              onClick={() => void handleVerifyWithToken()}
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify Email
                </>
              )}
            </Button>
          )}

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={isResending || !(verificationEmail.trim() || user?.email)}
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" asChild className="flex-1">
                <Link href="/verify-email/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Need Help?
                </Link>
              </Button>
              <Button variant="ghost" asChild className="flex-1">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
