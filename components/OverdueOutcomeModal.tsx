"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, Sparkles, X } from "lucide-react";
import type { OverdueOutcomePipeline } from "@/lib/overdueOutcome";
import { OutcomeStatusSwitcher } from "@/components/OutcomeStatusSwitcher";

export function OverdueOutcomeModal({
  count,
  items,
  isAdmin,
}: {
  count: number;
  items: OverdueOutcomePipeline[];
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(items);
  const [remainingCount, setRemainingCount] = useState(count);

  useEffect(() => {
    if (count > 0) setOpen(true);
  }, [count]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || remainingCount <= 0) return null;

  function markResolved(id: string) {
    setRemaining((prev) => prev.filter((p) => p.id !== id));
    setRemainingCount((c) => Math.max(0, c - 1));
  }

  const headline =
    remainingCount === 1
      ? "1 pipeline needs your outcome"
      : `${remainingCount} pipelines need your outcome`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={() => setOpen(false)}
      />

      <div
        role="dialog"
        aria-modal
        aria-labelledby="overdue-outcome-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-elevated animate-slide-up sm:mx-4 sm:rounded-3xl"
      >
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#12263f] to-[#0e7490] px-5 pb-5 pt-5 text-white sm:px-6 sm:pt-6">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl"
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-300/30">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss for now"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100 ring-1 ring-white/10">
            <Clock3 className="h-3 w-3" />
            Past due · no outcome
          </p>

          <h2
            id="overdue-outcome-title"
            className="relative mt-3 text-2xl font-bold tracking-tight sm:text-[1.65rem]"
          >
            {headline}
          </h2>
          <p className="relative mt-2 max-w-md text-sm leading-relaxed text-slate-200/90">
            {isAdmin
              ? "Target closing dates have passed and outcomes are still empty across the team. Clear them now so forecast and Win tracking stay truthful."
              : "Your target closing dates have passed, but outcomes are still empty. Update Win / Lose / On Hold now — it takes seconds and keeps your pipeline clean for review."}
          </p>

          <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-medium text-cyan-50 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
            Tip: set the outcome here without opening each form.
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {remaining.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-emerald-900">
                Nice — preview list cleared.
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">
                {remainingCount > 0
                  ? `Still ${remainingCount} more on Pipeline. Keep going.`
                  : "All caught up for now."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {remaining.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={p.href}
                        className="block truncate text-sm font-semibold text-slate-900 hover:text-cyan-700 hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        {p.pipeline_name}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{p.no_quote}</p>
                      <p className="mt-1 truncate text-xs text-slate-600">
                        {p.customer_name}
                        {isAdmin && p.sales_name ? ` · ${p.sales_name}` : ""}
                      </p>
                      <p className="mt-1.5 text-[11px] font-semibold text-red-600">
                        {p.daysOverdue === 0
                          ? "Due today (timezone boundary)"
                          : `${p.daysOverdue} day${p.daysOverdue === 1 ? "" : "s"} overdue`}
                        <span className="font-medium text-slate-400">
                          {" "}
                          · target {p.target_closing_at}
                        </span>
                      </p>
                    </div>
                    <OutcomeStatusSwitcher
                      pipelineId={p.id}
                      value={null}
                      pipelineLabel={`${p.no_quote} · ${p.pipeline_name}`}
                      size="sm"
                      onChanged={(next) => {
                        if (next) markResolved(p.id);
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-secondary order-2 sm:order-1"
          >
            Later
          </button>
          <Link
            href="/dashboard/pipeline?sort_by=target_closing&sort_order=asc"
            onClick={() => setOpen(false)}
            className="btn-primary order-1 inline-flex items-center justify-center gap-2 sm:order-2"
          >
            Update on Pipeline
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
