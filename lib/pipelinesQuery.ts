import type { SupabaseClient } from "@supabase/supabase-js";

export const PIPELINES_PAGE_SIZE = 50;

export type PipelineListParams = {
  progress_type?: string;
  prospect?: string;
  outcome_status?: string;
  sales_id?: string;
  sort_by?: string;
  sort_order?: string;
  page?: string;
};

const PIPELINE_SELECT = `
  id,
  slug,
  created_at,
  no_quote,
  pipeline_name,
  customer_id,
  value,
  pipeline_type,
  status,
  progress_type,
  outcome_status,
  prospect,
  target_closing_at,
  pic_name,
  sales_id,
  customers ( id, name, slug )
`;

export function parsePipelineListParams(params: PipelineListParams) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sortBy = params.sort_by === "target_closing" ? "target_closing" : "date";
  const sortOrder = params.sort_order === "asc" ? "asc" : "desc";

  return {
    page,
    sortBy,
    sortOrder,
    isAscending: sortOrder === "asc",
  };
}

export function buildPipelinesListQuery(
  supabase: SupabaseClient,
  params: PipelineListParams,
  options?: {
    count?: "exact" | "estimated" | "planned";
    range?: { from: number; to: number };
  }
) {
  const { sortBy, isAscending } = parsePipelineListParams(params);

  let query = supabase.from("pipelines").select(
    PIPELINE_SELECT,
    options?.count ? { count: options.count } : undefined
  );

  if (params.progress_type) query = query.eq("progress_type", params.progress_type);
  if (params.prospect) query = query.eq("prospect", params.prospect);
  if (params.outcome_status) query = query.eq("outcome_status", params.outcome_status);
  if (params.sales_id) query = query.eq("sales_id", params.sales_id);

  if (sortBy === "target_closing") {
    query = query.order("target_closing_at", { ascending: isAscending, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: isAscending });
  }

  if (options?.range) {
    query = query.range(options.range.from, options.range.to);
  }

  return query;
}

export function buildExportSearchParams(params: PipelineListParams) {
  const search = new URLSearchParams();
  if (params.progress_type) search.set("progress_type", params.progress_type);
  if (params.prospect) search.set("prospect", params.prospect);
  if (params.outcome_status) search.set("outcome_status", params.outcome_status);
  if (params.sales_id) search.set("sales_id", params.sales_id);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.sort_order) search.set("sort_order", params.sort_order);
  return search.toString();
}
