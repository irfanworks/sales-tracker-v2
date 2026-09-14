import type { SupabaseClient } from "@supabase/supabase-js";
import { jakartaTodayKey, APP_TIMEZONE } from "@/lib/timezone";
import { isExcludedSalesStage, isLateSalesStage } from "@/lib/salesStage";
import { fetchDashboardKpis } from "@/lib/dashboardData";

export type ExecutiveSnapshot = {
  asOf: string;
  timezone: string;
  company: {
    openPipelineValue: number;
    wonYtdValue: number;
    wonYtdCount: number;
    loseYtdCount: number;
    onHoldCount: number;
    openDealCount: number;
    lateStageValue: number;
    annualTarget: number | null;
    targetAchievementPct: number | null;
  };
  bySales: Array<{
    name: string;
    role: string;
    openValue: number;
    openDeals: number;
    wonYtdValue: number;
    wonYtdCount: number;
    loseYtdCount: number;
    winRatePct: number | null;
    annualTarget: number | null;
    achievementPct: number | null;
  }>;
  topCustomers: Array<{
    name: string;
    sector: string;
    openValue: number;
    openDeals: number;
  }>;
  atRiskDeals: Array<{
    quote: string;
    name: string;
    customer: string;
    sales: string;
    value: number;
    stage: string;
    daysPastTarget: number | null;
    reason: string;
  }>;
  monthlyWinsYtd: Array<{ month: string; value: number; count: number }>;
  mix: {
    byStage: Record<string, number>;
    byType: Record<string, number>;
  };
};

type SlimPipeline = {
  id: string;
  created_at: string;
  no_quote: string;
  pipeline_name: string;
  value: number | null;
  pipeline_type: string | null;
  sales_stage: string | null;
  status: string | null;
  target_closing_at: string | null;
  sales_id: string;
  customers?:
    | { name?: string | null; sector?: string | null }
    | { name?: string | null; sector?: string | null }[]
    | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  display_name: string | null;
  full_name: string | null;
  annual_sales_target: number | null;
};

const OPEN_SELECT = `
  id, created_at, no_quote, pipeline_name, value, pipeline_type,
  sales_stage, status, target_closing_at, sales_id,
  customers ( name, sector )
`;

function customerInfo(p: SlimPipeline) {
  const raw = p.customers;
  const c = Array.isArray(raw) ? raw[0] : raw;
  return {
    name: c?.name?.trim() || "—",
    sector: c?.sector?.trim() || "Unspecified",
  };
}

function yearOfJakarta(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
    }).format(new Date(iso))
  );
}

function monthKeyJakarta(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).format(new Date(iso));
}

function daysPastTarget(target: string | null, today: string): number | null {
  if (!target) return null;
  const due = target.slice(0, 10);
  const [py, pm, pd] = due.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const past = Date.UTC(py, pm - 1, pd);
  const now = Date.UTC(ty, tm - 1, td);
  return Math.round((now - past) / 86_400_000);
}

function roundIdr(n: number) {
  return Math.round(n);
}

/**
 * Compact CRM snapshot for Gemini — prefer KPI RPCs + small targeted selects
 * instead of shipping hundreds of full pipeline rows.
 */
