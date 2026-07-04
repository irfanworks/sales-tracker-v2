"use client";

import { useState } from "react";
import { BarChart3, Hash } from "lucide-react";
import { BarChart } from "@/components/BarChart";
import { CurrencyToggle, useCurrencyFormatter, type Currency } from "@/components/ui/CurrencyToggle";

export function SalesPerformanceCharts({
  salesValueData,
  salesQtyData,
  usdPerIdr,
  sgdPerIdr,
}: {
  salesValueData: { label: string; value: number }[];
  salesQtyData: { label: string; value: number }[];
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

  const valueChartData = salesValueData.map((d) => ({
    label: d.label,
    value: toCurrency(d.value),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">Value chart currency</span>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="card-elevated p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Sales by value
            </h2>
          </div>
          <p className="mb-5 text-sm text-slate-500">
            Individual achievement based on project value.
          </p>
          <BarChart data={valueChartData} formatValue={formatCurrency} barClassName="bg-cyan-600" />
        </div>

        <div className="card-elevated p-5 sm:p-6">
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Hash className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Sales by quantity
            </h2>
          </div>
          <p className="mb-5 text-sm text-slate-500">
            Individual achievement based on number of projects.
          </p>
          <BarChart
            data={salesQtyData}
            formatValue={(n) => n.toLocaleString("en-US")}
            barClassName="bg-emerald-600"
          />
        </div>
      </div>
    </div>
  );
}
