"use client";

import { Ban, PauseCircle, Coins, FileSearch } from "lucide-react";
import { useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

export function ProjectsSecondaryCards({
  projectLose,
  projectOnHold,
  valueProjectOnHold,
  tenderOnProgress,
  currency,
  usdPerIdr,
  sgdPerIdr,
}: {
  projectLose: number;
  projectOnHold: number;
  valueProjectOnHold: number;
  tenderOnProgress: number;
  currency: Currency;
  usdPerIdr: number;
  sgdPerIdr: number;
}) {
  const formatCurrency = useCurrencyFormatter(currency);

  const toCurrency = (valueInIdr: number): number => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  const cards = [
    {
      label: "Project Lose",
      value: projectLose.toLocaleString("en-US"),
      hint: "Count of Lose outcomes",
      icon: Ban,
      iconClass: "from-red-400 to-red-600",
      ring: "ring-red-200/50",
    },
    {
      label: "Project On Hold",
      value: projectOnHold.toLocaleString("en-US"),
      hint: "Count of On Hold outcomes",
      icon: PauseCircle,
      iconClass: "from-amber-400 to-amber-600",
      ring: "ring-amber-200/50",
    },
    {
      label: "Value Project On Hold",
      value: formatCurrency(toCurrency(valueProjectOnHold)),
      hint: "Total value of On Hold projects",
      icon: Coins,
      iconClass: "from-orange-400 to-orange-600",
      ring: "ring-orange-200/50",
    },
    {
      label: "Tender On Progress",
      value: tenderOnProgress.toLocaleString("en-US"),
      hint: "Open Tender projects still in progress",
      icon: FileSearch,
      iconClass: "from-blue-400 to-blue-600",
      ring: "ring-blue-200/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, iconClass, ring }) => (
        <div
          key={label}
          className={`card flex items-start gap-3 p-3.5 ring-1 sm:p-4 ${ring}`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${iconClass} text-white shadow-sm`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums text-slate-900 sm:text-base">
              {value}
            </p>
            <p className="mt-0.5 hidden text-[10px] leading-snug text-slate-400 sm:block">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
