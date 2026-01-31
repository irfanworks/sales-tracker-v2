"use client";

import { BarChart3, Award, TrendingUp, FileText, ClipboardList, Layers } from "lucide-react";

interface DashboardMetricsProps {
  totalValueProject: number;
  totalValueWin: number;
  totalValueHotLeads: number;
  totalProjects: number;
  totalBudgetary: number;
  totalTender: number;
  totalHotProspect: number;
}

export function DashboardMetrics({
  totalValueProject,
  totalValueWin,
  totalValueHotLeads,
  totalProjects,
  totalBudgetary,
  totalTender,
  totalHotProspect,
}: DashboardMetricsProps) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  // Angka satu baris, ukuran font kecil agar nilai panjang (Rp xxx.xxx.xxx.xxx) muat di card tanpa wrap
  const valueFontClass =
    "mt-2 min-w-0 font-bold leading-tight text-slate-900 whitespace-nowrap overflow-x-auto " +
    "text-[clamp(0.6875rem,1.2vw+0.4rem,1.125rem)]";

  return (
    <div className="space-y-6">
      {/* 3 card besar: Total Value Project, Total Value Win, Total Value Hot Leads — font responsive */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card flex items-start gap-5 p-6 ring-2 ring-slate-200/60 bg-slate-50/30">
          <div className="rounded-xl bg-slate-200 p-3 text-slate-700 shrink-0">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Total Value Project</p>
            <p className={valueFontClass}>{formatCurrency(totalValueProject)}</p>
            <p className="mt-1 text-xs text-slate-500">semua proyek, tanpa Lose</p>
          </div>
        </div>
        <div className="card flex items-start gap-5 p-6 ring-2 ring-cyan-200/60 bg-cyan-50/30">
          <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700 shrink-0">
            <Award className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Total Value Win</p>
            <p className={valueFontClass}>{formatCurrency(totalValueWin)}</p>
            <p className="mt-1 text-xs text-slate-500">nilai proyek Win</p>
          </div>
        </div>
        <div className="card flex items-start gap-5 p-6 ring-2 ring-emerald-200/60 bg-emerald-50/30">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 shrink-0">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Total Value Hot Leads</p>
            <p className={valueFontClass}>{formatCurrency(totalValueHotLeads)}</p>
            <p className="mt-1 text-xs text-slate-500">nilai Hot Prospect, tanpa Lose</p>
          </div>
        </div>
      </div>

      {/* Total Projects, Total Budgetary, Total Tender, Total Hot Prospect */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Projects</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-800">{totalProjects}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Budgetary</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-800">{totalBudgetary}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700 shrink-0">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Tender</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-800">{totalTender}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-700 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Hot Prospect</p>
            <p className="mt-0.5 text-xl font-semibold text-emerald-800">{totalHotProspect}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
