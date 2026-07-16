import { isExcludedFromQuotedValue } from "@/lib/projectMetrics";
import { projectDetailPath } from "@/lib/projectPaths";

export type DashboardProjectRow = {
  id: string;
  slug?: string | null;
  created_at: string;
  no_quote: string;
  project_name: string;
  customer_id: string;
  value: number | null;
  project_type?: string | null;
  progress_type: string;
  outcome_status?: string | null;
  prospect: string;
  status?: string | null;
  target_closing_at?: string | null;
  sales_id: string;
  pic_name?: string | null;
  customers?:
    | { id: string; name: string; slug?: string | null; sector?: string | null }
    | { id: string; name: string; slug?: string | null; sector?: string | null }[]
    | null;
};

export type DashboardListProject = {
  id: string;
  slug?: string | null;
  no_quote: string;
  project_name: string;
  customer_name: string;
  value: number;
  progress_type: string;
  prospect: string;
  outcome_status: string | null;
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

function customerName(p: DashboardProjectRow) {
  const raw = p.customers;
  const c = Array.isArray(raw) ? raw[0] : raw;
  return c?.name ?? "—";
}

function toListItem(p: DashboardProjectRow): DashboardListProject {
  return {
    id: p.id,
    slug: p.slug,
    no_quote: p.no_quote,
    project_name: p.project_name,
    customer_name: customerName(p),
    value: Number(p.value ?? 0),
    progress_type: p.progress_type,
    prospect: p.prospect,
    outcome_status: p.outcome_status ?? null,
    status: p.status ?? "Open",
    target_closing_at: p.target_closing_at ?? null,
    created_at: p.created_at,
    href: projectDetailPath({
      id: p.id,
      slug: p.slug,
      no_quote: p.no_quote,
      project_name: p.project_name,
    }),
  };
}

export function isOpenProject(p: DashboardProjectRow) {
  return (p.status ?? "Open") === "Open";
}

/** Active pipeline: Open, not Lose / On Hold */
export function isActivePipeline(p: DashboardProjectRow) {
  return isOpenProject(p) && !isExcludedFromQuotedValue(p.outcome_status);
}

export function calcDashboardKpis(
  projects: DashboardProjectRow[],
  annualSalesTarget: number | null
) {
  const pipelineProjects = projects.filter(isActivePipeline);
  const totalPipelineValue = pipelineProjects.reduce((s, p) => s + Number(p.value ?? 0), 0);

  const wonProjects = projects.filter((p) => p.outcome_status === "Win");
  const totalWon = wonProjects.reduce((s, p) => s + Number(p.value ?? 0), 0);

  const year = new Date().getFullYear();
  const totalWonYtd = wonProjects
    .filter((p) => new Date(p.created_at).getFullYear() === year)
    .reduce((s, p) => s + Number(p.value ?? 0), 0);
  // Fallback to all-time Win if no wins recorded this year yet (legacy data)
  const closingForTarget = totalWonYtd > 0 ? totalWonYtd : totalWon;

  const hotProspectValue = projects
    .filter((p) => p.prospect === "Hot Prospect" && !isExcludedFromQuotedValue(p.outcome_status))
    .reduce((s, p) => s + Number(p.value ?? 0), 0);

  const target = annualSalesTarget != null && annualSalesTarget > 0 ? annualSalesTarget : null;
  const targetAchievementPct =
    target != null ? Math.min(100, (closingForTarget / target) * 100) : null;

  return {
    totalPipelineValue,
    totalWon,
    hotProspectValue,
    closingForTarget,
    annualSalesTarget: target,
    targetAchievementPct,
  };
}

export type MonthlyQuotePoint = {
  key: string;
  label: string;
  count: number;
  value: number;
};

export function buildMonthlyQuoteSeries(
  projects: DashboardProjectRow[],
  monthsBack: 3 | 12
): MonthlyQuotePoint[] {
  const now = new Date();
  const buckets: MonthlyQuotePoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    buckets.push({ key, label, count: 0, value: 0 });
  }

  const bucketMap = new Map(buckets.map((b) => [b.key, b]));

  for (const p of projects) {
    const created = new Date(p.created_at);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = bucketMap.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.value += Number(p.value ?? 0);
  }

  return buckets;
}

export function getOverdueProjects(projects: DashboardProjectRow[]): DashboardListProject[] {
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

export function isNearOverdue(p: DashboardProjectRow) {
  if (!p.target_closing_at || !isOpenProject(p)) return false;
  const today = todayDateString();
  const end = addDaysDateString(NEAR_OVERDUE_DAYS);
  return p.target_closing_at >= today && p.target_closing_at <= end;
}

/** Hot Prospect / Near Overdue / Tender — Open projects needing attention */
export function getHotAttentionProjects(projects: DashboardProjectRow[]): DashboardListProject[] {
  return projects
    .filter((p) => {
      if (!isOpenProject(p)) return false;
      if (isExcludedFromQuotedValue(p.outcome_status)) return false;
      return (
        p.prospect === "Hot Prospect" ||
        p.progress_type === "Tender" ||
        isNearOverdue(p)
      );
    })
    .sort((a, b) => {
      const aHot = a.prospect === "Hot Prospect" ? 0 : 1;
      const bHot = b.prospect === "Hot Prospect" ? 0 : 1;
      if (aHot !== bHot) return aHot - bHot;
      return (a.target_closing_at ?? "9999").localeCompare(b.target_closing_at ?? "9999");
    })
    .map(toListItem);
}

export type BreakdownPoint = {
  label: string;
  count: number;
  value: number;
};

function customerSector(p: DashboardProjectRow) {
  const raw = p.customers;
  const c = Array.isArray(raw) ? raw[0] : raw;
  return c?.sector?.trim() || "Unspecified";
}

/** Work by category = project_type (Project / Trading / Service) */
export function buildWorkByCategory(projects: DashboardProjectRow[]): BreakdownPoint[] {
  const order = ["Project", "Trading", "Service"];
  const map = new Map<string, BreakdownPoint>();
  for (const label of order) {
    map.set(label, { label, count: 0, value: 0 });
  }
  for (const p of projects) {
    const label = p.project_type?.trim() || "Project";
    const row = map.get(label) ?? { label, count: 0, value: 0 };
    row.count += 1;
    row.value += Number(p.value ?? 0);
    map.set(label, row);
  }
  return [...map.values()];
}

/** Work by sector = customer sector */
export function buildWorkBySector(projects: DashboardProjectRow[]): BreakdownPoint[] {
  const map = new Map<string, BreakdownPoint>();
  for (const p of projects) {
    const label = customerSector(p);
    const row = map.get(label) ?? { label, count: 0, value: 0 };
    row.count += 1;
    row.value += Number(p.value ?? 0);
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.value - a.value);
}
