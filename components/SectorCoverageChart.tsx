"use client";

import { Building2 } from "lucide-react";
import { BarChart } from "@/components/BarChart";

export function SectorCoverageChart({
  sectorData,
}: {
  sectorData: { label: string; value: number }[];
}) {
  return (
    <div className="card-elevated p-5 sm:p-6">
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Building2 className="h-4 w-4" />
        </div>
        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
          Sector coverage
        </h2>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Project distribution by customer sector category.
      </p>
      <BarChart
        data={sectorData}
        formatValue={(n) => n.toLocaleString("en-US")}
        barClassName="bg-amber-500"
      />
    </div>
  );
}
