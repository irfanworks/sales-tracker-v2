"use client";

import { useState } from "react";
import { BarChart3, Award, TrendingUp } from "lucide-react";

type Currency = "IDR" | "USD" | "SGD";

export function ProjectsSummaryCards({
  totalValueProject,
  totalValueWin,
  totalValueHotProspect,
  usdPerIdr,
  sgdPerIdr,
}: {
  totalValueProject: number;
  totalValueWin: number;
  totalValueHotProspect: number;
  usdPerIdr: number;
  sgdPerIdr: number;
}) {
  const [currency, setCurrency] = useState<Currency>("IDR");

  const toCurrency = (valueInIdr: number): number => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const valueFontClass =
    "mt-2 min-w-0 font-bold leading-tight text-slate-900 whitespace-nowrap overflow-x-auto " +
    "text-[clamp(0.6875rem,1.2vw+0.4rem,1.125rem)]";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Currency:</span>
        {(["IDR", "USD", "SGD"] as const).map((cur) => (
          <button
            key={cur}
            type="button"
            onClick={() => setCurrency(cur)}
            className={`rounded-md border px-3 py-1 text-sm ${
              currency === cur
                ? "border-cyan-700 bg-cyan-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cur}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card flex items-start gap-5 p-6 ring-2 ring-slate-200/60 bg-slate-50/30">
          <div className="rounded-xl bg-slate-200 p-3 text-slate-700 shrink-0">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Total Value Project</p>
            <p className={valueFontClass}>{formatCurrency(toCurrency(totalValueProject))}</p>
            <p className="mt-1 text-xs text-slate-500">filtered results, excluding Lose</p>
          </div>
        </div>
        <div className="card flex items-start gap-5 p-6 ring-2 ring-cyan-200/60 bg-cyan-50/30">
          <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700 shrink-0">
            <Award className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Total Value Win</p>
            <p className={valueFontClass}>{formatCurrency(toCurrency(totalValueWin))}</p>
            <p className="mt-1 text-xs text-slate-500">Win projects in current view</p>
          </div>
        </div>
        <div className="card flex items-start gap-5 p-6 ring-2 ring-emerald-200/60 bg-emerald-50/30">
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 shrink-0">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Total Value Hot Prospect</p>
            <p className={valueFontClass}>{formatCurrency(toCurrency(totalValueHotProspect))}</p>
            <p className="mt-1 text-xs text-slate-500">Hot Prospect in current view, excluding Lose</p>
          </div>
        </div>
      </div>
    </div>
  );
}
