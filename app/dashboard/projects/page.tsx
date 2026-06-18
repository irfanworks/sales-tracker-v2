import { Suspense } from "react";
import { getProfile, getSalesOptions } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import { calcProjectValueMetrics } from "@/lib/projectMetrics";
import {
  PROJECTS_PAGE_SIZE,
  buildExportSearchParams,
  buildProjectsListQuery,
  buildProjectsMetricsQuery,
  parseProjectListParams,
  type ProjectListParams,
} from "@/lib/projectsQuery";
import { getSupabase } from "@/lib/auth";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ProjectsFilters } from "@/components/ProjectsFilters";
import { ExportProjectsButton } from "@/components/ExportProjectsButton";
import { ProjectsSummaryCards } from "@/components/ProjectsSummaryCards";
import { ProjectsPagination } from "@/components/ProjectsPagination";

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: Promise<ProjectListParams>;
}) {
  const params = await searchParams;
  const { page } = parseProjectListParams(params);
  const from = (page - 1) * PROJECTS_PAGE_SIZE;
  const to = from + PROJECTS_PAGE_SIZE - 1;

  const supabase = await getSupabase();
  const [profile, currencyRates, salesOptions, listResult, metricsResult] = await Promise.all([
    getProfile(),
    getCurrencyRates(),
    getSalesOptions(),
    buildProjectsListQuery(supabase, params, { count: "exact", range: { from, to } }),
    buildProjectsMetricsQuery(supabase, params),
  ]);

  const isAdmin = profile?.role === "admin";
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

  const { totalValueProject, totalValueWin, totalValueHotProspect } = calcProjectValueMetrics(
    (metricsRows ?? []).map((p) => ({
      value: Number(p.value ?? 0),
      progress_type: p.progress_type,
      prospect: p.prospect,
    }))
  );

  const totalCount = count ?? 0;
  const exportQuery = buildExportSearchParams(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Projects</h1>
          <p className="mt-1 text-slate-600">List of all projects.</p>
        </div>
        <ExportProjectsButton exportQuery={exportQuery} disabled={totalCount === 0} />
      </div>
      <Suspense fallback={<div className="card animate-pulse p-4 h-24 bg-slate-100 rounded-xl" />}>
        <ProjectsFilters
          progressType={params.progress_type}
          prospect={params.prospect}
          salesId={params.sales_id}
          sortBy={params.sort_by}
          sortOrder={params.sort_order}
          salesOptions={salesOptions}
          showSalesFilter={isAdmin}
          basePath="/dashboard/projects"
        />
      </Suspense>
      <ProjectsSummaryCards
        totalValueProject={totalValueProject}
        totalValueWin={totalValueWin}
        totalValueHotProspect={totalValueHotProspect}
        usdPerIdr={currencyRates.usdPerIdr}
        sgdPerIdr={currencyRates.sgdPerIdr}
      />
      <div className="card overflow-hidden">
        <ProjectsTable
          projects={projectsWithSales.map((p) => ({
            id: p.id,
            created_at: p.created_at,
            no_quote: p.no_quote,
            project_name: p.project_name,
            customer_id: p.customer_id,
            value: Number(p.value),
            progress_type: p.progress_type,
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
    </div>
  );
}
