import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BreakdownPoint,
  DailyQuotePoint,
  DashboardListPipeline,
  DashboardPipelineRow,
  MonthlyWinPoint,
} from "@/lib/dashboard";
import {
  buildDailyQuoteSeries,
  buildYearlyMonthlyWinsSeries,
  getHotAttentionProjects,
  getOverdueProjects,
} from "@/lib/dashboard";

export type DashboardKpisRpc = {
  totalPipelineValue: number;
  totalWon: number;
  closingForTarget: number;
  hotProspectValue: number;
  totalProposals: number;
  totalProjectWinCount: number;
  tenderOnProgress: number;
};

const EMPTY_KPIS: DashboardKpisRpc = {
  totalPipelineValue: 0,
  totalWon: 0,
  closingForTarget: 0,
  hotProspectValue: 0,
  totalProposals: 0,
  totalProjectWinCount: 0,
  tenderOnProgress: 0,
};

const ATTENTION_SELECT = `
  id,
  slug,
  created_at,
  no_quote,
  pipeline_name,
  customer_id,
  value,
  pipeline_type,
  progress_type,
  outcome_status,
  prospect,
  status,
  target_closing_at,
  sales_id,
  customers ( id, name, slug, sector )
`;

type RpcNumRow = Record<string, unknown>;

export async function fetchDashboardKpis(
  supabase: SupabaseClient,
  salesId: string | undefined
): Promise<DashboardKpisRpc> {
  const { data, error } = await supabase.rpc("get_dashboard_kpis", {
    p_sales_id: salesId ?? null,
  });

  if (error) {
    console.error("[dashboard-kpis]", error.message);
    return EMPTY_KPIS;
  }

  const row = (Array.isArray(data) ? data[0] : data) as RpcNumRow | null;
  if (!row) return EMPTY_KPIS;

  return {
    totalPipelineValue: Number(row.total_pipeline_value ?? 0),
    totalWon: Number(row.total_won ?? 0),
    closingForTarget: Number(row.closing_for_target ?? 0),
    hotProspectValue: Number(row.hot_prospect_value ?? 0),
    totalProposals: Number(row.total_proposals ?? 0),
    totalProjectWinCount: Number(row.total_project_win_count ?? 0),
    tenderOnProgress: Number(row.tender_on_progress ?? 0),
  };
}

export async function fetchDashboardWorkBreakdown(
  supabase: SupabaseClient,
  salesId: string | undefined
): Promise<{ byCategory: BreakdownPoint[]; bySector: BreakdownPoint[] }> {
  const [typeResult, sectorResult] = await Promise.all([
    supabase.rpc("get_dashboard_work_by_type", { p_sales_id: salesId ?? null }),
    supabase.rpc("get_dashboard_work_by_sector", { p_sales_id: salesId ?? null }),
  ]);

  const order = ["Project", "Trading", "Service"];
  const typeMap = new Map<string, BreakdownPoint>();
  for (const label of order) typeMap.set(label, { label, count: 0, value: 0 });

  for (const raw of (typeResult.data ?? []) as RpcNumRow[]) {
    const label = String(raw.label ?? "Project");
    const prev = typeMap.get(label) ?? { label, count: 0, value: 0 };
    prev.count = Number(raw.project_count ?? 0);
    prev.value = Number(raw.total_value ?? 0);
    typeMap.set(label, prev);
  }

  const bySector = ((sectorResult.data ?? []) as RpcNumRow[]).map((raw) => ({
    label: String(raw.sector ?? "Unspecified"),
    count: Number(raw.project_count ?? 0),
    value: Number(raw.total_value ?? 0),
  }));

  return {
    byCategory: [...typeMap.values()],
    bySector,
  };
}

