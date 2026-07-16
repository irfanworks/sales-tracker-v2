import { Suspense } from "react";
import { getAuthUser, getProfile, getSalesOptions, getSupabase } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { calcProjectSecondaryMetrics, calcProjectValueMetrics } from "@/lib/projectMetrics";
import {
  PROJECTS_PAGE_SIZE,
  buildExportSearchParams,
  buildProjectsListQuery,
  buildProjectsMetricsQuery,
  parseProjectListParams,
  type ProjectListParams,
} from "@/lib/projectsQuery";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ProjectsFilters } from "@/components/ProjectsFilters";
import { ExportProjectsButton } from "@/components/ExportProjectsButton";
import { ProjectsSummaryCards } from "@/components/ProjectsSummaryCards";
import { ProjectsPagination } from "@/components/ProjectsPagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { CurrencyProvider } from "@/components/ui/CurrencyToggle";
import { FolderKanban } from "lucide-react";

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: Promise<ProjectListParams>;
}) {
  const rawParams = await searchParams;
  const user = await getAuthUser();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  // Sales only see and monitor their own projects (cards + list + export)
  const params: ProjectListParams =
    !isAdmin && user
      ? { ...rawParams, sales_id: user.id }
      : rawParams;

  const { page } = parseProjectListParams(params);
  const from = (page - 1) * PROJECTS_PAGE_SIZE;
  const to = from + PROJECTS_PAGE_SIZE - 1;

  const supabase = await getSupabase();
  const [currencyRates, salesOptions, listResult, metricsResult] = await Promise.all([
    getCurrencyRates(),
    getSalesOptions(),
    buildProjectsListQuery(supabase, params, { count: "exact", range: { from, to } }),
    buildProjectsMetricsQuery(supabase, params),
  ]);

  const { data: projectsRaw, error, count } = listResult;
  const { data: metricsRows, error: metricsError } = metricsResult;

  if (error || metricsError) {
    return (
      <div className="card p-6">
        <p className="text-red-600">
          Error loading projects: {error?.message ?? metricsError?.message}
        </p>
      </div>
    );
  }

  const projects = projectsRaw ?? [];
  const salesIds = [...new Set(projects.map((p) => p.sales_id))];
  const salesNames: Record<string, string> = {};

  if (salesIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, full_name")
      .in("id", salesIds);
    (profiles ?? []).forEach((p) => {
      salesNames[p.id] = p.display_name ?? p.full_name ?? "";
    });
  }

  const projectsWithSales = projects.map((p) => ({
    ...p,
    sales_name: salesNames[p.sales_id] ?? null,
  }));

  const metricRows = (metricsRows ?? []).map((p) => ({
    value: p.value != null ? Number(p.value) : null,
    progress_type: p.progress_type,
    prospect: p.prospect,
    outcome_status: p.outcome_status,
    status: p.status,
  }));

  const { totalValueProject, totalValueWin, totalValueHotProspect } =
    calcProjectValueMetrics(metricRows);
  const { projectLose, projectOnHold, valueProjectOnHold, tenderOnProgress } =
    calcProjectSecondaryMetrics(metricRows);

  const totalCount = count ?? 0;
  const exportQuery = buildExportSearchParams(params);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderKanban}
        title="Projects"
        description={
          isAdmin
            ? "Budgetary and Tender projects (BD projects are on the BD menu)."
            : "Your Budgetary and Tender projects — progress and metrics for your own pipeline."
        }
        actions={<ExportProjectsButton exportQuery={exportQuery} disabled={totalCount === 0} />}
      />
      <Suspense fallback={<div className="card shimmer h-24 rounded-2xl" />}>
        <ProjectsFilters
          progressType={params.progress_type}
          prospect={params.prospect}
          outcomeStatus={params.outcome_status}
          salesId={isAdmin ? params.sales_id : undefined}
          sortBy={params.sort_by}
          sortOrder={params.sort_order}
          salesOptions={salesOptions}
          showSalesFilter={isAdmin}
          basePath="/dashboard/projects"
        />
      </Suspense>
      <CurrencyProvider
        usdPerIdr={currencyRates.usdPerIdr}
        sgdPerIdr={currencyRates.sgdPerIdr}
      >
        <ProjectsSummaryCards
          totalValueProject={totalValueProject}
          totalValueWin={totalValueWin}
          totalValueHotProspect={totalValueHotProspect}
          projectLose={projectLose}
          projectOnHold={projectOnHold}
          valueProjectOnHold={valueProjectOnHold}
          tenderOnProgress={tenderOnProgress}
          usdPerIdr={currencyRates.usdPerIdr}
          sgdPerIdr={currencyRates.sgdPerIdr}
        />
        <div className="table-shell">
          <ProjectsTable
            projects={projectsWithSales.map((p) => ({
              id: p.id,
              slug: p.slug,
              created_at: p.created_at,
              no_quote: p.no_quote,
              project_name: p.project_name,
              customer_id: p.customer_id,
              value: p.value != null ? Number(p.value) : null,
              project_type: p.project_type,
              status: p.status,
              progress_type: p.progress_type,
              outcome_status: p.outcome_status,
              prospect: p.prospect,
              weekly_update: null,
              target_closing_at: p.target_closing_at,
              sales_id: p.sales_id,
              customer: Array.isArray(p.customers) ? p.customers[0] : p.customers,
              sales_name: p.sales_name ?? null,
            }))}
          />
          <ProjectsPagination
            page={page}
            totalCount={totalCount}
            pageSize={PROJECTS_PAGE_SIZE}
            basePath="/dashboard/projects"
            searchParams={params}
          />
        </div>
      </CurrencyProvider>
    </div>
  );
}
