export const EVALUATION_RATING_CATEGORIES = [
  { key: "workEthicRating", label: "Work Ethic", description: "Dedication, initiative, and consistency" },
  { key: "communicationRating", label: "Communication", description: "Written and verbal skills" },
  { key: "technicalSkillsRating", label: "Technical Skills", description: "Job-specific knowledge and abilities" },
  { key: "teamworkRating", label: "Teamwork", description: "Collaboration and interpersonal skills" },
  { key: "punctualityRating", label: "Punctuality", description: "Timeliness and attendance" },
  { key: "problemSolvingRating", label: "Problem Solving", description: "Critical thinking and resourcefulness" },
] as const;

export const EVALUATION_RECOMMENDATIONS = [
  "Excellent",
  "Good",
  "Average",
  "Needs Improvement",
] as const;

export const SUPERVISOR_EVALUATION_CRITERIA_COUNT = EVALUATION_RATING_CATEGORIES.length;
export const RATING_SCALE_MIN = 1;
export const RATING_SCALE_MAX = 5;
export const MAX_RAW_SCORE = SUPERVISOR_EVALUATION_CRITERIA_COUNT * RATING_SCALE_MAX;
export const WEIGHT_PER_CRITERION_PERCENT = 100 / SUPERVISOR_EVALUATION_CRITERIA_COUNT;

export type SupervisorEvaluationScore = {
  ratings: number[];
  completedCount: number;
  isComplete: boolean;
  rawSum: number;
  rawMax: number;
  average: number;
  percent: number;
  grade: string;
  suggestedRecommendation: string;
};

export function ratingFromValue(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < RATING_SCALE_MIN || rounded > RATING_SCALE_MAX) return null;
  return rounded;
}

export function ratingsFromForm(form: Record<string, unknown>): number[] {
  return EVALUATION_RATING_CATEGORIES.map((cat) => ratingFromValue(form[cat.key])).filter(
    (r): r is number => r != null
  );
}

export function weightedCriterionPercent(rating: number): number {
  return (rating / RATING_SCALE_MAX) * WEIGHT_PER_CRITERION_PERCENT;
}

export function gradeFromPercent(percent: number): string {
  if (percent >= 80) return "A";
  if (percent >= 65) return "B";
  if (percent >= 50) return "C";
  if (percent >= 40) return "D";
  return "F";
}

export function recommendationFromPercent(percent: number): string {
  if (percent >= 80) return "Excellent";
  if (percent >= 65) return "Good";
  if (percent >= 50) return "Average";
  return "Needs Improvement";
}

export function computeSupervisorEvaluationScore(
  ratings: number[],
  options?: { requireAll?: boolean }
): SupervisorEvaluationScore | null {
  const requireAll = options?.requireAll ?? true;
  const valid = ratings.filter(
    (r) => r >= RATING_SCALE_MIN && r <= RATING_SCALE_MAX
  );
  if (valid.length === 0) return null;

  const isComplete = valid.length === SUPERVISOR_EVALUATION_CRITERIA_COUNT;
  if (requireAll && !isComplete) {
    const rawSum = valid.reduce((a, b) => a + b, 0);
    const rawMax = valid.length * RATING_SCALE_MAX;
    const average = rawSum / valid.length;
    const percent = Math.round((rawSum / rawMax) * 100);
    return {
      ratings: valid,
      completedCount: valid.length,
      isComplete: false,
      rawSum,
      rawMax,
      average,
      percent,
      grade: gradeFromPercent(percent),
      suggestedRecommendation: recommendationFromPercent(percent),
    };
  }

  const rawSum = valid.reduce((a, b) => a + b, 0);
  const rawMax = SUPERVISOR_EVALUATION_CRITERIA_COUNT * RATING_SCALE_MAX;
  const average = rawSum / SUPERVISOR_EVALUATION_CRITERIA_COUNT;
  const percent = Math.round((rawSum / rawMax) * 100);

  return {
    ratings: valid,
    completedCount: valid.length,
    isComplete,
    rawSum,
    rawMax,
    average,
    percent,
    grade: gradeFromPercent(percent),
    suggestedRecommendation: recommendationFromPercent(percent),
  };
}

export function computeSupervisorEvaluationScoreFromForm(
  form: Record<string, unknown>
): SupervisorEvaluationScore | null {
  const ratings = EVALUATION_RATING_CATEGORIES.map((cat) =>
    ratingFromValue(form[cat.key])
  ).filter((r): r is number => r != null);
  return computeSupervisorEvaluationScore(ratings, { requireAll: false });
}

export const RECOMMENDATION_SCORE_BANDS = [
  { recommendation: "Excellent", minPercent: 80, maxPercent: 100 },
  { recommendation: "Good", minPercent: 65, maxPercent: 79 },
  { recommendation: "Average", minPercent: 50, maxPercent: 64 },
  { recommendation: "Needs Improvement", minPercent: 0, maxPercent: 49 },
] as const;
