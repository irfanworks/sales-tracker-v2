"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

function compactIdr(n: number, currency: Currency, formatCurrency: (n: number) => string) {
  if (currency !== "IDR") return formatCurrency(n);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `Rp ${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  return formatCurrency(n);
}

export function DashboardTargetBanner({
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
  const pct = hasTarget ? Math.min(100, Math.max(0, targetAchievementPct ?? 0)) : 0;
  const closing = toCurrency(closingForTarget);
  const target = hasTarget ? toCurrency(annualSalesTarget!) : 0;
  const remaining = hasTarget ? Math.max(0, target - closing) : 0;

  const barTone =
    pct >= 100
      ? "from-emerald-400 to-emerald-600"
      : pct >= 60
        ? "from-cyan-400 to-cyan-600"
        : pct >= 30
          ? "from-amber-400 to-orange-500"
          : "from-orange-400 to-red-500";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-gradient-to-br from-[#0f2744] via-[#143456] to-[#0f2744] text-white shadow-sm">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300 ring-1 ring-white/15">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200/90">
                  Sales Target
                </p>
                {hasTarget ? (
                  <p className="mt-1 min-w-0 overflow-x-auto whitespace-nowrap text-[clamp(1.25rem,2vw+0.55rem,1.85rem)] font-bold tracking-tight tabular-nums text-white">
                    {formatCurrency(target)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-300">
                    Set your annual target in{" "}
                    <Link
                      href="/dashboard/settings"
                      className="font-semibold text-cyan-300 underline-offset-2 hover:underline"
                    >
                      Settings
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-2 text-right ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Achievement
              </p>
              <p
                className={`mt-0.5 text-3xl font-bold tabular-nums leading-none ${
                  pct >= 100 ? "text-emerald-300" : "text-orange-300"
                }`}
              >
                {hasTarget ? `${pct.toFixed(0)}%` : "—"}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>
                Closing (Won):{" "}
                <span className="font-semibold text-white">
                  {compactIdr(closing, currency, formatCurrency)}
                </span>
              </span>
              {hasTarget && (
                <span>
                  Remaining:{" "}
                  <span className="font-semibold text-amber-200">
                    {compactIdr(remaining, currency, formatCurrency)}
                  </span>
                </span>
              )}
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10"
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Target achievement"
            >
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barTone} transition-all duration-700 ease-out`}
                style={{ width: hasTarget ? `${Math.max(pct, pct > 0 ? 2 : 0)}%` : "0%" }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {caption ?? "Closing (Won) vs annual sales target — keep this number in mind every day."}
          </p>
        </div>

        {hasTarget && (
          <div className="hidden shrink-0 grid-cols-2 gap-3 sm:grid lg:grid-cols-1 lg:w-[200px]">
            <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Achieved
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-emerald-300">
                {compactIdr(closing, currency, formatCurrency)}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                To go
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums text-amber-200">
                {compactIdr(remaining, currency, formatCurrency)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
