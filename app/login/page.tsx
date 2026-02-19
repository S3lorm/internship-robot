"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Anchor, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import type { LoginFormData } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login(formData);

    if (result.success) {
      // Check user role and redirect accordingly
      const storedUser = localStorage.getItem("rmu_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === "admin") {
          router.push("/admin");
        } else {
          // TEMPORARILY DISABLED: Email verification check for testing
          // if (user.isEmailVerified) {
          //   router.push("/dashboard");
          // } else {
          //   router.push("/verify-email");
          // }
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
    } else {
      // TEMPORARILY DISABLED: Email verification redirect for testing
      // If verification is required, redirect to verification page
      // if ((result as any).requiresVerification) {
      //   router.push("/verify-email");
      //   return;
      // }
      setError(result.error || "Login failed. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 transition-transform hover:scale-105">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
          <Anchor className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none text-foreground">RMU</span>
          <span className="text-xs text-muted-foreground">Internship Portal</span>
        </div>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.name@st.rmu.edu.gh"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardContent>
        </form>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </div>

          <div className="rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
            <p className="font-medium">Demo Credentials</p>
            <p className="mt-1">
              Student: student@st.rmu.edu.gh / password123
            </p>
            <p>Admin: admin@rmu.edu.gh / Admin@2024</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
