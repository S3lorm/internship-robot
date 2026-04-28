"use client";

import React from "react";

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
import { Home, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import Image from "next/image";
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
      const storedUser = localStorage.getItem("rmu_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === "admin" || user.role === "hod") {
          router.push("/admin");
        } else {
          if (user.isEmailVerified) {
            router.push("/dashboard");
          } else {
            router.push("/verify-email");
          }
        }
      } else {
        router.push("/dashboard");
      }
    } else {
      if ((result as { requiresVerification?: boolean }).requiresVerification) {
        router.push("/verify-email");
        return;
      }
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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="absolute left-4 top-4 z-20">
        <Button variant="secondary" size="sm" className="gap-2 bg-background/90 shadow-md backdrop-blur-sm" asChild>
          <Link href="/" aria-label="Go to home page">
            <Home className="h-4 w-4" />
            Home
          </Link>
        </Button>
      </div>
      <div className="absolute inset-0 -z-10">
        <Image
          src="/assets/rmu-campus.jpg"
          alt="RMU Campus"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <Link href="/" className="mb-8 flex items-center gap-2 transition-transform hover:scale-105">
        <div className="flex h-16 w-[210px] items-center justify-center p-1.5">
          <Image
            src="/rmu-logo.png"
            alt="RMU Logo"
            width={260}
            height={84}
            className="h-full w-full object-contain contrast-[1.2] drop-shadow-[0_6px_18px_rgba(0,0,0,0.42)] motion-safe:animate-[pulse_3.6s_ease-in-out_infinite]"
            priority
          />
        </div>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in with your role account (student, HOD, secutuary, admin)</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="your.email@rmu.edu.gh"
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
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
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
          </form>
        </CardContent>

        <CardFooter className="flex flex-col">
          <div className="w-full text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
