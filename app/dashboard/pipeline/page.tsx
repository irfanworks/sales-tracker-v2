import { Suspense } from "react";
import { getAuthUser, getProfile, getSalesOptions, getSupabase } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import {
  PIPELINES_PAGE_SIZE,
  buildExportSearchParams,
  buildPipelinesListQuery,
  parsePipelineListParams,
  resolvePipelineSearchCustomerIds,
  type PipelineListParams,
} from "@/lib/pipelinesQuery";
import { fetchPipelineListMetrics } from "@/lib/pipelineListMetrics";
import { PipelinesTable } from "@/components/PipelinesTable";
import { PipelinesFilters } from "@/components/PipelinesFilters";
import { ExportPipelinesButton } from "@/components/ExportPipelinesButton";
import { PipelinesSummaryCards } from "@/components/PipelinesSummaryCards";
import { PipelinesPagination } from "@/components/PipelinesPagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { CurrencyProvider } from "@/components/ui/CurrencyToggle";
import { FolderKanban } from "lucide-react";

export default async function PipelinesListPage({
  searchParams,
}: {
  searchParams: Promise<PipelineListParams>;
}) {
  const rawParams = await searchParams;
  const [user, profile, supabase] = await Promise.all([
    getAuthUser(),
    getProfile(),
    getSupabase(),
  ]);
  const isAdmin = profile?.role === "admin";

  const params: PipelineListParams =
    !isAdmin && user
      ? { ...rawParams, sales_id: user.id }
      : rawParams;

  const { page, q } = parsePipelineListParams(params);
  const from = (page - 1) * PIPELINES_PAGE_SIZE;
  const to = from + PIPELINES_PAGE_SIZE - 1;

  const searchCustomerIds = q ? await resolvePipelineSearchCustomerIds(supabase, q) : [];
  const [currencyRates, salesOptions, listResult, metrics] = await Promise.all([
    getCurrencyRates(),
    getSalesOptions(),
    buildPipelinesListQuery(supabase, params, {
      count: "estimated",
      range: { from, to },
      searchCustomerIds,
    }),
    fetchPipelineListMetrics(supabase, params, searchCustomerIds),
  ]);
  const { data: projectsRaw, error, count } = listResult;

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-red-600">Error loading pipelines: {error.message}</p>
      </div>
    );
  }

  const pipelines = projectsRaw ?? [];
  const salesIds = [...new Set(pipelines.map((p) => p.sales_id))];
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

  const pipelinesWithSales = pipelines.map((p) => ({
    ...p,
    sales_name: salesNames[p.sales_id] ?? null,
  }));

  const {
    totalValueProject,
    totalValueWin,
    totalValueLateStage,
    projectLose,
    projectOnHold,
    valueProjectOnHold,
    tenderOnProgress,
  } = metrics;

  const totalCount = count ?? 0;
  const exportQuery = buildExportSearchParams(params);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FolderKanban}
        title="Pipeline"
        description={
          isAdmin
            ? "Quoted opportunities across the team, tracked by sales stage."
            : "Your quoted opportunities — sales stage progress and metrics for your own pipeline."
        }
        actions={<ExportPipelinesButton exportQuery={exportQuery} disabled={totalCount === 0} />}
      />
      <Suspense fallback={<div className="card shimmer h-24 rounded-2xl" />}>
        <PipelinesFilters
          q={params.q}
          salesStage={params.sales_stage}
          salesId={isAdmin ? params.sales_id : undefined}
          sortBy={params.sort_by}
          sortOrder={params.sort_order}
          salesOptions={salesOptions}
          showSalesFilter={isAdmin}
          basePath="/dashboard/pipeline"
        />
      </Suspense>
      <CurrencyProvider
        usdPerIdr={currencyRates.usdPerIdr}
        sgdPerIdr={currencyRates.sgdPerIdr}
      >
        <PipelinesSummaryCards
          totalValueProject={totalValueProject}
          totalValueWin={totalValueWin}
          totalValueLateStage={totalValueLateStage}
          projectLose={projectLose}
          projectOnHold={projectOnHold}
          valueProjectOnHold={valueProjectOnHold}
          tenderOnProgress={tenderOnProgress}
          usdPerIdr={currencyRates.usdPerIdr}
          sgdPerIdr={currencyRates.sgdPerIdr}
        />
        <div className="table-shell">
          <PipelinesTable
            projects={pipelinesWithSales.map((p) => ({
              id: p.id,
              slug: p.slug,
              created_at: p.created_at,
              no_quote: p.no_quote,
              pipeline_name: p.pipeline_name,
              customer_id: p.customer_id,
              value: p.value != null ? Number(p.value) : null,
              pipeline_type: p.pipeline_type,
              status: p.status,
              sales_stage: p.sales_stage,
              sales_stage_changed_at: p.sales_stage_changed_at,
              weekly_update: null,
              target_closing_at: p.target_closing_at,
              sales_id: p.sales_id,
              customer: Array.isArray(p.customers) ? p.customers[0] : p.customers,
              sales_name: p.sales_name ?? null,
            }))}
          />
          <PipelinesPagination
            page={page}
            totalCount={totalCount}
            pageSize={PIPELINES_PAGE_SIZE}
            basePath="/dashboard/pipeline"
            searchParams={params}
          />
        </div>
      </CurrencyProvider>
    </div>
  );
}
