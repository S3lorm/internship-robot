"use client";

import React from "react"

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { internshipsApi, applicationsApi } from "@/lib/api";
import type { Internship, Application } from "@/types";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Users,
  Building2,
  Briefcase,
  CheckCircle2,
  Upload,
  Loader2,
  FileText,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function InternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [internship, setInternship] = useState<Internship | null>(null);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id, user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch internship
      const internshipResult = await internshipsApi.getById(id);
      if (internshipResult.error) {
        throw new Error(internshipResult.error);
      }
      const int = internshipResult.data?.internship || internshipResult.data;
      setInternship(int);

      // Fetch user's applications to check if already applied
      if (user?.id) {
        const appsResult = await applicationsApi.getMyApplications();
        if (!appsResult.error && appsResult.data) {
          const apps = Array.isArray(appsResult.data?.data)
            ? appsResult.data.data
            : Array.isArray(appsResult.data?.applications)
            ? appsResult.data.applications
            : Array.isArray(appsResult.data)
            ? appsResult.data
            : [];
          const existing = apps.find((a: Application) => a.internshipId === id);
          setExistingApplication(existing || null);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load internship");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">Internship not found</h3>
            <p className="text-muted-foreground">
              {error || "The internship you're looking for doesn't exist or has been removed."}
            </p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/dashboard/internships">Browse all internships</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deadline = internship.applicationDeadline ? new Date(internship.applicationDeadline) : null;
  const startDate = internship.startDate ? new Date(internship.startDate) : null;
  const isDeadlinePassed = deadline ? deadline < new Date() : false;
  const slotsRemaining = Math.max(0, (internship.slots || 0) - (internship.applicationsCount || 0));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setCvFile(file);
    }
  };

  const handleApply = async () => {
    if (!coverLetter.trim()) {
      toast.error("Please write a cover letter");
      return;
    }
    if (!cvFile) {
      toast.error("Please upload your CV");
      return;
    }

    setIsApplying(true);

    try {
      const formData = new FormData();
      formData.append("internshipId", id);
      formData.append("coverLetter", coverLetter);
      formData.append("cv", cvFile);

      const result = await applicationsApi.create(formData);
      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Application submitted successfully!");
      setDialogOpen(false);
      router.push("/dashboard/applications");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Internships
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-start gap-2">
                <Badge variant="secondary">{internship.category}</Badge>
                {internship.isRemote && <Badge variant="outline">Remote</Badge>}
                {isDeadlinePassed && (
                  <Badge variant="destructive">Applications Closed</Badge>
                )}
              </div>

              <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                {internship.title}
              </h1>

              <div className="mb-4 flex items-center gap-2 text-lg text-muted-foreground">
                <Building2 className="h-5 w-5" />
                <span className="font-medium">{internship.company}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {internship.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {internship.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {slotsRemaining} of {internship.slots} slots available
                </span>
              </div>

              {internship.stipend && (
                <p className="mt-4 text-lg font-semibold text-primary">
                  {internship.stipend}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Internship</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {internship.description}
              </p>
            </CardContent>
          </Card>

          {/* Requirements */}
          {internship.requirements && internship.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {internship.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Responsibilities */}
          {internship.responsibilities && internship.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {internship.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Card */}
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {deadline && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Deadline</span>
                      <span className="font-medium">
                        {deadline.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {startDate && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Start Date</span>
                      <span className="font-medium">
                        {startDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{internship.duration}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Applications</span>
                  <span className="font-medium">{internship.applicationsCount || 0}</span>
                </div>
              </div>

              {existingApplication ? (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-600" />
                  <p className="font-medium">Already Applied</p>
                  <p className="text-sm text-muted-foreground">
                    Status:{" "}
                    <span className="capitalize">
                      {existingApplication.status.replace("_", " ")}
                    </span>
                  </p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/dashboard/applications">
                      View Application
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ) : isDeadlinePassed ? (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Applications Closed</p>
                  <p className="text-sm text-muted-foreground">
                    The deadline for this internship has passed.
                  </p>
                </div>
              ) : slotsRemaining === 0 ? (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">No Slots Available</p>
                  <p className="text-sm text-muted-foreground">
                    All positions have been filled.
                  </p>
                </div>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Apply for {internship.title}</DialogTitle>
                      <DialogDescription>
                        Submit your application for this internship at{" "}
                        {internship.company}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">
                          Cover Letter <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="coverLetter"
                          placeholder="Write a brief cover letter explaining why you're interested in this position and what makes you a good fit..."
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum 100 characters. Be specific about your skills
                          and experiences.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cv">
                          Upload CV <span className="text-destructive">*</span>
                        </Label>
                        <div className="rounded-lg border border-dashed border-border p-4">
                          {cvFile ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">
                                  {cvFile.name}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCvFile(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <label
                              htmlFor="cv"
                              className="flex cursor-pointer flex-col items-center gap-2"
                            >
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Click to upload or drag and drop
                              </span>
                              <span className="text-xs text-muted-foreground">
                                PDF only, max 5MB
                              </span>
                              <Input
                                id="cv"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={isApplying}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleApply} disabled={isApplying}>
                        {isApplying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About {internship.company}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {internship.company} is one of our valued partner organizations
                offering internship opportunities to RMU students.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
