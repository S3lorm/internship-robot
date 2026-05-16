/** Local calendar date as YYYY-MM-DD (for date input min attribute). */
export function todayInputDateMin(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function validateInternshipDateRange(
  start: string,
  end: string
): string | null {
  if (!start?.trim() || !end?.trim()) {
    return "Confirmed start and end dates are required.";
  }

  const today = todayInputDateMin();

  if (start < today) {
    return "Start date cannot be in the past. Choose today or a future date.";
  }
  if (end < today) {
    return "End date cannot be in the past. Choose today or a future date.";
  }
  if (end < start) {
    return "End date must be on or after the start date.";
  }

  return null;
}

export function internshipEndDateMin(start: string): string {
  const today = todayInputDateMin();
  if (!start || start < today) return today;
  return start;
}
