"use client";

import { useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

/** Compact summary tile matching the wireframe top row */
export function DashboardSummaryCard({
  label,
  valueIdr,
  currency,
  usdPerIdr,
  sgdPerIdr,
}: {
  label: string;
  valueIdr: number;
  currency: Currency;
  usdPerIdr: number;
  sgdPerIdr: number;
}) {
  const formatCurrency = useCurrencyFormatter(currency);

  const toCurrency = (valueInIdr: number) => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  return (
    <div className="rounded-2xl border border-slate-300/80 bg-slate-100/80 px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className="mt-3 min-w-0 overflow-x-auto whitespace-nowrap text-[clamp(0.95rem,1.4vw+0.45rem,1.45rem)] font-bold tracking-tight text-slate-900 tabular-nums">
        {formatCurrency(toCurrency(valueIdr))}
      </p>
    </div>
  );
}
