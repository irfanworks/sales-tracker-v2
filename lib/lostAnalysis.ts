/** Categories captured when a pipeline moves to Lose or On Hold. */
export const LOST_REASON_CATEGORIES = [
  "Competitor",
  "Price Gap",
  "Technical/Commercial Reason",
  "Others",
] as const;

export type LostReasonCategory = (typeof LOST_REASON_CATEGORIES)[number];

export const MIN_LOST_NOTES_LENGTH = 10;

export function isLostReasonCategory(
  value: string | null | undefined
): value is LostReasonCategory {
  return LOST_REASON_CATEGORIES.includes(value as LostReasonCategory);
}

export function lostReasonHint(stage: "Lose" | "On Hold"): string {
  return stage === "Lose"
    ? "What mainly caused this tender loss?"
    : "Why is this pipeline going On Hold?";
}

export function validateLostReasonInput(input: {
  category?: string | null;
  notes?: string | null;
}): string | null {
  if (!isLostReasonCategory(input.category?.trim())) {
    return "Pick a reason category.";
  }
  const notes = input.notes?.trim() ?? "";
  if (notes.length < MIN_LOST_NOTES_LENGTH) {
    return `Add notes (at least ${MIN_LOST_NOTES_LENGTH} characters) so the loss context is clear.`;
  }
  return null;
}
