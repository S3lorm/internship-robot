"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  FileText,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { lettersApi } from "@/lib/api";
import { internshipsApi } from "@/lib/api";
import type { Internship } from "@/types";

export default function LetterPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [selectedInternship, setSelectedInternship] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterHtml, setLetterHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingInternships, setIsLoadingInternships] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!authLoading && isAuthenticated && user?.role !== "student") {
      router.push("/dashboard");
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "student") {
      loadInternships();
    }
  }, [isAuthenticated, user]);

  const loadInternships = async () => {
    setIsLoadingInternships(true);
    try {
      const result = await internshipsApi.getAll();
      if (result.data) {
        // Ensure result.data is an array
        const internshipsList = Array.isArray(result.data) ? result.data : [];
        setInternships(internshipsList);
      } else {
        setInternships([]);
      }
    } catch (err) {
      console.error("Failed to load internships:", err);
      setInternships([]); // Set to empty array on error
    } finally {
      setIsLoadingInternships(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setLetterHtml(null);

    try {
      // Use undefined if "none" is selected, otherwise use the internship ID
      const internshipId = selectedInternship === "none" ? undefined : selectedInternship || undefined;
      const html = await lettersApi.generate(internshipId);
      setLetterHtml(html);
    } catch (err: any) {
      setError(err.message || "Failed to generate letter");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Use undefined if "none" is selected, otherwise use the internship ID
      const internshipId = selectedInternship === "none" ? undefined : selectedInternship || undefined;
      await lettersApi.download(internshipId, "html");
    } catch (err: any) {
      setError(err.message || "Failed to download letter");
    }
  };

  const handlePrint = () => {
    if (letterHtml) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(letterHtml);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "student") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Internship Application Letter
        </h1>
        <p className="text-muted-foreground">
          Generate and download your official internship application letter
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generate Letter</CardTitle>
          <CardDescription>
            Select an internship (optional) or generate a general letter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Internship (Optional)
            </label>
            <Select
              value={selectedInternship}
              onValueChange={setSelectedInternship}
              disabled={isLoadingInternships}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an internship or leave blank for general letter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General Letter (No specific internship)</SelectItem>
                {Array.isArray(internships) && internships.length > 0 ? (
                  internships.map((internship) => (
                    <SelectItem key={internship.id} value={internship.id}>
                      {internship.title} - {internship.company}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-internships" disabled>
                    No internships available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              If you select an internship, the letter will include specific details about that position.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Letter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {letterHtml && (
        <Card>
          <CardHeader>
            <CardTitle>Your Letter</CardTitle>
            <CardDescription>
              Review your letter and download or print it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download HTML
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print / Save as PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newWindow = window.open("", "_blank");
                  if (newWindow) {
                    newWindow.document.write(letterHtml);
                    newWindow.document.close();
                  }
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <div
                dangerouslySetInnerHTML={{ __html: letterHtml }}
                className="letter-preview"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <p>
              The letter includes your personal information, program details, and an official recommendation from your department.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <p>
              If you select an internship, the letter will be customized with that internship's details.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <p>
              To print as PDF: Click "Print / Save as PDF" and select "Save as PDF" as the destination.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            <p>
              The letter includes the official signature of your department head.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
