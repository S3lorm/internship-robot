"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Anchor, Mail, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');
        const res = await authApi.forgotPassword(email);
        setIsLoading(false);
        if (res.error) {
            setError(res.error);
            return;
        }
        setOtpSent(true);
        setMessage('We\'ve sent a 6-digit code to your email. Use the button below to enter it and set a new password.');
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
                    <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {message && (
                            <Alert className="border-success/50 bg-success/10 text-foreground">
                                <CheckCircle2 className="h-4 w-4 text-success" />
                                <AlertDescription>{message}</AlertDescription>
                            </Alert>
                        )}

                        {!otpSent ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            id="email"
                                            placeholder="your.name@st.rmu.edu.gh"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send OTP to email'}
                                </Button>
                            </>
                        ) : (
                            <Button asChild className="w-full">
                                <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
                                    Enter OTP and reset password
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </form>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm text-muted-foreground">
                        Remember your password?{' '}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;