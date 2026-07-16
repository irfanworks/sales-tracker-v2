"use client";

import Link from "next/link";
import { useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

function compactIdr(n: number, currency: Currency, formatCurrency: (n: number) => string) {
  if (currency !== "IDR") return formatCurrency(n);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return formatCurrency(n);
}

export function TargetDonutCard({
  closingForTarget,
  annualSalesTarget,
  targetAchievementPct,
  currency,
  usdPerIdr,
  sgdPerIdr,
  caption,
}: {
  closingForTarget: number;
  annualSalesTarget: number | null;
  targetAchievementPct: number | null;
  currency: Currency;
  usdPerIdr: number;
  sgdPerIdr: number;
  caption?: string;
}) {
  const formatCurrency = useCurrencyFormatter(currency);

  const toCurrency = (valueInIdr: number) => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  const hasTarget = annualSalesTarget != null && annualSalesTarget > 0;
  const pct = Math.min(100, Math.max(0, targetAchievementPct ?? 0));
  const size = 220;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progressLen = (pct / 100) * c;

  const closing = toCurrency(closingForTarget);
  const target = hasTarget ? toCurrency(annualSalesTarget!) : 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-300/80 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-800">Target</p>
      {hasTarget ? (
        <p className="mt-2 min-w-0 overflow-x-auto whitespace-nowrap text-[clamp(1.1rem,1.8vw+0.5rem,1.75rem)] font-bold tracking-tight text-red-600 tabular-nums">
          {formatCurrency(target)}
        </p>
      ) : (
        <p className="mt-2 text-sm font-medium text-slate-500">
          Set annual target in{" "}
          <Link href="/dashboard/settings" className="font-semibold text-cyan-700 hover:underline">
            Settings
          </Link>
        </p>
      )}

      <div className="relative mx-auto mt-6 flex flex-1 items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1e3a5f"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#f97316"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progressLen} ${c - progressLen}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex rotate-0 flex-col items-center justify-center px-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Progress
          </p>
          <p className="mt-1 text-sm font-bold tabular-nums leading-snug text-slate-800 sm:text-base">
            {hasTarget
              ? `${compactIdr(closing, currency, formatCurrency)} / ${compactIdr(target, currency, formatCurrency)}`
              : "— / —"}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-orange-600">
            {hasTarget ? `${pct.toFixed(0)}%` : "0%"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        {caption ?? "Closing (Won) vs annual sales target"}
      </p>
    </div>
  );
}
