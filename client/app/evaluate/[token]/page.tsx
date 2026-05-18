'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const RATING_CATEGORIES = [
  { key: 'workEthicRating', label: 'Work Ethic', description: 'Dedication, initiative, and consistency' },
  { key: 'communicationRating', label: 'Communication', description: 'Written and verbal skills' },
  { key: 'technicalSkillsRating', label: 'Technical Skills', description: 'Job-specific knowledge and abilities' },
  { key: 'teamworkRating', label: 'Teamwork', description: 'Collaboration and interpersonal skills' },
  { key: 'punctualityRating', label: 'Punctuality', description: 'Timeliness and attendance' },
  { key: 'problemSolvingRating', label: 'Problem Solving', description: 'Critical thinking and resourcefulness' },
];

const RECOMMENDATIONS = ['Excellent', 'Good', 'Average', 'Needs Improvement'];

export default function EvaluatePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const [form, setForm] = useState({
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

    const allRated = RATING_CATEGORIES.every((c) => Number(form[c.key as keyof typeof form]) > 0);
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

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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

  function StarRating({ category }: { category: string }) {
    const currentRating = form[category as keyof typeof form] as number;
    return (
      <div className="flex flex-wrap gap-1.5 sm:justify-end" role="group" aria-label="Rating 1 to 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(category, n)}
            className={cn(
              'h-10 min-w-9 flex-1 rounded-lg border-0 text-sm font-bold transition-all sm:h-10 sm:w-10 sm:flex-none',
              n <= currentRating
                ? 'bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-sm'
                : 'bg-white/10 text-white/35 hover:bg-white/15'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  const shellClass =
    'min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 pb-12 text-slate-50';

  if (loading) {
    return (
      <div className={cn(shellClass, 'flex items-center justify-center')}>
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex items-center justify-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" aria-hidden />
            <p className="text-center text-sm text-white/80">Loading evaluation form…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(shellClass, 'flex items-center justify-center')}>
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="text-4xl" aria-hidden>
              ⚠️
            </div>
            <CardTitle className="text-xl text-white">{error}</CardTitle>
            <CardDescription className="text-pretty text-white/55">
              If you believe this is an error, please contact the university for assistance.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn(shellClass, 'flex items-center justify-center')}>
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="text-4xl" aria-hidden>
              🎉
            </div>
            <CardTitle className="text-xl text-emerald-400">Evaluation submitted successfully</CardTitle>
            <CardDescription className="text-pretty text-white/65">
              Thank you for evaluating the student&apos;s performance. Your feedback supports their
              academic development.
            </CardDescription>
            <p className="text-xs text-white/40">You may close this page now.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const submitLocked = Boolean(formData && formData.isSubmitWindowOpen === false);
  const daysLeft = typeof formData?.daysUntilEnd === 'number' ? formData.daysUntilEnd : null;

  return (
    <div className={shellClass}>
      <Card className="mx-auto w-full max-w-2xl border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 border-b border-white/10 px-5 pb-6 pt-8 text-center sm:px-8">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-green-600 text-2xl shadow-lg"
            aria-hidden
          >
            📋
          </div>
          <CardTitle className="text-balance text-xl font-bold text-white sm:text-2xl">
            Internship evaluation form
          </CardTitle>
          <CardDescription className="mx-auto max-w-md text-pretty text-sm text-white/50">
            Regional Maritime University — supervisor assessment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          {formData?.student && (
            <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
                Evaluating student
              </p>
              <p className="mt-1 wrap-break-word text-base font-semibold text-white">
                {formData.student.firstName} {formData.student.lastName}
              </p>
              <p className="mt-1 wrap-break-word text-sm leading-relaxed text-white/55">
                {formData.student.program}
                {formData.placement?.organizationName ? (
                  <>
                    {' '}
                    — <span className="text-white/75">{formData.placement.organizationName}</span>
                  </>
                ) : null}
              </p>
            </div>
          )}

          {submitLocked && (
            <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-4 text-left">
              <p className="text-sm font-semibold text-amber-200">
                Submission opens in the final two weeks of the internship
              </p>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-white/60">
                {daysLeft != null
                  ? `There are still ${daysLeft} day${daysLeft === 1 ? '' : 's'} until the internship end date. You can review this page now; use this same link to submit closer to the end of the placement.`
                  : 'You can review this page now. Use this same link to submit closer to the end of the placement.'}
              </p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <section className="space-y-4 border-b border-white/10 pb-8">
              <h3 className="text-base font-semibold text-white">Supervisor information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supervisor-name" className="text-white/70">
                    Your name *
                  </Label>
                  <Input
                    id="supervisor-name"
                    type="text"
                    value={form.supervisorName}
                    onChange={(e) => setForm((p) => ({ ...p, supervisorName: e.target.value }))}
                    placeholder="e.g. John Mensah"
                    required
                    className="border-white/15 bg-white/10 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supervisor-position" className="text-white/70">
                      Position
                    </Label>
                    <Input
                      id="supervisor-position"
                      type="text"
                      value={form.supervisorPosition}
                      onChange={(e) => setForm((p) => ({ ...p, supervisorPosition: e.target.value }))}
                      placeholder="e.g. Senior Engineer"
                      className="border-white/15 bg-white/10 text-white placeholder:text-white/35"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor-dept" className="text-white/70">
                      Department
                    </Label>
                    <Input
                      id="supervisor-dept"
                      type="text"
                      value={form.supervisorDepartment}
                      onChange={(e) => setForm((p) => ({ ...p, supervisorDepartment: e.target.value }))}
                      placeholder="e.g. Engineering"
                      className="border-white/15 bg-white/10 text-white placeholder:text-white/35"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-b border-white/10 pb-8">
              <div>
                <h3 className="text-base font-semibold text-white">Performance ratings</h3>
                <p className="mt-1 text-sm text-white/45">
                  Rate each category from 1 (poor) to 5 (excellent)
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {RATING_CATEGORIES.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex flex-col gap-3 rounded-xl bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-white">{cat.label}</p>
                      <p className="wrap-break-word text-xs leading-relaxed text-white/45">
                        {cat.description}
                      </p>
                    </div>
                    <StarRating category={cat.key} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <Label htmlFor="comments" className="text-white/70">
                Comments
              </Label>
              <Textarea
                id="comments"
                value={form.supervisorComments}
                onChange={(e) => setForm((p) => ({ ...p, supervisorComments: e.target.value }))}
                placeholder="Additional observations about the student's performance…"
                rows={4}
                className="resize-y border-white/15 bg-white/10 text-white placeholder:text-white/35"
              />
            </section>

            <section className="space-y-3">
              <Label className="text-white/70">Final recommendation *</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {RECOMMENDATIONS.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, finalRecommendation: rec }))}
                    className={cn(
                      'wrap-break-word rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                      form.finalRecommendation === rec
                        ? 'border-2 border-blue-400 bg-blue-500/20 text-blue-200'
                        : 'border border-white/15 bg-white/5 text-white/65 hover:bg-white/10'
                    )}
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </section>

            <Button
              type="submit"
              disabled={submitting || submitLocked}
              className="h-12 w-full bg-linear-to-br from-emerald-500 to-green-600 text-base font-bold text-white hover:from-emerald-600 hover:to-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : submitLocked ? (
                'Submission locked until final two weeks'
              ) : (
                'Submit evaluation'
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] leading-relaxed text-white/30">
            Secure form. Your response is recorded and shared with the university.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
