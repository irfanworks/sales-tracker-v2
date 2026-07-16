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
import {
  buildMonthlyQuoteSeries,
  buildWorkByCategory,
  buildWorkBySector,
  calcDashboardKpis,
  getHotAttentionProjects,
  getOverdueProjects,
  type DashboardProjectRow,
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
    .from("projects")
    .select(
      `
      id,
      slug,
      created_at,
      no_quote,
      project_name,
      customer_id,
      value,
      project_type,
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

  const { data: projectsRaw, error } = await query;

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading dashboard: {error.message}</p>
      </div>
    );
  }

  const projects = (projectsRaw ?? []) as DashboardProjectRow[];

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

  const kpis = calcDashboardKpis(projects, annualTarget);
  const series3m = buildMonthlyQuoteSeries(projects, 3);
  const series12m = buildMonthlyQuoteSeries(projects, 12);
  const overdue = getOverdueProjects(projects);
  const hotAttention = getHotAttentionProjects(projects);
  const byCategory = buildWorkByCategory(projects);
  const bySector = buildWorkBySector(projects);

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
        series3m={series3m}
        series12m={series12m}
        usdPerIdr={currencyRates.usdPerIdr}
        sgdPerIdr={currencyRates.sgdPerIdr}
        targetCaption={
          isAdmin && !monitorSalesId
            ? "Closing (Won) vs company annual sales target"
            : isAdmin && monitoredUser
              ? `Closing (Won) vs ${monitoredUser.display_name}'s annual target`
              : undefined
        }
      />

      <DashboardAttentionTables overdue={overdue} hotAttention={hotAttention} />

      <LazyDashboardWorkCharts byCategory={byCategory} bySector={bySector} />
    </div>
  );
}
