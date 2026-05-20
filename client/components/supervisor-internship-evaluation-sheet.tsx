"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EVALUATION_RATING_CATEGORIES,
  EVALUATION_RECOMMENDATIONS,
  RECOMMENDATION_SCORE_BANDS,
  WEIGHT_PER_CRITERION_PERCENT,
  computeSupervisorEvaluationScoreFromForm,
  weightedCriterionPercent,
} from "@/lib/supervisor-evaluation-scoring";

export { EVALUATION_RATING_CATEGORIES, EVALUATION_RECOMMENDATIONS };

export type EvaluationFormState = {
  supervisorName: string;
  supervisorPosition: string;
  supervisorDepartment: string;
  workEthicRating: number;
  communicationRating: number;
  technicalSkillsRating: number;
  teamworkRating: number;
  punctualityRating: number;
  problemSolvingRating: number;
  supervisorComments: string;
  finalRecommendation: string;
  evaluationDate: string;
  certifiedAccurate: boolean;
};

export type EvaluationSheetPlacement = {
  organizationName?: string;
  internshipStartDate?: string;
  internshipEndDate?: string;
};

export type EvaluationSheetStudent = {
  firstName?: string;
  lastName?: string;
  program?: string;
  studentId?: string;
  department?: string;
  yearOfStudy?: number;
};

function FieldLine({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-black">
        {label}:
      </span>
      {children ?? (
        <span className="min-h-[1.35rem] min-w-0 flex-1 wrap-break-word border-b border-dotted border-black/70 pb-0.5 text-sm font-medium text-black">
          {value || "\u00a0"}
        </span>
      )}
    </div>
  );
}

function formatDisplayDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function levelLabel(yearOfStudy?: number) {
  if (!yearOfStudy) return "";
  return `Level ${yearOfStudy * 100} (Year ${yearOfStudy})`;
}

const underlineInput =
  "h-9 w-full border-0 border-b border-dotted border-black/80 rounded-none bg-transparent px-0 text-sm text-black shadow-none focus-visible:border-black focus-visible:ring-0";

const remarkTextarea =
  "min-h-[5rem] w-full resize-y rounded-none border border-dashed border-black/60 bg-white px-2 py-1.5 text-sm leading-relaxed text-black shadow-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/20";

type SupervisorInternshipEvaluationSheetProps = {
  student?: EvaluationSheetStudent | null;
  placement?: EvaluationSheetPlacement | null;
  form: EvaluationFormState;
  onFormChange: (patch: Partial<EvaluationFormState>) => void;
  onRating: (key: string, value: number) => void;
  submitLocked: boolean;
  submitting: boolean;
  daysUntilEnd: number | null;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
};

