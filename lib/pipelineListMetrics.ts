import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineListParams } from "@/lib/pipelinesQuery";
import {
  calcPipelineSecondaryMetrics,
  calcPipelineValueMetrics,
} from "@/lib/pipelineMetrics";

export type PipelineListMetrics = {
  totalValueProject: number;
  totalValueWin: number;
  totalValueHotProspect: number;
  projectLose: number;
  projectOnHold: number;
  valueProjectOnHold: number;
  tenderOnProgress: number;
};

const EMPTY_METRICS: PipelineListMetrics = {
  totalValueProject: 0,
  totalValueWin: 0,
  totalValueHotProspect: 0,
  projectLose: 0,
  projectOnHold: 0,
  valueProjectOnHold: 0,
  tenderOnProgress: 0,
};

async function fetchMetricsFallback(
  supabase: SupabaseClient,
  params: PipelineListParams
): Promise<PipelineListMetrics> {
  let query = supabase
    .from("pipelines")
    .select("value, progress_type, prospect, outcome_status, status");

  if (params.progress_type) query = query.eq("progress_type", params.progress_type);
  if (params.prospect) query = query.eq("prospect", params.prospect);
  if (params.outcome_status) query = query.eq("outcome_status", params.outcome_status);
  if (params.sales_id) query = query.eq("sales_id", params.sales_id);

  const { data, error } = await query;
  if (error || !data) {
    console.error("[pipeline-metrics-fallback]", error?.message);
    return EMPTY_METRICS;
  }

  const rows = data.map((p) => ({
    value: p.value != null ? Number(p.value) : null,
    progress_type: p.progress_type,
    prospect: p.prospect,
    outcome_status: p.outcome_status,
    status: p.status,
  }));

  const values = calcPipelineValueMetrics(rows);
  const secondary = calcPipelineSecondaryMetrics(rows);
  return { ...values, ...secondary };
}

/**
 * Server-side aggregates for the pipeline list summary cards.
 * Falls back to row transfer if the RPC is not deployed yet.
 */
export async function fetchPipelineListMetrics(
  supabase: SupabaseClient,
  params: PipelineListParams
): Promise<PipelineListMetrics> {
  const { data, error } = await supabase.rpc("get_pipeline_list_metrics", {
    p_progress_type: params.progress_type ?? null,
    p_prospect: params.prospect ?? null,
    p_outcome_status: params.outcome_status ?? null,
    p_sales_id: params.sales_id ?? null,
  });

  if (error) {
    console.warn("[pipeline-metrics] RPC unavailable, using fallback:", error.message);
    return fetchMetricsFallback(supabase, params);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return EMPTY_METRICS;

  return {
    totalValueProject: Number(row.total_value_project ?? 0),
    totalValueWin: Number(row.total_value_win ?? 0),
    totalValueHotProspect: Number(row.total_value_hot_prospect ?? 0),
    projectLose: Number(row.project_lose ?? 0),
    projectOnHold: Number(row.project_on_hold ?? 0),
    valueProjectOnHold: Number(row.value_project_on_hold ?? 0),
    tenderOnProgress: Number(row.tender_on_progress ?? 0),
  };
}
