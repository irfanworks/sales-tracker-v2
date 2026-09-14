import { isExcludedSalesStage, isLateSalesStage } from "@/lib/salesStage";
import { pipelineDetailPath } from "@/lib/pipelinePaths";

export type DashboardPipelineRow = {
  id: string;
  slug?: string | null;
  created_at: string;
  no_quote: string;
  pipeline_name: string;
  customer_id: string;
  value: number | null;
  pipeline_type?: string | null;
  sales_stage: string;
  sales_stage_changed_at?: string | null;
  status?: string | null;
  target_closing_at?: string | null;
  sales_id: string;
  pic_name?: string | null;
  customers?:
    | { id: string; name: string; slug?: string | null; sector?: string | null }
    | { id: string; name: string; slug?: string | null; sector?: string | null }[]
    | null;
};

export type DashboardListPipeline = {
  id: string;
  slug?: string | null;
  no_quote: string;
  pipeline_name: string;
  customer_name: string;
  value: number;
  sales_stage: string;
  status: string;
  target_closing_at: string | null;
  created_at: string;
  href: string;
};

export const NEAR_OVERDUE_DAYS = 14;

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysDateString(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function customerName(p: DashboardPipelineRow) {
  const raw = p.customers;
  const c = Array.isArray(raw) ? raw[0] : raw;
  return c?.name ?? "—";
}

function toListItem(p: DashboardPipelineRow): DashboardListPipeline {
  return {
    id: p.id,
    slug: p.slug,
    no_quote: p.no_quote,
    pipeline_name: p.pipeline_name,
    customer_name: customerName(p),
    value: Number(p.value ?? 0),
    sales_stage: p.sales_stage,
    status: p.status ?? "Open",
    target_closing_at: p.target_closing_at ?? null,
    created_at: p.created_at,
    href: pipelineDetailPath({
      id: p.id,
      slug: p.slug,
      no_quote: p.no_quote,
      pipeline_name: p.pipeline_name,
    }),
  };
}

export function isOpenProject(p: DashboardPipelineRow) {
  return (p.status ?? "Open") === "Open";
}

/** Active pipeline: Open, not Lose / On Hold */
export function isActivePipeline(p: DashboardPipelineRow) {
  return isOpenProject(p) && !isExcludedSalesStage(p.sales_stage);
}

export function calcDashboardKpis(
  projects: DashboardPipelineRow[],
  annualSalesTarget: number | null
) {
  const activePipelines = projects.filter(isActivePipeline);
  const totalPipelineValue = activePipelines.reduce((s, p) => s + Number(p.value ?? 0), 0);

  const wonPipelines = projects.filter((p) => p.sales_stage === "Win");
  const totalWon = wonPipelines.reduce((s, p) => s + Number(p.value ?? 0), 0);

  const year = new Date().getFullYear();
  const totalWonYtd = wonPipelines
    .filter((p) => new Date(p.created_at).getFullYear() === year)
    .reduce((s, p) => s + Number(p.value ?? 0), 0);
  // Fallback to all-time Win if no wins recorded this year yet (legacy data)
  const closingForTarget = totalWonYtd > 0 ? totalWonYtd : totalWon;

  const lateStageValue = projects
    .filter((p) => isOpenProject(p) && isLateSalesStage(p.sales_stage))
    .reduce((s, p) => s + Number(p.value ?? 0), 0);

  const totalProposals = projects.length;
  const totalProjectWinCount = wonPipelines.length;
  const tenderOnProgress = projects.filter(
    (p) => p.sales_stage === "Tender/RFQ" && (p.status ?? "Open") === "Open"
  ).length;

  const target = annualSalesTarget != null && annualSalesTarget > 0 ? annualSalesTarget : null;
  const targetAchievementPct =
    target != null ? (closingForTarget / target) * 100 : null;

  return {
    totalPipelineValue,
    totalWon,
    lateStageValue,
    closingForTarget,
    annualSalesTarget: target,
    targetAchievementPct,
    totalProposals,
    totalProjectWinCount,
    tenderOnProgress,
  };
}

export type DailyQuotePoint = {
  key: string;
  label: string;
  /** Short day label e.g. "1" or "Mon 1" */
  dayLabel: string;
  count: number;
};

export type MonthlyWinPoint = {
  key: string;
  /** Short month e.g. Jan */
  label: string;
  /** Full month e.g. January */
  fullLabel: string;
  wins: number;
  value: number;
};

/** Daily quote submissions for the last `daysBack` calendar days (inclusive of today). */
export function buildDailyQuoteSeries(
  projects: DashboardPipelineRow[],
  daysBack: number
): DailyQuotePoint[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const buckets: DailyQuotePoint[] = [];

  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", day: "numeric" });
    const dayLabel = String(d.getDate());
    buckets.push({ key, label, dayLabel, count: 0 });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  for (const p of projects) {
    const created = new Date(p.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.count += 1;
  }

  return buckets;
}

/** Pipeline wins per month for a calendar year (January – December). */
export function buildYearlyMonthlyWinsSeries(
  projects: DashboardPipelineRow[],
  year: number = new Date().getFullYear()
): MonthlyWinPoint[] {
  const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTH_LONG = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const buckets: MonthlyWinPoint[] = [];
  for (let month = 0; month < 12; month++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: MONTH_SHORT[month],
      fullLabel: MONTH_LONG[month],
      wins: 0,
      value: 0,
    });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  for (const p of projects) {
    if (p.sales_stage !== "Win") continue;
    const created = new Date(p.created_at);
    if (created.getFullYear() !== year) continue;
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.wins += 1;
    bucket.value += Number(p.value ?? 0);
  }

  return buckets;
}

export function getOverdueProjects(projects: DashboardPipelineRow[]): DashboardListPipeline[] {
  const today = todayDateString();
  return projects
    .filter(
      (p) =>
        isOpenProject(p) &&
        p.target_closing_at != null &&
        p.target_closing_at < today
    )
    .sort((a, b) => (a.target_closing_at ?? "").localeCompare(b.target_closing_at ?? ""))
    .map(toListItem);
}

export function isNearOverdue(p: DashboardPipelineRow) {
  if (!p.target_closing_at || !isOpenProject(p)) return false;
  const today = todayDateString();
  const end = addDaysDateString(NEAR_OVERDUE_DAYS);
  return p.target_closing_at >= today && p.target_closing_at <= end;
}

/** Late stage / Near Overdue / Tender — Open pipelines needing attention */
export function getHotAttentionProjects(projects: DashboardPipelineRow[]): DashboardListPipeline[] {
  return projects
    .filter((p) => {
      if (!isOpenProject(p)) return false;
      if (isExcludedSalesStage(p.sales_stage)) return false;
      return (
        isLateSalesStage(p.sales_stage) ||
        p.sales_stage === "Tender/RFQ" ||
        isNearOverdue(p)
      );
    })
    .sort((a, b) => {
      const aLate = isLateSalesStage(a.sales_stage) ? 0 : 1;
      const bLate = isLateSalesStage(b.sales_stage) ? 0 : 1;
      if (aLate !== bLate) return aLate - bLate;
      return (a.target_closing_at ?? "9999").localeCompare(b.target_closing_at ?? "9999");
    })
    .map(toListItem);
}

export type BreakdownPoint = {
  label: string;
  count: number;
  value: number;
};

function customerSector(p: DashboardPipelineRow) {
  const raw = p.customers;
  const c = Array.isArray(raw) ? raw[0] : raw;
  return c?.sector?.trim() || "Unspecified";
}

/** Work by category = pipeline_type; same scope as Total Pipeline (active only) */
export function buildWorkByCategory(projects: DashboardPipelineRow[]): BreakdownPoint[] {
  const order = ["Project", "Trading", "Service"];
  const map = new Map<string, BreakdownPoint>();
  for (const label of order) {
    map.set(label, { label, count: 0, value: 0 });
  }
  for (const p of projects) {
    if (!isActivePipeline(p)) continue;
    const label = p.pipeline_type?.trim() || "Project";
    const row = map.get(label) ?? { label, count: 0, value: 0 };
    row.count += 1;
    row.value += Number(p.value ?? 0);
    map.set(label, row);
  }
  return [...map.values()];
}

/** Work by sector = customer sector; same scope as Total Pipeline (active only) */
export function buildWorkBySector(projects: DashboardPipelineRow[]): BreakdownPoint[] {
  const map = new Map<string, BreakdownPoint>();
  for (const p of projects) {
    if (!isActivePipeline(p)) continue;
    const label = customerSector(p);
    const row = map.get(label) ?? { label, count: 0, value: 0 };
    row.count += 1;
    row.value += Number(p.value ?? 0);
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.value - a.value);
}