/** Slim columns only — charts don't need customer joins. */
export async function fetchDashboardChartSeries(
  supabase: SupabaseClient,
  salesId: string | undefined,
  winsYear: number
): Promise<{
  quoteSeries7d: DailyQuotePoint[];
  quoteSeries14d: DailyQuotePoint[];
  quoteSeries30d: DailyQuotePoint[];
  winsSeries: MonthlyWinPoint[];
}> {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  since30.setHours(0, 0, 0, 0);

  const yearStart = `${winsYear}-01-01T00:00:00.000Z`;
  const yearEnd = `${winsYear + 1}-01-01T00:00:00.000Z`;

  const recentBase = supabase
    .from("pipelines")
    .select("created_at")
    .gte("created_at", since30.toISOString())
    .order("created_at", { ascending: false });

  const winsBase = supabase
    .from("pipelines")
    .select("created_at, value, outcome_status")
    .eq("outcome_status", "Win")
    .gte("created_at", yearStart)
    .lt("created_at", yearEnd);

  const [recentResult, winsResult] = await Promise.all([
    salesId ? recentBase.eq("sales_id", salesId) : recentBase,
    salesId ? winsBase.eq("sales_id", salesId) : winsBase,
  ]);

  const recentRows = (recentResult.data ?? []) as DashboardPipelineRow[];
  const winRows = (winsResult.data ?? []) as DashboardPipelineRow[];

  return {
    quoteSeries7d: buildDailyQuoteSeries(recentRows, 7),
    quoteSeries14d: buildDailyQuoteSeries(recentRows, 14),
    quoteSeries30d: buildDailyQuoteSeries(recentRows, 30),
    winsSeries: buildYearlyMonthlyWinsSeries(winRows, winsYear),
  };
}

const ATTENTION_LIMIT = 40;

export async function fetchDashboardAttentionLists(
  supabase: SupabaseClient,
  salesId: string | undefined
): Promise<{ overdue: DashboardListPipeline[]; hotAttention: DashboardListPipeline[] }> {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const nearEnd = new Date(today);
  nearEnd.setDate(nearEnd.getDate() + 14);
  const nearEndKey = `${nearEnd.getFullYear()}-${String(nearEnd.getMonth() + 1).padStart(2, "0")}-${String(nearEnd.getDate()).padStart(2, "0")}`;

  // Cast builders to any to avoid PostgREST type recursion blow-ups on complex selects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  let overdueQuery = db
    .from("pipelines")
    .select(ATTENTION_SELECT)
    .not("target_closing_at", "is", null)
    .lt("target_closing_at", todayKey)
    .or("status.is.null,status.eq.Open")
    .order("target_closing_at", { ascending: true })
    .limit(ATTENTION_LIMIT);

  let hotProspectQuery = db
    .from("pipelines")
    .select(ATTENTION_SELECT)
    .eq("prospect", "Hot Prospect")
    .or("status.is.null,status.eq.Open")
    .order("target_closing_at", { ascending: true, nullsFirst: false })
    .limit(ATTENTION_LIMIT);

  let tenderQuery = db
    .from("pipelines")
    .select(ATTENTION_SELECT)
    .eq("progress_type", "Tender")
    .or("status.is.null,status.eq.Open")
    .order("target_closing_at", { ascending: true, nullsFirst: false })
    .limit(ATTENTION_LIMIT);

  let nearOverdueQuery = db
    .from("pipelines")
    .select(ATTENTION_SELECT)
    .not("target_closing_at", "is", null)
    .gte("target_closing_at", todayKey)
    .lte("target_closing_at", nearEndKey)
    .or("status.is.null,status.eq.Open")
    .order("target_closing_at", { ascending: true })
    .limit(ATTENTION_LIMIT);

  if (salesId) {
    overdueQuery = overdueQuery.eq("sales_id", salesId);
    hotProspectQuery = hotProspectQuery.eq("sales_id", salesId);
    tenderQuery = tenderQuery.eq("sales_id", salesId);
    nearOverdueQuery = nearOverdueQuery.eq("sales_id", salesId);
  }

  const [overdueResult, hotResult, tenderResult, nearResult] = await Promise.all([
    overdueQuery,
    hotProspectQuery,
    tenderQuery,
    nearOverdueQuery,
  ]);

  const overdueRows = (overdueResult.data ?? []) as DashboardPipelineRow[];
  const byId = new Map<string, DashboardPipelineRow>();
  for (const row of [
    ...((hotResult.data ?? []) as DashboardPipelineRow[]),
    ...((tenderResult.data ?? []) as DashboardPipelineRow[]),
    ...((nearResult.data ?? []) as DashboardPipelineRow[]),
  ]) {
    byId.set(row.id, row);
  }

  return {
    overdue: getOverdueProjects(overdueRows),
    hotAttention: getHotAttentionProjects([...byId.values()]).slice(0, ATTENTION_LIMIT),
  };
}
