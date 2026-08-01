"use client";

import type { LucideIcon } from "lucide-react";
import { FolderKanban, Flame, Trophy } from "lucide-react";
import { useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

type SummaryVariant = "pipeline" | "hot" | "won";

const VARIANT: Record<
  SummaryVariant,
  {
    icon: LucideIcon;
    hint: string;
    iconWrap: string;
    accentBar: string;
    card: string;
    label: string;
    value: string;
  }
> = {
  pipeline: {
    icon: FolderKanban,
    hint: "Active quoted pipeline value",
    iconWrap: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30",
    accentBar: "from-cyan-400 to-cyan-600",
    card: "border-cyan-500/30 bg-gradient-to-br from-[#0f2744] via-[#143456] to-[#0c1f36]",
    label: "text-cyan-200/90",
    value: "text-white",
  },
  hot: {
    icon: Flame,
    hint: "Hot opportunities still in play",
    iconWrap: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/35",
    accentBar: "from-orange-400 to-amber-500",
    card: "border-orange-500/35 bg-gradient-to-br from-[#0f2744] via-[#1a2f45] to-[#1a2218]",
    label: "text-orange-200/90",
    value: "text-white",
  },
  won: {
    icon: Trophy,
    hint: "Closed-won pipeline value",
    iconWrap: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/35",
    accentBar: "from-emerald-400 to-teal-500",
    card: "border-emerald-500/35 bg-gradient-to-br from-[#0f2744] via-[#123340] to-[#0f241c]",
    label: "text-emerald-200/90",
    value: "text-white",
  },
};

/** Primary KPI tiles — visually weighted as the dashboard’s key numbers */
export function DashboardSummaryCard({
  label,
  valueIdr,
  currency,
  usdPerIdr,
  sgdPerIdr,
  variant = "pipeline",
}: {
  label: string;
  valueIdr: number;
  currency: Currency;
  usdPerIdr: number;
  sgdPerIdr: number;
  variant?: SummaryVariant;
}) {
  const formatCurrency = useCurrencyFormatter(currency);
  const theme = VARIANT[variant];
  const Icon = theme.icon;

  const toCurrency = (valueInIdr: number) => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border px-4 py-4 transition-colors duration-150 sm:px-5 sm:py-5 ${theme.card}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${theme.accentBar}`}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${theme.label}`}
          >
            {label}
          </p>
          <p
            className={`mt-2 min-w-0 overflow-x-auto whitespace-nowrap text-[clamp(1.05rem,1.5vw+0.55rem,1.55rem)] font-semibold tracking-tight tabular-nums ${theme.value}`}
          >
            {formatCurrency(toCurrency(valueIdr))}
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-slate-400/90">{theme.hint}</p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.iconWrap}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </div>
    </div>
  );
}
