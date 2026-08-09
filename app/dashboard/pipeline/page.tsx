import { Suspense } from "react";
import { getAuthUser, getProfile, getSalesOptions, getSupabase } from "@/lib/auth";
import { getCurrencyRates } from "@/lib/currency";
import {
  PIPELINES_PAGE_SIZE,
  buildExportSearchParams,
  buildPipelinesListQuery,
  parsePipelineListParams,
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
  const user = await getAuthUser();
  const profile = await getProfile();
  const isAdmin = profile?.role === "admin";

  const params: PipelineListParams =
    !isAdmin && user
      ? { ...rawParams, sales_id: user.id }
      : rawParams;

  const { page } = parsePipelineListParams(params);
  const from = (page - 1) * PIPELINES_PAGE_SIZE;
  const to = from + PIPELINES_PAGE_SIZE - 1;

  const supabase = await getSupabase();
  const [currencyRates, salesOptions, listResult, metrics] = await Promise.all([
    getCurrencyRates(),
    getSalesOptions(),
    buildPipelinesListQuery(supabase, params, { count: "estimated", range: { from, to } }),
    fetchPipelineListMetrics(supabase, params),
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
    totalValueHotProspect,
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
            ? "Budgetary and Tender pipelines across the team."
            : "Your Budgetary and Tender pipelines — progress and metrics for your own pipeline."
        }
        actions={<ExportPipelinesButton exportQuery={exportQuery} disabled={totalCount === 0} />}
      />
      <Suspense fallback={<div className="card shimmer h-24 rounded-2xl" />}>
        <PipelinesFilters
          progressType={params.progress_type}
          prospect={params.prospect}
          outcomeStatus={params.outcome_status}
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
          totalValueHotProspect={totalValueHotProspect}
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
