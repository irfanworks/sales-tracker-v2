"use client";

import { useState } from "react";
import { BarChart3, Award, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { CurrencyToggle, useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

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
  const formatCurrency = useCurrencyFormatter(currency);

  const toCurrency = (valueInIdr: number): number => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  const valueClass =
    "min-w-0 overflow-x-auto whitespace-nowrap text-[clamp(0.875rem,1.5vw+0.25rem,1.375rem)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">Display currency</span>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Total Value Project"
          value={<span className={valueClass}>{formatCurrency(toCurrency(totalValueProject))}</span>}
          hint="Filtered results, excluding Lose outcome"
          icon={BarChart3}
          variant="default"
        />
        <MetricCard
          label="Total Value Win"
          value={<span className={valueClass}>{formatCurrency(toCurrency(totalValueWin))}</span>}
          hint="Win outcome in current view"
          icon={Award}
          variant="cyan"
        />
        <MetricCard
          label="Total Value Hot Prospect"
          value={<span className={valueClass}>{formatCurrency(toCurrency(totalValueHotProspect))}</span>}
          hint="Hot Prospect in current view, excluding Lose"
          icon={TrendingUp}
          variant="emerald"
        />
      </div>
    </div>
  );
}
