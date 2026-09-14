import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineListParams } from "@/lib/pipelinesQuery";
import { sanitizePipelineSearch } from "@/lib/pipelinesQuery";

export type PipelineListMetrics = {
  totalValueProject: number;
  totalValueWin: number;
  totalValueLateStage: number;
  projectLose: number;
  projectOnHold: number;
  valueProjectOnHold: number;
  tenderOnProgress: number;
};

const EMPTY_METRICS: PipelineListMetrics = {
  totalValueProject: 0,
  totalValueWin: 0,
  totalValueLateStage: 0,
  projectLose: 0,
  projectOnHold: 0,
  valueProjectOnHold: 0,
  tenderOnProgress: 0,
};

function mapRpcRow(row: Record<string, unknown> | null | undefined): PipelineListMetrics {
  if (!row) return EMPTY_METRICS;
  return {
    totalValueProject: Number(row.total_value_project ?? 0),
    totalValueWin: Number(row.total_value_win ?? 0),
    totalValueLateStage: Number(row.total_value_hot_prospect ?? 0),
    projectLose: Number(row.project_lose ?? 0),
    projectOnHold: Number(row.project_on_hold ?? 0),
    valueProjectOnHold: Number(row.value_project_on_hold ?? 0),
    tenderOnProgress: Number(row.tender_on_progress ?? 0),
  };
}

/**
 * Server-side aggregates for the pipeline list summary cards.
 * Prefer DB RPCs so Node never receives every matching row.
 */
export async function fetchPipelineListMetrics(
  supabase: SupabaseClient,
  params: PipelineListParams,
  searchCustomerIds: string[] = []
): Promise<PipelineListMetrics> {
  const q = sanitizePipelineSearch(params.q);

  if (q) {
    const { data, error } = await supabase.rpc("get_pipeline_list_metrics_search", {
      p_sales_stage: params.sales_stage ?? null,
      p_sales_id: params.sales_id ?? null,
      p_q: q,
      p_customer_ids: searchCustomerIds.length > 0 ? searchCustomerIds : null,
    });

    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      return mapRpcRow(row as Record<string, unknown> | null);
    }
    // Do not fall back to unfiltered metrics — that would mislead users while searching.
    console.warn("[pipeline-metrics-search] RPC unavailable:", error.message);
    return EMPTY_METRICS;
  }

  const { data, error } = await supabase.rpc("get_pipeline_list_metrics", {
    p_sales_stage: params.sales_stage ?? null,
    p_sales_id: params.sales_id ?? null,
  });

  if (error) {
    console.warn("[pipeline-metrics] RPC unavailable:", error.message);
    return EMPTY_METRICS;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return mapRpcRow(row as Record<string, unknown> | null);
}
