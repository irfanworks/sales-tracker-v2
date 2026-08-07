"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { OutcomeStatus } from "@/lib/types/database";
import { setPipelineOutcomeAction } from "@/app/dashboard/pipeline/actions";

const OPTIONS: { value: OutcomeStatus | null; label: string; short: string; active: string }[] = [
  {
    value: null,
    label: "Clear",
    short: "—",
    active: "bg-slate-700 text-white shadow-sm",
  },
  {
    value: "Win",
    label: "Win",
    short: "Win",
    active: "bg-emerald-600 text-white shadow-sm",
  },
  {
    value: "Lose",
    label: "Lose",
    short: "Lose",
    active: "bg-red-600 text-white shadow-sm",
  },
  {
    value: "On Hold",
    label: "On Hold",
    short: "Hold",
    active: "bg-amber-500 text-white shadow-sm",
  },
];

function normalize(value: string | null | undefined): OutcomeStatus | null {
  if (value === "Win" || value === "Lose" || value === "On Hold") return value;
  return null;
}

export function OutcomeStatusSwitcher({
  pipelineId,
  value,
  pipelineLabel,
  size = "md",
}: {
  pipelineId: string;
  value: string | null | undefined;
  pipelineLabel?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<OutcomeStatus | null>(normalize(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOptimistic(normalize(value));
  }, [value]);

  function apply(next: OutcomeStatus | null) {
    if (next === optimistic || pending) return;
    const prev = optimistic;
    setError(null);
    setOptimistic(next);

    startTransition(async () => {
      const result = await setPipelineOutcomeAction({
        id: pipelineId,
        outcome: next,
        previousOutcome: prev,
        pipelineLabel: pipelineLabel ?? null,
      });
      if (!result.ok) {
        setOptimistic(prev);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const pad = size === "sm" ? "px-1.5 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]";

  return (
    <div className="inline-flex min-w-0 flex-col items-start gap-1">
      <div
        role="group"
        aria-label="Outcome status"
        className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-slate-200/90 bg-slate-50/90 p-0.5"
      >
        {OPTIONS.map((opt) => {
          const active = optimistic === opt.value;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={pending}
              title={opt.value ? `Set outcome to ${opt.label}` : "Clear outcome"}
              aria-pressed={active}
              onClick={() => apply(opt.value)}
              className={`inline-flex min-h-[1.75rem] items-center justify-center rounded-md font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-60 ${pad} ${
                active
                  ? opt.active
                  : "text-slate-500 hover:bg-white hover:text-slate-800"
              }`}
            >
              {pending && active ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : size === "sm" ? (
                opt.short
              ) : (
                opt.label
              )}
            </button>
          );
        })}
      </div>
      {error && <span className="max-w-[12rem] text-[10px] leading-snug text-red-600">{error}</span>}
    </div>
  );
}

export function OutcomeBulkButtons({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (outcome: OutcomeStatus | null) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Set outcome
      </span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt.value)}
          className={`rounded-md border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition disabled:opacity-50 ${
            opt.value === "Win"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : opt.value === "Lose"
                ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100"
                : opt.value === "On Hold"
                  ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
