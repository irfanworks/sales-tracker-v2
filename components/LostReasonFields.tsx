"use client";

import {
  LOST_REASON_CATEGORIES,
  MIN_LOST_NOTES_LENGTH,
  type LostReasonCategory,
} from "@/lib/lostAnalysis";

export function LostReasonFields({
  category,
  notes,
  onCategoryChange,
  onNotesChange,
  disabled,
}: {
  category: LostReasonCategory | "";
  notes: string;
  onCategoryChange: (value: LostReasonCategory) => void;
  onNotesChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <fieldset disabled={disabled} className="min-w-0">
        <legend className="mb-2 text-sm font-medium text-slate-800">
          Reason category <span className="text-red-600">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {LOST_REASON_CATEGORIES.map((option) => {
            const selected = category === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onCategoryChange(option)}
                className={`min-h-[2.75rem] rounded-xl border px-3 py-2 text-left text-[13px] font-semibold leading-snug transition ${
                  selected
                    ? "border-cyan-400 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-400/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
                aria-pressed={selected}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="lost-reason-notes" className="mb-1.5 block text-sm font-medium text-slate-800">
          Notes <span className="text-red-600">*</span>
        </label>
        <textarea
          id="lost-reason-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className="input-field min-h-[5.5rem] resize-y"
          placeholder="Who won, what the gap was, or what is blocking — enough context for later analysis."
        />
        <p className="mt-1 text-xs text-slate-500">
          At least {MIN_LOST_NOTES_LENGTH} characters. This feeds Lost Analysis.
        </p>
      </div>
    </div>
  );
}
