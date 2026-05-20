"use client";

import { useState } from "react";
import { BarChart3, Hash } from "lucide-react";
import { BarChart } from "@/components/BarChart";

type Currency = "IDR" | "USD" | "SGD";

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

  const toCurrency = (valueInIdr: number): number => {
    if (currency === "USD") return valueInIdr * usdPerIdr;
    if (currency === "SGD") return valueInIdr * sgdPerIdr;
    return valueInIdr;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const valueChartData = salesValueData.map((d) => ({
    label: d.label,
    value: toCurrency(d.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Currency (value chart):</span>
        {(["IDR", "USD", "SGD"] as const).map((cur) => (
          <button
            key={cur}
            type="button"
            onClick={() => setCurrency(cur)}
            className={`rounded-md border px-3 py-1 text-sm ${
              currency === cur
                ? "border-cyan-700 bg-cyan-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cur}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-700" />
            <h2 className="text-lg font-semibold text-slate-800">Sales performance by value</h2>
          </div>
          <p className="mb-4 text-sm text-slate-600">Individual sales achievement based on project value.</p>
          <BarChart data={valueChartData} formatValue={formatCurrency} barClassName="bg-cyan-600" />
        </div>

        <div className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-800">Sales performance by quantity</h2>
          </div>
          <p className="mb-4 text-sm text-slate-600">Individual sales achievement based on number of projects.</p>
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
