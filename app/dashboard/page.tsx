import dynamic from "next/dynamic";
import { getSupabase } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import { SECTOR_OPTIONS } from "@/lib/types/database";
import { LayoutDashboard } from "lucide-react";

const SalesPerformanceCharts = dynamic(
  () =>
    import("@/components/SalesPerformanceCharts").then((m) => ({
      default: m.SalesPerformanceCharts,
    })),
  { loading: () => <ChartSkeleton /> }
);

const SectorCoverageChart = dynamic(
  () =>
    import("@/components/SectorCoverageChart").then((m) => ({
      default: m.SectorCoverageChart,
    })),
  { loading: () => <ChartSkeleton /> }
);

type SalesPerformanceRow = {
  sales_id: string;
  total_value: number;
  project_count: number;
};

type SectorCoverageRow = {
  sector: string;
  project_count: number;
};

async function loadDashboardFromProjects(supabase: Awaited<ReturnType<typeof getSupabase>>) {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("value, progress_type, outcome_status, sales_id, customers ( sector )");

  if (error) throw error;

  const rows = projects ?? [];
  const salesValueMap = new Map<string, number>();
  const salesQtyMap = new Map<string, number>();
  const sectorMap = new Map<string, number>();

  for (const project of rows) {
    const salesId = project.sales_id as string;
    const value = Number(project.value ?? 0);
    const customerRaw = project.customers as { sector?: string | null } | { sector?: string | null }[] | null;
    const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;
    const sector = customer?.sector?.trim() || "Unspecified";

    salesQtyMap.set(salesId, (salesQtyMap.get(salesId) ?? 0) + 1);
    if (project.outcome_status !== "Lose") {
      salesValueMap.set(salesId, (salesValueMap.get(salesId) ?? 0) + value);
    }
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1);
  }

  const salesIds = [...salesValueMap.keys()];
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

  const salesValueData = [...salesValueMap.entries()]
    .map(([salesId, value]) => ({ label: salesNames[salesId] ?? "Unknown", value }))
    .sort((a, b) => b.value - a.value);

  const salesQtyData = [...salesQtyMap.entries()]
    .map(([salesId, value]) => ({ label: salesNames[salesId] ?? "Unknown", value }))
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

  return { salesValueData, salesQtyData, sectorData };
}

export default async function DashboardPage() {
  const supabase = await getSupabase();
  const currencyRates = await getCurrencyRates();

  const [salesPerformanceResult, sectorCoverageResult] = await Promise.all([
    supabase.rpc("get_sales_performance"),
    supabase.rpc("get_sector_coverage"),
  ]);

  let salesValueData: { label: string; value: number }[] = [];
  let salesQtyData: { label: string; value: number }[] = [];
  let sectorData: { label: string; value: number }[] = [];
  let loadError: string | null = null;

  if (salesPerformanceResult.error || sectorCoverageResult.error) {
    try {
      const fallback = await loadDashboardFromProjects(supabase);
      salesValueData = fallback.salesValueData;
      salesQtyData = fallback.salesQtyData;
      sectorData = fallback.sectorData;
    } catch (err) {
      loadError =
        salesPerformanceResult.error?.message ??
        sectorCoverageResult.error?.message ??
        (err instanceof Error ? err.message : "Unknown error");
    }
  } else {
    const salesPerformance = (salesPerformanceResult.data ?? []) as SalesPerformanceRow[];
    const sectorCoverage = (sectorCoverageResult.data ?? []) as SectorCoverageRow[];

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

    salesValueData = salesPerformance
      .map((row) => ({
        label: salesNames[row.sales_id] ?? "Unknown",
        value: Number(row.total_value ?? 0),
      }))
      .sort((a, b) => b.value - a.value);

    salesQtyData = salesPerformance
      .map((row) => ({
        label: salesNames[row.sales_id] ?? "Unknown",
        value: Number(row.project_count ?? 0),
      }))
      .sort((a, b) => b.value - a.value);

    sectorData = [
      ...SECTOR_OPTIONS.map((sector) => ({
        label: sector,
        value: sectorMap.get(sector) ?? 0,
      })),
      ...[...sectorMap.entries()]
        .filter(([sector]) => !(SECTOR_OPTIONS as readonly string[]).includes(sector))
        .map(([label, value]) => ({ label, value })),
    ].filter((item) => item.value > 0 || (SECTOR_OPTIONS as readonly string[]).includes(item.label));
  }

  if (loadError) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading dashboard: {loadError}</p>
        <p className="mt-2 text-sm text-slate-600">
          Ensure migrations <code className="text-xs">013</code> and{" "}
          <code className="text-xs">015</code> are applied in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Sales performance and sector coverage overview."
      />

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
