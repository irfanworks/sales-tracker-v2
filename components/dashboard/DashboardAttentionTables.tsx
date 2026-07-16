"use client";

import { useState } from "react";
import Link from "next/link";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { ExternalLink, X } from "lucide-react";
import type { DashboardListProject } from "@/lib/dashboard";

function formatDeadline(dateStr: string | null, highlightOverdue: boolean) {
  if (!dateStr) return <span className="text-slate-400">—</span>;
  const date = parseISO(dateStr + "T00:00:00");
  const label = format(date, "dd MMM yyyy");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(date, today);

  if (highlightOverdue && days < 0) {
    return (
      <span className="inline-flex flex-col">
        <span className="font-semibold tabular-nums text-red-600">{label}</span>
        <span className="text-[10px] font-medium text-red-500">
          {Math.abs(days)}d overdue
        </span>
      </span>
    );
  }

  if (days >= 0 && days <= 14) {
    return (
      <span className="inline-flex flex-col">
        <span className="font-semibold tabular-nums text-amber-700">{label}</span>
        <span className="text-[10px] font-medium text-amber-600">
          {days === 0 ? "Due today" : `${days}d left`}
        </span>
      </span>
    );
  }

  return <span className="font-medium tabular-nums text-slate-700">{label}</span>;
}

function DeadlineTable({
  projects,
  emptyLabel,
  highlightOverdue,
}: {
  projects: DashboardListProject[];
  emptyLabel: string;
  highlightOverdue: boolean;
}) {
  if (projects.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="bg-[#0f2744] text-[11px] font-bold uppercase tracking-wider text-white">
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Deadline</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr
              key={p.id}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50/80 ${
                i % 2 === 1 ? "bg-slate-50/70" : "bg-white"
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  href={p.href}
                  className="font-medium text-slate-900 hover:text-cyan-700 hover:underline"
                >
                  {p.project_name}
                </Link>
                <p className="mt-0.5 font-mono text-[11px] text-slate-400">{p.no_quote}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{p.customer_name}</td>
              <td className="px-4 py-3">{formatDeadline(p.target_closing_at, highlightOverdue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AttentionModal({
  open,
  title,
  projects,
  highlightOverdue,
  onClose,
}: {
  open: boolean;
  title: string;
  projects: DashboardListProject[];
  highlightOverdue: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-elevated animate-slide-up sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 bg-[#0f2744] px-5 py-4 text-white">
          <div>
            <h3 className="text-base font-bold uppercase tracking-wide">{title}</h3>
            <p className="mt-0.5 text-xs text-slate-300">
              {projects.length} Open project{projects.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto">
          <DeadlineTable
            projects={projects}
            emptyLabel="No projects."
            highlightOverdue={highlightOverdue}
          />
        </div>
      </div>
    </div>
  );
}

function AttentionPanel({
  title,
  topProjects,
  allProjects,
  emptyLabel,
  highlightOverdue,
}: {
  title: string;
  topProjects: DashboardListProject[];
  allProjects: DashboardListProject[];
  emptyLabel: string;
  highlightOverdue: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 bg-[#0f2744] px-4 py-3 text-white sm:px-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] sm:text-sm">{title}</h2>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold tabular-nums">
            {allProjects.length}
          </span>
        </div>
        <DeadlineTable
          projects={topProjects}
          emptyLabel={emptyLabel}
          highlightOverdue={highlightOverdue}
        />
        {allProjects.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
            >
              View all
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <AttentionModal
        open={open}
        title={title}
        projects={allProjects}
        highlightOverdue={highlightOverdue}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export function DashboardAttentionTables({
  overdue,
  hotAttention,
}: {
  overdue: DashboardListProject[];
  hotAttention: DashboardListProject[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <AttentionPanel
        title="Hot Prospect Project"
        topProjects={hotAttention.slice(0, 5)}
        allProjects={hotAttention}
        emptyLabel="No hot prospect / tender projects right now."
        highlightOverdue={false}
      />
      <AttentionPanel
        title="Overdue Project"
        topProjects={overdue.slice(0, 5)}
        allProjects={overdue}
        emptyLabel="No overdue Open projects."
        highlightOverdue
      />
    </div>
  );
}
