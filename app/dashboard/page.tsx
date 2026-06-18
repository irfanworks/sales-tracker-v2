import { getSupabase } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { SalesPerformanceCharts } from "@/components/SalesPerformanceCharts";
import { SectorCoverageChart } from "@/components/SectorCoverageChart";
import { SECTOR_OPTIONS } from "@/lib/types/database";

type SalesPerformanceRow = {
  sales_id: string;
  total_value: number;
  project_count: number;
};

type SectorCoverageRow = {
  sector: string;
  project_count: number;
};

export default async function DashboardPage() {
  const supabase = await getSupabase();
  const [currencyRates, salesPerformanceResult, sectorCoverageResult] = await Promise.all([
    getCurrencyRates(),
    supabase.rpc("get_sales_performance"),
    supabase.rpc("get_sector_coverage"),
  ]);

  const salesPerformance = (salesPerformanceResult.data ?? []) as SalesPerformanceRow[];
  const sectorCoverage = (sectorCoverageResult.data ?? []) as SectorCoverageRow[];

  if (salesPerformanceResult.error || sectorCoverageResult.error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">
          Error loading dashboard:{" "}
          {salesPerformanceResult.error?.message ?? sectorCoverageResult.error?.message}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Run migration <code className="text-xs">013_dashboard_aggregations.sql</code> if this is a new deploy.
        </p>
      </div>
    );
  }

  const salesIds = salesPerformance.map((row) => row.sales_id);
  const salesNames: Record<string, string> = {};

  if (salesIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", salesIds);
    (profiles ?? []).forEach((p) => {
      salesNames[p.id] = p.display_name ?? p.full_name ?? "Unknown";
    });
  }

  const sectorMap = new Map(sectorCoverage.map((row) => [row.sector, Number(row.project_count)]));

  const salesValueData = salesPerformance
    .map((row) => ({
      label: salesNames[row.sales_id] ?? "Unknown",
      value: Number(row.total_value ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const salesQtyData = salesPerformance
    .map((row) => ({
      label: salesNames[row.sales_id] ?? "Unknown",
      value: Number(row.project_count ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  const sectorData = [
    ...SECTOR_OPTIONS.map((sector) => ({
      label: sector,
      value: sectorMap.get(sector) ?? 0,
    })),
    ...[...sectorMap.entries()]
      .filter(([sector]) => !(SECTOR_OPTIONS as readonly string[]).includes(sector))
      .map(([label, value]) => ({ label, value })),
  ].filter((item) => item.value > 0 || (SECTOR_OPTIONS as readonly string[]).includes(item.label));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-slate-600">Sales performance and sector coverage overview.</p>
      </div>

      <SalesPerformanceCharts
        salesValueData={salesValueData}
        salesQtyData={salesQtyData}
        usdPerIdr={currencyRates.usdPerIdr}
        sgdPerIdr={currencyRates.sgdPerIdr}
      />

      <SectorCoverageChart sectorData={sectorData} />
    </div>
  );
}
