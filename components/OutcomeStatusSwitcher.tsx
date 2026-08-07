"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import type { OutcomeStatus } from "@/lib/types/database";
import { setPipelineOutcomeAction } from "@/app/dashboard/pipeline/actions";

const OPTIONS: { value: OutcomeStatus | ""; label: string }[] = [
  { value: "", label: "No outcome" },
  { value: "Win", label: "Win" },
  { value: "Lose", label: "Lose" },
  { value: "On Hold", label: "On Hold" },
];

function normalize(value: string | null | undefined): OutcomeStatus | "" {
  if (value === "Win" || value === "Lose" || value === "On Hold") return value;
  return "";
}

function toneClass(value: OutcomeStatus | ""): string {
  if (value === "Win") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "Lose") return "border-red-200 bg-red-50 text-red-800";
  if (value === "On Hold") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-white text-slate-600";
}

export function OutcomeStatusSwitcher({
  pipelineId,
  value,
  pipelineLabel,
  size = "md",
  onChanged,
}: {
  pipelineId: string;
  value: string | null | undefined;
  pipelineLabel?: string;
  size?: "sm" | "md";
  onChanged?: (next: OutcomeStatus | null) => void;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<OutcomeStatus | "">(normalize(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOptimistic(normalize(value));
  }, [value]);

  function apply(raw: string) {
    const next = normalize(raw);
    if (next === optimistic || pending) return;
    const prev = optimistic;
    setError(null);
    setOptimistic(next);

    startTransition(async () => {
      const result = await setPipelineOutcomeAction({
        id: pipelineId,
        outcome: next || null,
        previousOutcome: prev || null,
        pipelineLabel: pipelineLabel ?? null,
      });
      if (!result.ok) {
        setOptimistic(prev);
        setError(result.error);
        return;
      }
      onChanged?.(next || null);
      router.refresh();
    });
  }

  const height = size === "sm" ? "h-8 text-[11px]" : "h-9 text-xs";

  return (
    <div className="inline-flex min-w-0 flex-col items-stretch gap-1">
      <div className="relative min-w-[7.5rem] max-w-[10rem]">
        <select
          aria-label="Outcome status"
          disabled={pending}
          value={optimistic}
          onChange={(e) => apply(e.target.value)}
          className={`w-full appearance-none rounded-lg border py-0 pl-2.5 pr-7 font-semibold tracking-tight outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60 ${height} ${toneClass(optimistic)}`}
        >
          {OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-current opacity-60">
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </div>
      {error && <span className="max-w-[10rem] text-[10px] leading-snug text-red-600">{error}</span>}
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
      <div className="relative min-w-[8.5rem]">
        <select
          aria-label="Bulk set outcome"
          disabled={disabled}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const next: OutcomeStatus | null =
              v === "Win" || v === "Lose" || v === "On Hold" ? v : null;
            onSelect(next);
            e.target.value = "";
          }}
          className="h-8 w-full appearance-none rounded-md border border-slate-200 bg-white py-0 pl-2.5 pr-7 text-[11px] font-bold uppercase tracking-wide text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
        >
          <option value="" disabled>
            Choose…
          </option>
          <option value="__clear">Clear</option>
          <option value="Win">Win</option>
          <option value="Lose">Lose</option>
          <option value="On Hold">On Hold</option>
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-slate-400">
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}
