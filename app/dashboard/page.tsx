import { createClient } from "@/lib/supabase/server";
import { SalesPerformanceCharts } from "@/components/SalesPerformanceCharts";
import { SectorCoverageChart } from "@/components/SectorCoverageChart";
import { SECTOR_OPTIONS } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: currencyRates } = await supabase
    .from("currency_rates")
    .select("usd_per_idr, sgd_per_idr")
    .eq("id", 1)
    .maybeSingle();

  const { data: projectsRaw, error } = await supabase
    .from("projects")
    .select(`
      id,
      value,
      progress_type,
      sales_id,
      customers ( sector )
    `);

  const projects = projectsRaw ?? [];
  const salesIds = [...new Set(projects.map((p: { sales_id: string }) => p.sales_id))];
  const salesNames: Record<string, string> = {};
  if (salesIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", salesIds);
    (profiles ?? []).forEach((p: { id: string; display_name: string | null; full_name: string | null }) => {
      salesNames[p.id] = p.display_name ?? p.full_name ?? "Unknown";
    });
  }

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading dashboard: {error.message}</p>
      </div>
    );
  }

  const salesValueMap = new Map<string, number>();
  const salesQtyMap = new Map<string, number>();
  const sectorMap = new Map<string, number>();

  for (const project of projects) {
    const salesId = (project as { sales_id: string }).sales_id;
    const value = Number((project as { value: unknown }).value ?? 0);
    const progressType = (project as { progress_type: string }).progress_type;
    const customerRaw = (project as { customers: { sector?: string | null } | { sector?: string | null }[] | null })
      .customers;
    const customer = Array.isArray(customerRaw) ? customerRaw[0] : customerRaw;
    const sector = customer?.sector?.trim() || "Unspecified";

    salesQtyMap.set(salesId, (salesQtyMap.get(salesId) ?? 0) + 1);
    if (progressType !== "Lose") {
      salesValueMap.set(salesId, (salesValueMap.get(salesId) ?? 0) + value);
    }
    sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1);
  }

  const salesValueData = [...salesValueMap.entries()]
    .map(([salesId, value]) => ({
      label: salesNames[salesId] ?? "Unknown",
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const salesQtyData = [...salesQtyMap.entries()]
    .map(([salesId, value]) => ({
      label: salesNames[salesId] ?? "Unknown",
      value,
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
        usdPerIdr={Number(currencyRates?.usd_per_idr ?? 0.000065)}
        sgdPerIdr={Number(currencyRates?.sgd_per_idr ?? 0.000086)}
      />

      <SectorCoverageChart sectorData={sectorData} />
    </div>
  );
}
