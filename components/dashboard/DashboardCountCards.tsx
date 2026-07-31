"use client";

import { FileText, Trophy, Flame, FileSearch } from "lucide-react";

export function DashboardCountCards({
  totalProposals,
  totalProjectWinCount,
  totalHotProspectCount,
  tenderOnProgress,
}: {
  totalProposals: number;
  totalProjectWinCount: number;
  totalHotProspectCount: number;
  tenderOnProgress: number;
}) {
  const cards = [
    {
      label: "Total Proposal",
      value: totalProposals,
      hint: "Quotes / pipelines created",
      icon: FileText,
      iconClass: "from-slate-500 to-slate-700",
      ring: "ring-slate-200/60",
    },
    {
      label: "Total Project Win",
      value: totalProjectWinCount,
      hint: "Pipelines with Win outcome",
      icon: Trophy,
      iconClass: "from-emerald-400 to-emerald-600",
      ring: "ring-emerald-200/50",
    },
    {
      label: "Prospects Pipeline",
      value: totalHotProspectCount,
      hint: "Hot Prospect pipelines (active)",
      icon: Flame,
      iconClass: "from-orange-400 to-orange-600",
      ring: "ring-orange-200/50",
    },
    {
      label: "Tender On Progress",
      value: tenderOnProgress,
      hint: "Open Tender pipelines in progress",
      icon: FileSearch,
      iconClass: "from-blue-400 to-blue-600",
      ring: "ring-blue-200/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, iconClass, ring }) => (
        <div
          key={label}
          className={`flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 sm:p-4 ${ring}`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${iconClass} text-white shadow-sm`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
              {label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
              {value.toLocaleString("en-US")}
            </p>
            <p className="mt-0.5 hidden text-[10px] leading-snug text-slate-400 sm:block">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
