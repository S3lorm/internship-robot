'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SupervisorInternshipEvaluationSheet,
  type EvaluationFormState,
} from '@/components/supervisor-internship-evaluation-sheet';
import { EVALUATION_RATING_CATEGORIES } from '@/lib/supervisor-evaluation-scoring';

function todayInputDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const shellClass = 'min-h-screen bg-slate-100 px-4 py-8 pb-12 text-black';

function PaperStatusCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="logsheet-paper mx-auto w-full max-w-lg bg-white font-serif text-black shadow-md">
      <div className="border border-black p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">{icon}</div>
        <h1 className="text-lg font-bold uppercase tracking-wide">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-black/75">{description}</p>
      </div>
    </article>
  );
}

function PaperHeader() {
  return (
    <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-center gap-3">
      <Image
        src="/rmu-logo.png"
        alt="Regional Maritime University"
        width={48}
        height={48}
        className="h-12 w-12 object-contain"
      />
      <p className="text-center font-serif text-sm font-bold uppercase tracking-wide text-slate-800">
        Regional Maritime University — Supervisor Evaluation
      </p>
    </div>
  );
}

export default function EvaluatePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<{
    student?: {
      firstName?: string;
      lastName?: string;
      program?: string;
      studentId?: string;
      department?: string;
      yearOfStudy?: number;
    };
    placement?: {
      organizationName?: string;
      internshipStartDate?: string;
      internshipEndDate?: string;
    };
    isSubmitWindowOpen?: boolean;
    daysUntilEnd?: number;
  } | null>(null);

  const [form, setForm] = useState<EvaluationFormState>({
    supervisorName: '',
    supervisorPosition: '',
    supervisorDepartment: '',
    workEthicRating: 0,
    communicationRating: 0,
    technicalSkillsRating: 0,
    teamworkRating: 0,
    punctualityRating: 0,
    problemSolvingRating: 0,
    supervisorComments: '',
    finalRecommendation: '',
    evaluationDate: todayInputDate(),
    certifiedAccurate: false,
  });

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`${API_BASE_URL}/evaluate/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Invalid evaluation link');
        } else {
          setFormData(data);
        }
      } catch {
        setError('Failed to load evaluation form. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadForm();
  }, [token]);

  function setRating(key: string, value: number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData && formData.isSubmitWindowOpen === false) {
      toast.error('Evaluation submission opens in the final two weeks before the internship ends.');
      return;
    }

    const allRated = EVALUATION_RATING_CATEGORIES.every(
      (c) => Number(form[c.key as keyof EvaluationFormState]) > 0
    );
    if (!form.supervisorName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!allRated) {
      toast.error('Please rate all categories');
      return;
    }
    if (!form.finalRecommendation) {
      toast.error('Please select a final recommendation');
      return;
    }
    if (!form.certifiedAccurate) {
      toast.error('Please confirm the declaration before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorName: form.supervisorName,
          supervisorPosition: form.supervisorPosition,
          supervisorDepartment: form.supervisorDepartment,
          workEthicRating: form.workEthicRating,
          communicationRating: form.communicationRating,
          technicalSkillsRating: form.technicalSkillsRating,
          teamworkRating: form.teamworkRating,
          punctualityRating: form.punctualityRating,
          problemSolvingRating: form.problemSolvingRating,
          supervisorComments: form.supervisorComments,
          finalRecommendation: form.finalRecommendation,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Submission failed');
      } else {
        setSuccess(true);
        toast.success('Evaluation submitted successfully!');
      }
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={cn(shellClass, 'flex flex-col items-center justify-center')}>
        <PaperHeader />
        <PaperStatusCard
          title="Loading form"
          description="Please wait while the evaluation form is prepared…"
          icon={<Loader2 className="h-8 w-8 animate-spin text-black" aria-hidden />}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(shellClass, 'flex flex-col items-center justify-center')}>
        <PaperHeader />
        <PaperStatusCard
          title="Link unavailable"
          description={`${error} If you believe this is an error, please contact the university for assistance.`}
          icon={<span className="text-3xl" aria-hidden>⚠</span>}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn(shellClass, 'flex flex-col items-center justify-center')}>
        <PaperHeader />
        <PaperStatusCard
          title="Evaluation submitted"
          description="Thank you for evaluating the student's performance. Your feedback supports their academic development. You may close this page now."
          icon={<span className="text-3xl" aria-hidden>✓</span>}
        />
      </div>
    );
  }

  const submitLocked = Boolean(formData && formData.isSubmitWindowOpen === false);
  const daysLeft =
    typeof formData?.daysUntilEnd === 'number' ? formData.daysUntilEnd : null;

  return (
    <div className={shellClass}>
      <PaperHeader />
      <SupervisorInternshipEvaluationSheet
        student={formData?.student}
        placement={formData?.placement}
        form={form}
        onFormChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onRating={setRating}
        submitLocked={submitLocked}
        submitting={submitting}
        daysUntilEnd={daysLeft}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