export function SupervisorInternshipEvaluationSheet({
  student,
  placement,
  form,
  onFormChange,
  onRating,
  submitLocked,
  submitting,
  daysUntilEnd,
  onSubmit,
  className,
}: SupervisorInternshipEvaluationSheetProps) {
  const studentName = student
    ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
    : "";
  const deptTitle = student?.department || "Department of Marine Engineering";
  const scoreSummary = computeSupervisorEvaluationScoreFromForm(form);
  const recommendationMismatch =
    scoreSummary?.isComplete &&
    form.finalRecommendation &&
    form.finalRecommendation !== scoreSummary.suggestedRecommendation;

  return (
    <article
      className={cn(
        "logsheet-paper relative mx-auto w-full min-w-0 max-w-[820px] bg-white font-serif text-black shadow-md print:max-w-none print:shadow-none",
        className
      )}
    >
      <div className="border border-black p-6 md:p-8">
        <header className="relative mb-5 border-b border-black/20 pb-4">
          <div className="absolute right-0 top-0 h-14 w-14 sm:h-16 sm:w-16">
            <Image
              src="/rmu-logo.png"
              alt="Regional Maritime University"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="pr-16 text-center">
            <p className="text-base font-bold uppercase tracking-wide md:text-lg">
              Regional Maritime University
            </p>
            <p className="mt-0.5 text-xs font-bold uppercase md:text-sm">{deptTitle}</p>
            <p className="text-xs font-bold uppercase md:text-sm">
              Student &amp; Industrial Training Programme
            </p>
            <h2 className="mt-2 text-sm font-bold underline underline-offset-[3px] md:text-base">
              Internship Supervisor Evaluation Form
            </h2>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-black/70">
              To be completed by the industry supervisor
            </p>
          </div>
        </header>

        {student && (
          <section className="mb-5 space-y-2 border border-black/30 bg-neutral-50/80 p-3 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-black">
              Student under evaluation
            </p>
            <FieldLine label="Name of Student" value={studentName || "—"} />
            <FieldLine label="Programme" value={student.program || "—"} />
            {student.studentId ? <FieldLine label="Index No" value={student.studentId} /> : null}
            {student.yearOfStudy ? (
              <FieldLine label="Level" value={levelLabel(student.yearOfStudy)} />
            ) : null}
            {placement?.organizationName ? (
              <FieldLine label="Organisation" value={placement.organizationName} />
            ) : null}
            {(placement?.internshipStartDate || placement?.internshipEndDate) && (
              <FieldLine
                label="Internship period"
                value={`${formatDisplayDate(placement.internshipStartDate) || "—"} to ${formatDisplayDate(placement.internshipEndDate) || "—"}`}
              />
            )}
          </section>
        )}

        {submitLocked && (
          <div className="mb-5 border border-amber-700/40 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            <p className="font-bold uppercase tracking-wide text-[11px]">
              Submission not yet open
            </p>
            <p className="mt-1 leading-relaxed">
              Evaluation submission opens in the final two weeks before the internship ends.
              {daysUntilEnd != null
                ? ` There are ${daysUntilEnd} day${daysUntilEnd === 1 ? "" : "s"} until the internship end date. You may complete this form now and return to submit using this same link.`
                : " You may complete this form now and return to submit using this same link."}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-3">
            <p className="border-b border-black pb-1 text-[11px] font-bold uppercase tracking-wide">
              Section A — Supervisor particulars
            </p>
            <FieldLine label="Supervisor name (required)">
              <Input
                id="supervisor-name"
                type="text"
                value={form.supervisorName}
                onChange={(e) => onFormChange({ supervisorName: e.target.value })}
                placeholder="Full name"
                required
                className={cn(underlineInput, "flex-1")}
              />
            </FieldLine>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldLine label="Position">
                <Input
                  id="supervisor-position"
                  type="text"
                  value={form.supervisorPosition}
                  onChange={(e) => onFormChange({ supervisorPosition: e.target.value })}
                  placeholder="e.g. Senior Engineer"
                  className={cn(underlineInput, "flex-1")}
                />
              </FieldLine>
              <FieldLine label="Department">
                <Input
                  id="supervisor-dept"
                  type="text"
                  value={form.supervisorDepartment}
                  onChange={(e) => onFormChange({ supervisorDepartment: e.target.value })}
                  placeholder="e.g. Engineering"
                  className={cn(underlineInput, "flex-1")}
                />
              </FieldLine>
            </div>
          </section>

          <section className="space-y-2">
            <p className="border-b border-black pb-1 text-[11px] font-bold uppercase tracking-wide">
              Section B — Performance ratings (total mark out of 100%)
            </p>
            <div className="border border-black/40 bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-black/85">
              <p>
                Six criteria, each weighted equally at{" "}
                <strong>{WEIGHT_PER_CRITERION_PERCENT.toFixed(1)}%</strong> of the final mark (100%
                total). Rate each criterion from <strong>1 (poor)</strong> to{" "}
                <strong>5 (excellent)</strong>. Overall % = (sum of ratings ÷ 30) × 100.
              </p>
            </div>
            <div className="overflow-x-auto border border-black">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-r border-black bg-white px-2 py-2 text-left text-[10px] font-bold uppercase">
                      Category
                    </th>
                    <th className="border-b border-r border-black bg-white px-2 py-2 text-center text-[10px] font-bold uppercase">
                      Weight
                    </th>
                    <th className="border-b border-r border-black bg-white px-2 py-2 text-left text-[10px] font-bold uppercase">
                      Description
                    </th>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <th
                        key={n}
                        className="w-10 border-b border-r border-black bg-white px-1 py-2 text-center text-[10px] font-bold uppercase"
                      >
                        {n}
                      </th>
                    ))}
                    <th className="border-b border-black bg-white px-2 py-2 text-center text-[10px] font-bold uppercase">
                      Mark
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {EVALUATION_RATING_CATEGORIES.map((cat) => {
                    const current = form[cat.key as keyof EvaluationFormState] as number;
                    const criterionMark =
                      current > 0 ? weightedCriterionPercent(current).toFixed(1) : "—";
                    return (
                      <tr key={cat.key} className="border-b border-black last:border-b-0">
                        <td className="border-r border-black align-top px-2 py-2 font-semibold">
                          {cat.label}
                        </td>
                        <td className="border-r border-black align-top px-2 py-2 text-center text-xs tabular-nums">
                          {WEIGHT_PER_CRITERION_PERCENT.toFixed(1)}%
                        </td>
                        <td className="border-r border-black align-top px-2 py-1.5 text-xs leading-snug text-black/75">
                          {cat.description}
                        </td>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <td
                            key={n}
                            className="border-r border-black p-1 text-center"
                          >
                            <button
                              type="button"
                              onClick={() => onRating(cat.key, n)}
                              aria-label={`${cat.label}: ${n} out of 5`}
                              aria-pressed={current === n}
                              className={cn(
                                "mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                                current === n
                                  ? "border-black bg-black text-white"
                                  : "border-black/50 bg-white text-black hover:bg-neutral-100"
                              )}
                            >
                              {n}
                            </button>
                          </td>
                        ))}
                        <td className="px-2 py-2 text-center text-xs font-bold tabular-nums">
                          {criterionMark === "—" ? "—" : `${criterionMark}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 font-bold">
                    <td colSpan={8} className="border-t border-black px-2 py-2 text-right text-[10px] uppercase">
                      Raw points (max 30)
                    </td>
                    <td className="border-t border-l border-black px-2 py-2 text-center text-sm tabular-nums">
                      {scoreSummary ? `${scoreSummary.rawSum}/30` : "—"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid gap-2 border border-black sm:grid-cols-3">
              <div className="border-b border-black/20 px-3 py-2 sm:border-b-0 sm:border-r">
                <p className="text-[10px] font-bold uppercase">Overall mark</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {scoreSummary ? `${scoreSummary.percent}%` : "—"}
                </p>
                <p className="text-[10px] text-black/65">
                  {scoreSummary?.isComplete
                    ? "Out of 100%"
                    : scoreSummary
                      ? `${scoreSummary.completedCount}/6 criteria rated (provisional)`
                      : "Complete all ratings"}
                </p>
              </div>
              <div className="border-b border-black/20 px-3 py-2 sm:border-b-0 sm:border-r">
                <p className="text-[10px] font-bold uppercase">Average (1–5)</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {scoreSummary ? `${scoreSummary.average.toFixed(1)}/5` : "—"}
                </p>
                <p className="text-[10px] text-black/65">Equivalent mean score</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold uppercase">Letter grade</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {scoreSummary ? scoreSummary.grade : "—"}
                </p>
                <p className="text-[10px] text-black/65">
                  A ≥80% · B 65–79% · C 50–64% · below 50%: D/F
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-black">
              Section C — Supervisor comments
            </p>
            <Textarea
              id="comments"
              value={form.supervisorComments}
              onChange={(e) => onFormChange({ supervisorComments: e.target.value })}
              placeholder="Additional observations about the student's performance…"
              rows={5}
              className={remarkTextarea}
            />
          </section>

          <section className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-black">
              Section D — Final recommendation (required)
            </p>
            <p className="text-xs leading-relaxed text-black/80">
              Select the overall verdict. Bands aligned to the 100% mark:{" "}
              {RECOMMENDATION_SCORE_BANDS.map((b) => `${b.recommendation} (${b.minPercent}–${b.maxPercent}%)`).join("; ")}
              .
              {scoreSummary?.isComplete ? (
                <span className="mt-1 block font-semibold text-black">
                  Suggested from score: {scoreSummary.suggestedRecommendation} ({scoreSummary.percent}%)
                </span>
              ) : null}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EVALUATION_RECOMMENDATIONS.map((rec) => {
                const band = RECOMMENDATION_SCORE_BANDS.find((b) => b.recommendation === rec);
                return (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => onFormChange({ finalRecommendation: rec })}
                    className={cn(
                      "border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                      form.finalRecommendation === rec
                        ? "border-black bg-black text-white"
                        : "border-black/50 bg-white text-black hover:bg-neutral-50"
                    )}
                  >
                    <span className="block">{rec}</span>
                    {band ? (
                      <span
                        className={cn(
                          "mt-0.5 block text-xs font-normal",
                          form.finalRecommendation === rec ? "text-white/80" : "text-black/55"
                        )}
                      >
                        {band.minPercent}–{band.maxPercent}%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {recommendationMismatch ? (
              <p className="border border-amber-700/50 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                Your selected recommendation differs from the score-based suggestion (
                {scoreSummary?.suggestedRecommendation}). You may keep your selection if it reflects
                your professional judgment.
              </p>
            ) : null}
          </section>

          <section className="space-y-3 border border-black/30 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-black">
              Section E — Declaration
            </p>
            <FieldLine label="Date of evaluation">
              <Input
                type="date"
                value={form.evaluationDate}
                onChange={(e) => onFormChange({ evaluationDate: e.target.value })}
                className={cn(underlineInput, "flex-1 max-w-[12rem] [color-scheme:light]")}
              />
            </FieldLine>
            <label className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed">
              <input
                type="checkbox"
                checked={form.certifiedAccurate}
                onChange={(e) => onFormChange({ certifiedAccurate: e.target.checked })}
                className="mt-1 h-4 w-4 shrink-0 border-black"
              />
              <span>
                I certify that this evaluation is accurate and based on the student&apos;s
                performance during the internship period stated above.
              </span>
            </label>
          </section>

          <div className="border-t border-black/20 pt-4">
            <Button
              type="submit"
              disabled={submitting || submitLocked}
              className="h-11 w-full rounded-none border-2 border-black bg-black font-serif text-sm font-bold uppercase tracking-wide text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : submitLocked ? (
                "Submission locked until final two weeks"
              ) : (
                "Submit evaluation"
              )}
            </Button>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-black/55">
              Secure form. Your response is recorded and shared with the university.
            </p>
          </div>
        </form>
      </div>
    </article>
  );
}
