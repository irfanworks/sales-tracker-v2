"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Handshake, X } from "lucide-react";
import type { OverdueOutcomePipeline } from "@/lib/overdueOutcome";
import { OutcomeStatusSwitcher } from "@/components/OutcomeStatusSwitcher";
import { jakartaTodayKey } from "@/lib/timezone";

const SNOOZE_KEY = "overdue-outcome-snooze-day";
const CHIP_HIDE_KEY = "overdue-outcome-chip-hide-day";

function storageDayEquals(key: string): boolean {
  try {
    return localStorage.getItem(key) === jakartaTodayKey();
  } catch {
    return false;
  }
}

function writeDayKey(key: string) {
  try {
    localStorage.setItem(key, jakartaTodayKey());
  } catch {
    /* ignore private-mode / quota */
  }
}

function clearDayKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function OverdueOutcomeModal({
  count,
  items,
  isAdmin,
}: {
  count: number;
  items: OverdueOutcomePipeline[];
  isAdmin: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [showChip, setShowChip] = useState(false);
  const [remaining, setRemaining] = useState(items);
  const [remainingCount, setRemainingCount] = useState(count);

  useEffect(() => {
    if (count <= 0) {
      setReady(true);
      setOpen(false);
      setShowChip(false);
      return;
    }

    const snoozed = storageDayEquals(SNOOZE_KEY);
    const chipHidden = storageDayEquals(CHIP_HIDE_KEY);
    setOpen(!snoozed);
    setShowChip(snoozed && !chipHidden);
    setReady(true);
  }, [count]);

  const dismissForToday = useCallback(() => {
    writeDayKey(SNOOZE_KEY);
    clearDayKey(CHIP_HIDE_KEY);
    setOpen(false);
    setShowChip(true);
  }, []);

  const hideChipForToday = useCallback(() => {
    writeDayKey(CHIP_HIDE_KEY);
    setShowChip(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissForToday();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissForToday]);

  function reopenFromChip() {
    setShowChip(false);
    setOpen(true);
  }

  function markResolved(id: string) {
    setRemaining((prev) => prev.filter((p) => p.id !== id));
    setRemainingCount((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0) {
        setOpen(false);
        setShowChip(false);
      }
      return next;
    });
  }

  if (!ready || remainingCount <= 0) return null;

  const countLabel =
    remainingCount === 1
      ? "1 pipeline"
      : remainingCount > items.length
        ? `${items.length}+ pipelines`
        : `${remainingCount} pipelines`;

  const headline =
    remainingCount === 1
      ? "Quick check-in on one deal"
      : `A quick check-in on ${countLabel}`;

  const subcopy = isAdmin
    ? "A few team deals passed their closing date without a Win / Lose / On Hold. Clearing them keeps the forecast honest."
    : "A few of your deals passed their closing date without a Win / Lose / On Hold. A quick update keeps your pipeline tidy.";

  return (
    <>
      {showChip && !open ? (
        <div className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+0.75rem)] right-3 z-[55] sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6">
          <div className="flex max-w-[min(100vw-1.5rem,22rem)] items-center gap-1 rounded-2xl border border-amber-200/80 bg-white/95 p-1.5 shadow-elevated backdrop-blur-md animate-slide-up">
            <button
              type="button"
              onClick={reopenFromChip}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-amber-50/80"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                <Clock3 className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {countLabel} awaiting outcome
                </span>
                <span className="block text-[11px] font-medium text-slate-500">
                  Tap to update · remind again tomorrow
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={hideChipForToday}
              className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Hide reminder for today"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            aria-label="Remind me tomorrow"
            onClick={dismissForToday}
          />

          <div
            role="dialog"
            aria-modal
            aria-labelledby="overdue-outcome-title"
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-elevated animate-slide-up safe-pb sm:mx-4 sm:rounded-3xl"
          >
            <div className="relative border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <Handshake className="h-5 w-5" />
                </div>
                <button
                  type="button"
                  onClick={dismissForToday}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Remind me tomorrow"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700">
                <Clock3 className="h-3 w-3" />
                Friendly nudge
              </p>

              <h2
                id="overdue-outcome-title"
                className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              >
                {headline}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                {subcopy}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              {remaining.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
                  <p className="mt-2 text-sm font-semibold text-emerald-900">
                    Nice work — this list is clear.
                  </p>
                  <p className="mt-1 text-xs text-emerald-800/80">
                    {remainingCount > 0
                      ? `Still ${remainingCount} more on Pipeline when you're ready.`
                      : "You're all caught up for now."}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {remaining.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-3.5 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={p.href}
                            className="block truncate text-sm font-semibold text-slate-900 hover:text-cyan-700 hover:underline"
                            onClick={dismissForToday}
                          >
                            {p.pipeline_name}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                            {p.no_quote}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-600">
                            {p.customer_name}
                            {isAdmin && p.sales_name ? ` · ${p.sales_name}` : ""}
                          </p>
                          <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                            {p.daysOverdue === 0
                              ? "Due today"
                              : `${p.daysOverdue} day${p.daysOverdue === 1 ? "" : "s"} past target`}
                            <span className="font-medium text-slate-400">
                              {" "}
                              · {p.target_closing_at}
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

            <div className="flex flex-col gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <button
                type="button"
                onClick={dismissForToday}
                className="btn-secondary order-2 sm:order-1"
              >
                Remind me tomorrow
              </button>
              <Link
                href="/dashboard/pipeline?sort_by=target_closing&sort_order=asc"
                onClick={dismissForToday}
                className="btn-primary order-1 inline-flex w-full items-center justify-center gap-2 sm:order-2 sm:w-auto"
              >
                Open Pipeline
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
