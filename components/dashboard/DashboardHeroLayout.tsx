"use client";

import { CurrencyToggle, type Currency } from "@/components/ui/CurrencyToggle";
import { useState } from "react";
import { DashboardSummaryCard } from "@/components/dashboard/DashboardSummaryCard";
import { TargetDonutCard } from "@/components/dashboard/TargetDonutCard";
import { LazyQuoteSubmittedChart } from "@/components/dashboard/LazyQuoteSubmittedChart";
import type { MonthlyQuotePoint } from "@/lib/dashboard";

export function DashboardHeroLayout({
  totalPipelineValue,
  hotProspectValue,
  totalWon,
  closingForTarget,
  annualSalesTarget,
  targetAchievementPct,
  series3m,
  series12m,
  usdPerIdr,
  sgdPerIdr,
  targetCaption,
}: {
  totalPipelineValue: number;
  hotProspectValue: number;
  totalWon: number;
  closingForTarget: number;
  annualSalesTarget: number | null;
  targetAchievementPct: number | null;
  series3m: MonthlyQuotePoint[];
  series12m: MonthlyQuotePoint[];
  usdPerIdr: number;
  sgdPerIdr: number;
  targetCaption?: string;
}) {
  const [currency, setCurrency] = useState<Currency>("IDR");

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardSummaryCard
          label="Total Pipeline"
          valueIdr={totalPipelineValue}
          currency={currency}
          usdPerIdr={usdPerIdr}
          sgdPerIdr={sgdPerIdr}
        />
        <DashboardSummaryCard
          label="Hot Prospect"
          valueIdr={hotProspectValue}
          currency={currency}
          usdPerIdr={usdPerIdr}
          sgdPerIdr={sgdPerIdr}
        />
        <DashboardSummaryCard
          label="Project Won"
          valueIdr={totalWon}
          currency={currency}
          usdPerIdr={usdPerIdr}
          sgdPerIdr={sgdPerIdr}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-1">
          <TargetDonutCard
            closingForTarget={closingForTarget}
            annualSalesTarget={annualSalesTarget}
            targetAchievementPct={targetAchievementPct}
            currency={currency}
            usdPerIdr={usdPerIdr}
            sgdPerIdr={sgdPerIdr}
            caption={targetCaption}
          />
        </div>
        <div className="lg:col-span-2">
          <LazyQuoteSubmittedChart
            series3m={series3m}
            series12m={series12m}
            usdPerIdr={usdPerIdr}
            sgdPerIdr={sgdPerIdr}
            currency={currency}
            fillHeight
          />
        </div>
      </div>
    </div>
  );
}
