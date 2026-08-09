import { Suspense } from "react";
import {
  getAuthUser,
  getProfile,
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
  fetchDashboardAttentionLists,
  fetchDashboardChartSeries,
  fetchDashboardKpis,
  fetchDashboardWorkBreakdown,
} from "@/lib/dashboardData";
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
  const teamTargets = isAdmin ? await getTeamTargetProfiles() : [];
  const salesOptions = teamTargets.map((t) => ({
    id: t.id,
    display_name: t.display_name,
  }));

  const monitorSalesId =
    isAdmin && params.sales_id && salesOptions.some((s) => s.id === params.sales_id)
      ? params.sales_id
      : undefined;
  const monitoredUser = monitorSalesId
    ? salesOptions.find((s) => s.id === monitorSalesId)
    : undefined;

  const scopeSalesId = !isAdmin && user ? user.id : monitorSalesId;

  let activityQuery = supabase
    .from("sales_activity_log")
    .select(
      "id, created_at, actor_id, action_type, entity_type, entity_id, entity_label, summary, details"
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (scopeSalesId) {
    activityQuery = activityQuery.eq("actor_id", scopeSalesId);
  }

  let prospectsCountQuery = supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("status", "Open");

  if (scopeSalesId) {
    prospectsCountQuery = prospectsCountQuery.eq("sales_id", scopeSalesId);
  }

  const winsYear = new Date().getFullYear();

  const [
    kpisRpc,
    charts,
    attention,
    work,
    activityResult,
    prospectsCountResult,
  ] = await Promise.all([
    fetchDashboardKpis(supabase, scopeSalesId),
    fetchDashboardChartSeries(supabase, scopeSalesId, winsYear),
    fetchDashboardAttentionLists(supabase, scopeSalesId),
    fetchDashboardWorkBreakdown(supabase, scopeSalesId),
    activityQuery,
    prospectsCountQuery,
  ]);

  const activityRows = activityResult.error ? [] : activityResult.data ?? [];
  const totalProspectsCount = prospectsCountResult.error
    ? 0
    : prospectsCountResult.count ?? 0;

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

  const target =
    annualTarget != null && annualTarget > 0 ? annualTarget : null;
  const targetAchievementPct =
    target != null ? (kpisRpc.closingForTarget / target) * 100 : null;

  const actorIds = [...new Set(activityRows.map((a) => a.actor_id))];
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

  const latestActivity = activityRows.map((a) => ({
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
        totalPipelineValue={kpisRpc.totalPipelineValue}
        hotProspectValue={kpisRpc.hotProspectValue}
        totalWon={kpisRpc.totalWon}
        closingForTarget={kpisRpc.closingForTarget}
        annualSalesTarget={target}
        targetAchievementPct={targetAchievementPct}
        totalProposals={kpisRpc.totalProposals}
        totalProjectWinCount={kpisRpc.totalProjectWinCount}
        totalProspectsCount={totalProspectsCount}
        tenderOnProgress={kpisRpc.tenderOnProgress}
        quoteSeries7d={charts.quoteSeries7d}
        quoteSeries14d={charts.quoteSeries14d}
        quoteSeries30d={charts.quoteSeries30d}
        winsSeries={charts.winsSeries}
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
        <DashboardAttentionTables
          overdue={attention.overdue}
          hotAttention={attention.hotAttention}
        />
        <LazyDashboardWorkCharts byCategory={work.byCategory} bySector={work.bySector} />
        <DashboardLatestActivity activities={latestActivity} />
      </DashboardHeroLayout>
    </div>
  );
}
