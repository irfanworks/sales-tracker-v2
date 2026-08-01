"use client";

import { FileText, Trophy, Flame, FileSearch } from "lucide-react";

export function DashboardCountCards({
  totalProposals,
  totalProjectWinCount,
  totalProspectsCount,
  tenderOnProgress,
}: {
  totalProposals: number;
  totalProjectWinCount: number;
  totalProspectsCount: number;
  tenderOnProgress: number;
}) {
  const cards = [
    {
      label: "Total Proposal",
      value: totalProposals,
      hint: "Quotes / pipelines created",
      icon: FileText,
      accent: "text-slate-600",
      iconBg: "bg-slate-100 text-slate-700",
    },
    {
      label: "Total Project Win",
      value: totalProjectWinCount,
      hint: "Pipelines with Win outcome",
      icon: Trophy,
      accent: "text-emerald-700",
      iconBg: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Prospects Pipeline",
      value: totalProspectsCount,
      hint: "Open prospects currently in progress",
      icon: Flame,
      accent: "text-amber-700",
      iconBg: "bg-amber-50 text-amber-700",
    },
    {
      label: "Tender On Progress",
      value: tenderOnProgress,
      hint: "Open Tender pipelines in progress",
      icon: FileSearch,
      accent: "text-sky-700",
      iconBg: "bg-sky-50 text-sky-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
      {cards.map(({ label, value, hint, icon: Icon, accent, iconBg }) => (
        <div
          key={label}
          className="group flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white p-3 transition-colors duration-150 hover:border-slate-300/80 hover:bg-slate-50/40 sm:p-3.5"
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} transition-transform duration-150 group-hover:scale-[1.03]`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {label}
            </p>
            <p
              className={`mt-0.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${accent}`}
            >
              {value.toLocaleString("en-US")}
            </p>
            <p className="mt-0.5 hidden text-[11px] leading-snug text-slate-400 sm:block">
              {hint}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
