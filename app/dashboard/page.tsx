import { Suspense } from "react";
import {
  getAuthUser,
  getProfile,
  getSalesOptions,
  getSupabase,
  getTeamTargetProfiles,
  sumCompanyAnnualTarget,
} from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardHeroLayout } from "@/components/dashboard/DashboardHeroLayout";
import { DashboardAttentionTables } from "@/components/dashboard/DashboardAttentionTables";
import { LazyDashboardWorkCharts } from "@/components/dashboard/LazyDashboardWorkCharts";
import { DashboardUserPicker } from "@/components/dashboard/DashboardUserPicker";
import { DashboardLatestActivity } from "@/components/dashboard/DashboardLatestActivity";
import {
  buildDailyQuoteSeries,
  buildWorkByCategory,
  buildWorkBySector,
  buildYearlyMonthlyWinsSeries,
  calcDashboardKpis,
  getHotAttentionProjects,
  getOverdueProjects,
  type DashboardPipelineRow,
} from "@/lib/dashboard";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sales_id?: string }>;
}) {
  const params = await searchParams;
  const [user, profile, currencyRates, supabase] = await Promise.all([
    getAuthUser(),
    getProfile(),
    getCurrencyRates(),
    getSupabase(),
  ]);

  const isAdmin = profile?.role === "admin";
  const [salesOptions, teamTargets] = isAdmin
    ? await Promise.all([getSalesOptions(), getTeamTargetProfiles()])
    : [[], []];

  const monitorSalesId =
    isAdmin && params.sales_id && salesOptions.some((s) => s.id === params.sales_id)
      ? params.sales_id
      : undefined;
  const monitoredUser = monitorSalesId
    ? salesOptions.find((s) => s.id === monitorSalesId)
    : undefined;

  let query = supabase
    .from("pipelines")
    .select(
      `
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
    `
    )
    .order("created_at", { ascending: false });

  if (!isAdmin && user) {
    query = query.eq("sales_id", user.id);
  } else if (isAdmin && monitorSalesId) {
    query = query.eq("sales_id", monitorSalesId);
  }

  let activityQuery = supabase
    .from("sales_activity_log")
    .select(
      "id, created_at, actor_id, action_type, entity_type, entity_id, entity_label, summary, details"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (!isAdmin && user) {
    activityQuery = activityQuery.eq("actor_id", user.id);
  } else if (isAdmin && monitorSalesId) {
    activityQuery = activityQuery.eq("actor_id", monitorSalesId);
  }

  // Open prospects currently being worked on (Prospects module — not Hot Prospect pipelines)
  let prospectsCountQuery = supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("status", "Open");

  if (!isAdmin && user) {
    prospectsCountQuery = prospectsCountQuery.eq("sales_id", user.id);
  } else if (isAdmin && monitorSalesId) {
    prospectsCountQuery = prospectsCountQuery.eq("sales_id", monitorSalesId);
  }

  const [{ data: projectsRaw, error }, activityResult, prospectsCountResult] = await Promise.all([
    query,
    activityQuery,
    prospectsCountQuery,
  ]);

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading dashboard: {error.message}</p>
      </div>
    );
  }

  const activityRows = activityResult.error ? [] : activityResult.data ?? [];
  const totalProspectsCount = prospectsCountResult.error
    ? 0
    : prospectsCountResult.count ?? 0;

  const pipelines = (projectsRaw ?? []) as DashboardPipelineRow[];

  let annualTarget: number | null = null;
  if (isAdmin && monitorSalesId) {
    const row = teamTargets.find((t) => t.id === monitorSalesId);
    annualTarget = row?.annual_sales_target ?? null;
  } else if (isAdmin) {
    annualTarget = sumCompanyAnnualTarget(teamTargets);
  } else {
    annualTarget =
      profile?.annual_sales_target != null ? Number(profile.annual_sales_target) : null;
  }

  const kpis = calcDashboardKpis(pipelines, annualTarget);
  const winsYear = new Date().getFullYear();
  const quoteSeries7d = buildDailyQuoteSeries(pipelines, 7);
  const quoteSeries14d = buildDailyQuoteSeries(pipelines, 14);
  const quoteSeries30d = buildDailyQuoteSeries(pipelines, 30);
  const winsSeries = buildYearlyMonthlyWinsSeries(pipelines, winsYear);
  const overdue = getOverdueProjects(pipelines);
  const hotAttention = getHotAttentionProjects(pipelines);
  const byCategory = buildWorkByCategory(pipelines);
  const bySector = buildWorkBySector(pipelines);

  const actorIds = [...new Set((activityRows ?? []).map((a) => a.actor_id))];
  const actorNames: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", actorIds);
    (profiles ?? []).forEach((p) => {
      actorNames[p.id] = p.display_name ?? p.full_name ?? "Unknown";
    });
  }

  const latestActivity = (activityRows ?? []).map((a) => ({
    ...a,
    actor_name: actorNames[a.actor_id] ?? null,
  }));

  const description = isAdmin
    ? monitoredUser
      ? `Monitoring ${monitoredUser.display_name}'s pipeline and closing progress.`
      : "Company pipeline health — target is the sum of all user annual sales targets."
    : "Your personal pipeline and closing progress.";

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description={description}
        actions={
          isAdmin ? (
            <Suspense
              fallback={
                <div className="h-14 w-full animate-pulse rounded-xl bg-slate-100 sm:w-[220px]" />
              }
            >
              <DashboardUserPicker salesId={monitorSalesId} salesOptions={salesOptions} />
            </Suspense>
          ) : undefined
        }
      />

      <DashboardHeroLayout
        totalPipelineValue={kpis.totalPipelineValue}
        hotProspectValue={kpis.hotProspectValue}
        totalWon={kpis.totalWon}
        closingForTarget={kpis.closingForTarget}
        annualSalesTarget={kpis.annualSalesTarget}
        targetAchievementPct={kpis.targetAchievementPct}
        totalProposals={kpis.totalProposals}
        totalProjectWinCount={kpis.totalProjectWinCount}
        totalProspectsCount={totalProspectsCount}
        tenderOnProgress={kpis.tenderOnProgress}
        quoteSeries7d={quoteSeries7d}
        quoteSeries14d={quoteSeries14d}
        quoteSeries30d={quoteSeries30d}
        winsSeries={winsSeries}
        winsYear={winsYear}
        usdPerIdr={currencyRates.usdPerIdr}
        sgdPerIdr={currencyRates.sgdPerIdr}
        targetCaption={
          isAdmin && !monitorSalesId
            ? "Closing (Won) vs company annual sales target"
            : isAdmin && monitoredUser
              ? `Closing (Won) vs ${monitoredUser.display_name}'s annual target`
              : undefined
        }
      >
        <DashboardAttentionTables overdue={overdue} hotAttention={hotAttention} />
        <LazyDashboardWorkCharts byCategory={byCategory} bySector={bySector} />
        <DashboardLatestActivity activities={latestActivity} />
      </DashboardHeroLayout>
    </div>
  );
}
