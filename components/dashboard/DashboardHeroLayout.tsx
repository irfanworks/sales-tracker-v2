"use client";

import {
  CurrencyProvider,
  CurrencyToggle,
  useCurrencyScope,
} from "@/components/ui/CurrencyToggle";
import { DashboardSummaryCard } from "@/components/dashboard/DashboardSummaryCard";
import { DashboardCountCards } from "@/components/dashboard/DashboardCountCards";
import { TargetDonutCard } from "@/components/dashboard/TargetDonutCard";
import { LazyQuoteSubmittedChart } from "@/components/dashboard/LazyQuoteSubmittedChart";
import type { MonthlyQuotePoint } from "@/lib/dashboard";

function HeroBody({
  totalPipelineValue,
  hotProspectValue,
  totalWon,
  closingForTarget,
  annualSalesTarget,
  targetAchievementPct,
  totalProposals,
  totalProjectWinCount,
  totalHotProspectCount,
  tenderOnProgress,
  series3m,
  series12m,
  targetCaption,
  children,
}: {
  totalPipelineValue: number;
  hotProspectValue: number;
  totalWon: number;
  closingForTarget: number;
  annualSalesTarget: number | null;
  targetAchievementPct: number | null;
  totalProposals: number;
  totalProjectWinCount: number;
  totalHotProspectCount: number;
  tenderOnProgress: number;
  series3m: MonthlyQuotePoint[];
  series12m: MonthlyQuotePoint[];
  targetCaption?: string;
  children?: React.ReactNode;
}) {
  const scope = useCurrencyScope();
  if (!scope) return null;

  const { currency, setCurrency, usdPerIdr, sgdPerIdr } = scope;

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

      <DashboardCountCards
        totalProposals={totalProposals}
        totalProjectWinCount={totalProjectWinCount}
        totalHotProspectCount={totalHotProspectCount}
        tenderOnProgress={tenderOnProgress}
      />

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
            fillHeight
          />
        </div>
      </div>

      {children}
    </div>
  );
}

export function DashboardHeroLayout({
  totalPipelineValue,
  hotProspectValue,
  totalWon,
  closingForTarget,
  annualSalesTarget,
  targetAchievementPct,
  totalProposals,
  totalProjectWinCount,
  totalHotProspectCount,
  tenderOnProgress,
  series3m,
  series12m,
  usdPerIdr,
  sgdPerIdr,
  targetCaption,
  children,
}: {
  totalPipelineValue: number;
  hotProspectValue: number;
  totalWon: number;
  closingForTarget: number;
  annualSalesTarget: number | null;
  targetAchievementPct: number | null;
  totalProposals: number;
  totalProjectWinCount: number;
  totalHotProspectCount: number;
  tenderOnProgress: number;
  series3m: MonthlyQuotePoint[];
  series12m: MonthlyQuotePoint[];
  usdPerIdr: number;
  sgdPerIdr: number;
  targetCaption?: string;
  children?: React.ReactNode;
}) {
  return (
    <CurrencyProvider usdPerIdr={usdPerIdr} sgdPerIdr={sgdPerIdr}>
      <HeroBody
        totalPipelineValue={totalPipelineValue}
        hotProspectValue={hotProspectValue}
        totalWon={totalWon}
        closingForTarget={closingForTarget}
        annualSalesTarget={annualSalesTarget}
        targetAchievementPct={targetAchievementPct}
        totalProposals={totalProposals}
        totalProjectWinCount={totalProjectWinCount}
        totalHotProspectCount={totalHotProspectCount}
        tenderOnProgress={tenderOnProgress}
        series3m={series3m}
        series12m={series12m}
        targetCaption={targetCaption}
      >
        {children}
      </HeroBody>
    </CurrencyProvider>
  );
}
