"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";
import { LostReasonFields } from "@/components/LostReasonFields";
import {
  lostReasonHint,
  validateLostReasonInput,
  type LostReasonCategory,
} from "@/lib/lostAnalysis";

export type StageReasonPayload =
  | { kind: "lost"; category: LostReasonCategory; notes: string }
  | { kind: "reopen"; reason: string };

export function StageReasonDialog({
  open,
  mode,
  stageLabel,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  mode: "lost-lose" | "lost-hold" | "reopen";
  stageLabel?: string | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (payload: StageReasonPayload) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<LostReasonCategory | "">("");
  const [notes, setNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCategory("");
    setNotes("");
    setReopenReason("");
    setError(null);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!mounted || !open) return null;

  const isLost = mode === "lost-lose" || mode === "lost-hold";
  const title =
    mode === "lost-lose"
      ? "Record why this was lost"
      : mode === "lost-hold"
        ? "Record why this is On Hold"
        : "Reason to reopen";
  const subtitle = isLost
    ? lostReasonHint(mode === "lost-lose" ? "Lose" : "On Hold")
    : "A short reason is required before the pipeline can move again.";

  function submit() {
    if (isLost) {
      const invalid = validateLostReasonInput({ category, notes });
      if (invalid) {
        setError(invalid);
        return;
      }
      onConfirm({
        kind: "lost",
        category: category as LostReasonCategory,
        notes: notes.trim(),
      });
      return;
    }

    const reason = reopenReason.trim();
    if (!reason) {
      setError("A reason is required to reopen.");
      return;
    }
    onConfirm({ kind: "reopen", reason });
  }

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        aria-label="Cancel"
        disabled={busy}
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-reason-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-elevated animate-slide-up safe-pb sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="stage-reason-title" className="text-base font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p>
            {stageLabel ? (
              <p className="mt-1 truncate text-xs font-medium text-slate-500">{stageLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="icon-btn text-slate-400 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {isLost ? (
            <LostReasonFields
              category={category}
              notes={notes}
              onCategoryChange={setCategory}
              onNotesChange={setNotes}
              disabled={busy}
            />
          ) : (
            <div>
              <label htmlFor="reopen-reason" className="mb-1.5 block text-sm font-medium text-slate-800">
                Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                id="reopen-reason"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                disabled={busy}
                rows={3}
                className="input-field min-h-[5.5rem] resize-y"
                placeholder="Why is this pipeline being reopened?"
              />
            </div>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={busy} className="btn-primary gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
