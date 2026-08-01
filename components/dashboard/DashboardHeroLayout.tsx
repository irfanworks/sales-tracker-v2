"use client";

import {
  CurrencyProvider,
  CurrencyToggle,
  useCurrencyScope,
} from "@/components/ui/CurrencyToggle";
import { DashboardSummaryCard } from "@/components/dashboard/DashboardSummaryCard";
import { DashboardCountCards } from "@/components/dashboard/DashboardCountCards";
import { DashboardTargetBanner } from "@/components/dashboard/DashboardTargetBanner";
import { LazyQuoteSubmittedChart } from "@/components/dashboard/LazyQuoteSubmittedChart";
import { LazyPipelineWinsChart } from "@/components/dashboard/LazyPipelineWinsChart";
import type { DailyQuotePoint, MonthlyWinPoint } from "@/lib/dashboard";

function HeroBody({
  totalPipelineValue,
  hotProspectValue,
  totalWon,
  closingForTarget,
  annualSalesTarget,
  targetAchievementPct,
  totalProposals,
  totalProjectWinCount,
  totalProspectsCount,
  tenderOnProgress,
  quoteSeries7d,
  quoteSeries14d,
  quoteSeries30d,
  winsSeries,
  winsYear,
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
  totalProspectsCount: number;
  tenderOnProgress: number;
  quoteSeries7d: DailyQuotePoint[];
  quoteSeries14d: DailyQuotePoint[];
  quoteSeries30d: DailyQuotePoint[];
  winsSeries: MonthlyWinPoint[];
  winsYear: number;
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

      {/* Full-width target banner (3×1 above KPI row) */}
      <DashboardTargetBanner
        closingForTarget={closingForTarget}
        annualSalesTarget={annualSalesTarget}
        targetAchievementPct={targetAchievementPct}
        currency={currency}
        usdPerIdr={usdPerIdr}
        sgdPerIdr={sgdPerIdr}
        caption={targetCaption}
      />

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <DashboardSummaryCard
          label="Total Pipeline"
          valueIdr={totalPipelineValue}
          currency={currency}
          usdPerIdr={usdPerIdr}
          sgdPerIdr={sgdPerIdr}
          variant="pipeline"
        />
        <DashboardSummaryCard
          label="Hot Prospect"
          valueIdr={hotProspectValue}
          currency={currency}
          usdPerIdr={usdPerIdr}
          sgdPerIdr={sgdPerIdr}
          variant="hot"
        />
        <DashboardSummaryCard
          label="Project Won"
          valueIdr={totalWon}
          currency={currency}
          usdPerIdr={usdPerIdr}
          sgdPerIdr={sgdPerIdr}
          variant="won"
        />
      </div>

      <DashboardCountCards
        totalProposals={totalProposals}
        totalProjectWinCount={totalProjectWinCount}
        totalProspectsCount={totalProspectsCount}
        tenderOnProgress={tenderOnProgress}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <LazyQuoteSubmittedChart
          series7d={quoteSeries7d}
          series14d={quoteSeries14d}
          series30d={quoteSeries30d}
        />
        <LazyPipelineWinsChart series={winsSeries} year={winsYear} />
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
  totalProspectsCount,
  tenderOnProgress,
  quoteSeries7d,
  quoteSeries14d,
  quoteSeries30d,
  winsSeries,
  winsYear,
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
  totalProspectsCount: number;
  tenderOnProgress: number;
  quoteSeries7d: DailyQuotePoint[];
  quoteSeries14d: DailyQuotePoint[];
  quoteSeries30d: DailyQuotePoint[];
  winsSeries: MonthlyWinPoint[];
  winsYear: number;
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
        totalProspectsCount={totalProspectsCount}
        tenderOnProgress={tenderOnProgress}
        quoteSeries7d={quoteSeries7d}
        quoteSeries14d={quoteSeries14d}
        quoteSeries30d={quoteSeries30d}
        winsSeries={winsSeries}
        winsYear={winsYear}
        targetCaption={targetCaption}
      >
        {children}
      </HeroBody>
    </CurrencyProvider>
  );
}
