"use client";

import { BarChart3, Award, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { CurrencyScopeToggle, useCurrencyScope } from "@/components/ui/CurrencyToggle";
import { ProjectsSecondaryCards } from "@/components/ProjectsSecondaryCards";

export function ProjectsSummaryCards({
  totalValueProject,
  totalValueWin,
  totalValueHotProspect,
  projectLose,
  projectOnHold,
  valueProjectOnHold,
  tenderOnProgress,
  usdPerIdr,
  sgdPerIdr,
}: {
  totalValueProject: number;
  totalValueWin: number;
  totalValueHotProspect: number;
  projectLose: number;
  projectOnHold: number;
  valueProjectOnHold: number;
  tenderOnProgress: number;
  usdPerIdr: number;
  sgdPerIdr: number;
}) {
  const scope = useCurrencyScope();
  const currency = scope?.currency ?? "IDR";
  const rates = {
    usdPerIdr: scope?.usdPerIdr ?? usdPerIdr,
    sgdPerIdr: scope?.sgdPerIdr ?? sgdPerIdr,
  };

  const formatValue = (valueInIdr: number) => {
    if (scope) return scope.format(valueInIdr);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valueInIdr);
  };

  const valueClass =
    "min-w-0 overflow-x-auto whitespace-nowrap text-[clamp(0.875rem,1.5vw+0.25rem,1.375rem)]";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CurrencyScopeToggle />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Quoted Project"
          value={<span className={valueClass}>{formatValue(totalValueProject)}</span>}
          hint="Excluding Lose and On Hold outcomes"
          icon={BarChart3}
          variant="default"
        />
        <MetricCard
          label="Project Win"
          value={<span className={valueClass}>{formatValue(totalValueWin)}</span>}
          hint="Win outcome in current view"
          icon={Award}
          variant="cyan"
        />
        <MetricCard
          label="Hot Prospect"
          value={<span className={valueClass}>{formatValue(totalValueHotProspect)}</span>}
          hint="Hot Prospect in current view, excluding Lose and On Hold"
          icon={TrendingUp}
          variant="emerald"
        />
      </div>
      <ProjectsSecondaryCards
        projectLose={projectLose}
        projectOnHold={projectOnHold}
        valueProjectOnHold={valueProjectOnHold}
        tenderOnProgress={tenderOnProgress}
        currency={currency}
        usdPerIdr={rates.usdPerIdr}
        sgdPerIdr={rates.sgdPerIdr}
      />
    </div>
  );
}