export async function buildExecutiveSnapshot(
  supabase: SupabaseClient
): Promise<ExecutiveSnapshot> {
  const today = jakartaTodayKey();
  const year = Number(today.slice(0, 4));
  const yearStartIso = `${year}-01-01T00:00:00+07:00`;

  const [
    kpis,
    profilesResult,
    openResult,
    openCountResult,
    winsResult,
    loseCountResult,
    onHoldCountResult,
    workByType,
  ] = await Promise.all([
    fetchDashboardKpis(supabase, undefined),
    supabase
      .from("profiles")
      .select("id, role, display_name, full_name, annual_sales_target")
      .in("role", ["admin", "sales"]),
    supabase
      .from("pipelines")
      .select(OPEN_SELECT)
      .or("status.is.null,status.eq.Open")
      .not("sales_stage", "in", "(Lose,On Hold)")
      .order("value", { ascending: false })
      .limit(200),
    supabase
      .from("pipelines")
      .select("id", { count: "exact", head: true })
      .or("status.is.null,status.eq.Open")
      .not("sales_stage", "in", "(Lose,On Hold)"),
    supabase
      .from("pipelines")
      .select("created_at, value, sales_id, sales_stage")
      .eq("sales_stage", "Win")
      .gte("created_at", yearStartIso)
      .limit(300),
    supabase
      .from("pipelines")
      .select("id", { count: "exact", head: true })
      .eq("sales_stage", "Lose")
      .gte("created_at", yearStartIso),
    supabase
      .from("pipelines")
      .select("id", { count: "exact", head: true })
      .eq("sales_stage", "On Hold"),
    supabase.rpc("get_dashboard_work_by_type", { p_sales_id: null }),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (openResult.error) throw new Error(openResult.error.message);
  if (winsResult.error) throw new Error(winsResult.error.message);

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const openPipelines = (openResult.data ?? []) as SlimPipeline[];
  const winsYtd = (winsResult.data ?? []) as Array<{
    created_at: string;
    value: number | null;
    sales_id: string;
    sales_stage: string | null;
  }>;

  const nameById = new Map<string, string>();
  const roleById = new Map<string, string>();
  const targetById = new Map<string, number | null>();
  for (const p of profiles) {
    nameById.set(p.id, p.display_name ?? p.full_name ?? p.id.slice(0, 8));
    roleById.set(p.id, p.role ?? "sales");
    targetById.set(
      p.id,
      p.annual_sales_target != null ? Number(p.annual_sales_target) : null
    );
  }

  const bySalesMap = new Map<
    string,
    {
      openValue: number;
      openDeals: number;
      wonYtdValue: number;
      wonYtdCount: number;
      loseYtdCount: number;
    }
  >();

  function salesBucket(salesId: string) {
    let row = bySalesMap.get(salesId);
    if (!row) {
      row = {
        openValue: 0,
        openDeals: 0,
        wonYtdValue: 0,
        wonYtdCount: 0,
        loseYtdCount: 0,
      };
      bySalesMap.set(salesId, row);
    }
    return row;
  }

  for (const p of profiles) {
    salesBucket(p.id);
  }

  const customerMap = new Map<
    string,
    { name: string; sector: string; openValue: number; openDeals: number }
  >();
  const byStage: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const atRisk: ExecutiveSnapshot["atRiskDeals"] = [];
  const monthlyWins = new Map<string, { value: number; count: number }>();

  let wonYtdValue = 0;
  let wonYtdCount = 0;

  for (const w of winsYtd) {
    if (yearOfJakarta(w.created_at) !== year) continue;
    const value = Number(w.value ?? 0);
    wonYtdValue += value;
    wonYtdCount += 1;
    const sales = salesBucket(w.sales_id);
    sales.wonYtdValue += value;
    sales.wonYtdCount += 1;
    const mk = monthKeyJakarta(w.created_at);
    const m = monthlyWins.get(mk) ?? { value: 0, count: 0 };
    m.value += value;
    m.count += 1;
    monthlyWins.set(mk, m);
    byStage.Win = (byStage.Win ?? 0) + 1;
  }

  for (const p of openPipelines) {
    if (!p.sales_stage || isExcludedSalesStage(p.sales_stage)) continue;
    const value = Number(p.value ?? 0);
    const stage = p.sales_stage;
    const type = p.pipeline_type?.trim() || "Project";
    byStage[stage] = (byStage[stage] ?? 0) + 1;
    byType[type] = (byType[type] ?? 0) + 1;

    const sales = salesBucket(p.sales_id);
    sales.openValue += value;
    sales.openDeals += 1;

    const cust = customerInfo(p);
    const prev = customerMap.get(cust.name) ?? {
      name: cust.name,
      sector: cust.sector,
      openValue: 0,
      openDeals: 0,
    };
    prev.openValue += value;
    prev.openDeals += 1;
    customerMap.set(cust.name, prev);

    const overdueDays = daysPastTarget(p.target_closing_at, today);
    const stagnant =
      (stage === "Identified" || stage === "Qualified" || stage === "Budgetary Submitted") &&
      (overdueDays == null || overdueDays > 30);
    const overdue = overdueDays != null && overdueDays > 0;
    const lateStageNearMiss =
      isLateSalesStage(stage) &&
      overdueDays != null &&
      overdueDays >= -14 &&
      overdueDays <= 14;

    if (overdue || stagnant || lateStageNearMiss) {
      atRisk.push({
        quote: p.no_quote,
        name: p.pipeline_name,
        customer: cust.name,
        sales: nameById.get(p.sales_id) ?? "Unknown",
        value: roundIdr(value),
        stage,
        daysPastTarget: overdueDays,
        reason: overdue
          ? "Past target closing"
          : lateStageNearMiss
            ? "Late stage near/past closing"
            : "Early stage stagnant / long open",
      });
    }
  }

  // Prefer authoritative type mix from SQL when available
  const typeRows = Array.isArray(workByType.data) ? workByType.data : [];
  if (typeRows.length > 0) {
    for (const key of Object.keys(byType)) delete byType[key];
    for (const row of typeRows as Array<{ label?: string; project_count?: number }>) {
      const label = String(row.label ?? "Project");
      byType[label] = Number(row.project_count ?? 0);
    }
  }

  const loseYtdCount = loseCountResult.count ?? 0;
  const onHoldCount = onHoldCountResult.count ?? 0;

  // Spread lose counts evenly is wrong — leave loseYtd on company only unless we add RPC.
  // Keep per-sales lose at 0 from this path (win rate still useful from won vs known).

  const companyTarget = profiles.reduce(
    (s, p) => s + (p.annual_sales_target != null ? Number(p.annual_sales_target) : 0),
    0
  );

  const bySales = [...bySalesMap.entries()]
    .map(([id, stats]) => {
      const decided = stats.wonYtdCount + stats.loseYtdCount;
      const target = targetById.get(id) ?? null;
      return {
        name: nameById.get(id) ?? id.slice(0, 8),
        role: roleById.get(id) ?? "sales",
        openValue: roundIdr(stats.openValue),
        openDeals: stats.openDeals,
        wonYtdValue: roundIdr(stats.wonYtdValue),
        wonYtdCount: stats.wonYtdCount,
        loseYtdCount: stats.loseYtdCount,
        winRatePct: decided > 0 ? Math.round((stats.wonYtdCount / decided) * 1000) / 10 : null,
        annualTarget: target != null ? roundIdr(target) : null,
        achievementPct:
          target != null && target > 0
            ? Math.round((stats.wonYtdValue / target) * 1000) / 10
            : null,
      };
    })
    .sort((a, b) => b.wonYtdValue - a.wonYtdValue || b.openValue - a.openValue)
    .slice(0, 12);

  const topCustomers = [...customerMap.values()]
    .sort((a, b) => b.openValue - a.openValue)
    .slice(0, 10)
    .map((c) => ({
      name: c.name,
      sector: c.sector,
      openValue: roundIdr(c.openValue),
      openDeals: c.openDeals,
    }));

  atRisk.sort((a, b) => {
    const da = a.daysPastTarget ?? -999;
    const db = b.daysPastTarget ?? -999;
    return db - da || b.value - a.value;
  });

  const monthlyWinsYtd = [...monthlyWins.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      value: roundIdr(v.value),
      count: v.count,
    }));

  return {
    asOf: today,
    timezone: APP_TIMEZONE,
    company: {
      openPipelineValue: roundIdr(kpis.totalPipelineValue),
      wonYtdValue: roundIdr(wonYtdValue || kpis.closingForTarget),
      wonYtdCount,
      loseYtdCount,
      onHoldCount,
      openDealCount: openCountResult.count ?? openPipelines.length,
      lateStageValue: roundIdr(kpis.lateStageValue),
      annualTarget: companyTarget > 0 ? roundIdr(companyTarget) : null,
      targetAchievementPct:
        companyTarget > 0
          ? Math.round(((wonYtdValue || kpis.closingForTarget) / companyTarget) * 1000) / 10
          : null,
    },
    bySales,
    topCustomers,
    atRiskDeals: atRisk.slice(0, 12),
    monthlyWinsYtd,
    mix: { byStage, byType },
  };
}
