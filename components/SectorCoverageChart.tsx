
import { Building2 } from "lucide-react";
import { BarChart } from "@/components/BarChart";

export function SectorCoverageChart({
  sectorData,
}: {
  sectorData: { label: string; value: number }[];
}) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-amber-700" />
        <h2 className="text-lg font-semibold text-slate-800">Sector coverage</h2>
      </div>
      <p className="mb-4 text-sm text-slate-600">
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
