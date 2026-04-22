"use client";

import React from "react"

import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { programs } from "@/lib/mock-data";
import type { RegisterFormData } from "@/types";
import { cn } from "@/lib/utils";

const registrationDepartments = [
  "Nautical Science",
  "Marine Engineering",
  "Computer Science",
  "Information Technology",
];

const departmentIdPrefixes: Record<string, string[]> = {
  "Nautical Science": ["DNS", "BNS"],
  "Marine Engineering": ["DMS", "BMS"],
  "Computer Science": ["DCS", "BCS"],
  "Information Technology": ["BIT", "DIT"],
};

function validateStudentIdByDepartment(department: string, studentId: string): string | null {
  const prefixes = departmentIdPrefixes[department];
  if (!department || !studentId.trim() || !prefixes) return null;

  const normalizedId = studentId.toUpperCase().replace(/\s+/g, "");
  const hasValidFormat = prefixes.some((prefix) =>
    new RegExp(`^${prefix}(?:[-/]?)\\d{7}$`).test(normalizedId)
  );

  if (hasValidFormat) return null;
  return `Invalid Student ID for ${department}. Use ${prefixes.join("/")} followed by 7 digits (e.g. ${prefixes[0]}1234567).`;
}

function getPasswordStrength(password: string) {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const met = [hasMinLength, hasLower, hasUpper, hasSymbol].filter(Boolean).length;
  const score = Math.round((met / 4) * 100);
  let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  let barColor = "bg-destructive";
  let textColor = "text-destructive";
  if (met === 4) {
    label = "Strong";
    barColor = "bg-green-600";
    textColor = "text-green-700 dark:text-green-500";
  } else if (met === 3) {
    label = "Good";
    barColor = "bg-primary";
    textColor = "text-primary";
  } else if (met === 2) {
    label = "Fair";
    barColor = "bg-amber-500";
    textColor = "text-amber-700 dark:text-amber-500";
  }
  return { hasLower, hasUpper, hasSymbol, hasMinLength, score, label, barColor, textColor };
}

function getPasswordValidationError(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must include at least one symbol (e.g. !@#$%).";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    studentId: "",
    department: "",
    program: "",
    yearOfStudy: 1,
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const studentIdError = validateStudentIdByDepartment(
    formData.department,
    formData.studentId
  );
  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = getPasswordValidationError(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate email domain
    if (!formData.email.toLowerCase().endsWith("@st.rmu.edu.gh")) {
      setError("Please use your RMU student email (@st.rmu.edu.gh)");
      return;
    }

    if (studentIdError) {
      setError(studentIdError);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      setSuccess(true);
      // Redirect to verification page after registration
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }, 3000);
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const normalizedValue = name === "studentId" ? value.toUpperCase() : value;
    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === "yearOfStudy" ? parseInt(value) : value,
    }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (
        !formData.firstName?.trim() ||
        !formData.lastName?.trim() ||
        !formData.department ||
        !formData.studentId?.trim() ||
        !formData.phone?.trim()
      ) {
        setError("Please fill in all personal information fields");
        return;
      }
      if (studentIdError) {
        setError(studentIdError);
        return;
      }
      setError(null);
    }
    if (step === 2) {
      if (!formData.program) {
        setError("Please select your program");
        return;
      }
      setError(null);
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Registration Successful!
            </h2>
            <p className="mb-4 text-muted-foreground">
              We've sent a verification email to your inbox. Please click the link in the email to verify your account before you can access the dashboard.
            </p>
            <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs">
              <p className="font-semibold text-blue-900 mb-1">Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Check your spam/junk folder</li>
                <li>Wait a few minutes - emails can be delayed</li>
                <li>You can resend it from the verification page</li>
              </ul>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Redirecting to verification page...
            </p>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Background Image */}
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

      <Link href="/" className="mb-8 flex flex-col items-center gap-3 transition-transform hover:scale-105">
        <div className="flex h-16 items-center justify-center rounded-xl bg-white shadow-lg p-3">
          <Image src="/rmu-logo.png" alt="RMU Logo" width={200} height={50} className="object-contain" priority />
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-xl font-bold leading-none text-white drop-shadow-lg">RMU</span>
          <span className="text-sm text-white/80 drop-shadow">Internship Portal</span>
        </div>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            Register with your RMU student email
          </CardDescription>
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {step} of 3:{" "}
            {step === 1
              ? "Personal Information"
              : step === 2
                ? "Academic Information"
                : "Account Details"}
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Mensah"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      handleSelectChange("department", value)
                    }
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {registrationDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    placeholder="e.g. BMS1234567"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                  />
                  {studentIdError && (
                    <p className="text-xs font-medium text-destructive">
                      {studentIdError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Step 2: Academic Information */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Select
                    value={formData.program}
                    onValueChange={(value) =>
                      handleSelectChange("program", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((prog) => (
                        <SelectItem key={prog} value={prog}>
                          {prog}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearOfStudy">Year of Study</Label>
                  <Select
                    value={formData.yearOfStudy.toString()}
                    onValueChange={(value) =>
                      handleSelectChange("yearOfStudy", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 3: Account Details (email & password last) */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Student Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.name@st.rmu.edu.gh"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Only @st.rmu.edu.gh emails are allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use at least 8 characters with uppercase, lowercase, and one symbol.
                  </p>
                  {formData.password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Password strength</span>
                        <span className={cn("font-medium", passwordStrength.textColor)}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            passwordStrength.barColor
                          )}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className={passwordStrength.hasMinLength ? "font-medium text-green-600" : ""}>
                          {passwordStrength.hasMinLength ? "✓" : "○"} At least 8 characters
                        </li>
                        <li className={passwordStrength.hasUpper ? "font-medium text-green-600" : ""}>
                          {passwordStrength.hasUpper ? "✓" : "○"} One uppercase letter
                        </li>
                        <li className={passwordStrength.hasLower ? "font-medium text-green-600" : ""}>
                          {passwordStrength.hasLower ? "✓" : "○"} One lowercase letter
                        </li>
                        <li className={passwordStrength.hasSymbol ? "font-medium text-green-600" : ""}>
                          {passwordStrength.hasSymbol ? "✓" : "○"} One symbol (!@#$%^&*…)
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={prevStep}
                >
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={nextStep}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </form>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
