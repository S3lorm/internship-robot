"use client";

import { useState, FormEvent } from "react";
import { submitInternshipRequest } from "@/lib/request";
import { InternshipRequestInput } from "@/types/internship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  studentId: string;
}

export default function InternshipRequestForm({ studentId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;

    const formData: InternshipRequestInput = {
      companyName: (form.elements.namedItem("company_name") as HTMLInputElement).value.trim(),
      companyContact: (form.elements.namedItem("company_contact") as HTMLInputElement).value.trim(),
      internshipPeriod: (form.elements.namedItem("internship_period") as HTMLInputElement).value.trim(),
      purpose: (form.elements.namedItem("purpose") as HTMLTextAreaElement).value.trim(),
    };

    try {
      await submitInternshipRequest(formData, studentId);
      toast.success("Placement request submitted.");
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company_name">Company name</Label>
        <Input id="company_name" name="company_name" placeholder="e.g. Ghana Ports and Harbours Authority" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_contact">Company contact</Label>
        <Input
          id="company_contact"
          name="company_contact"
          placeholder="Email or phone"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="internship_period">Internship period</Label>
        <Input
          id="internship_period"
          name="internship_period"
          placeholder="e.g. June–August 2026"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose / notes</Label>
        <Textarea
          id="purpose"
          name="purpose"
          placeholder="Briefly describe what you are requesting and any relevant context."
          rows={4}
          required
          className="resize-y min-h-[100px]"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit request"
        )}
      </Button>
    </form>
  );
}
