import type { SupabaseClient } from "@supabase/supabase-js";

export const PIPELINES_PAGE_SIZE = 50;

export type PipelineListParams = {
  q?: string;
  sales_stage?: string;
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
  sales_stage,
  sales_stage_changed_at,
  source_prospect_id,
  target_closing_at,
  pic_name,
  sales_id,
  customers ( id, name, slug )
`;

/** Strip characters that break PostgREST `or` / LIKE patterns. */
export function sanitizePipelineSearch(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function parsePipelineListParams(params: PipelineListParams) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sortBy = params.sort_by === "target_closing" ? "target_closing" : "date";
  const sortOrder = params.sort_order === "asc" ? "asc" : "desc";
  const q = sanitizePipelineSearch(params.q);

  return {
    page,
    sortBy,
    sortOrder,
    isAscending: sortOrder === "asc",
    q,
  };
}

/** Customer ids whose name matches the search (for OR with pipeline text fields). */
export async function resolvePipelineSearchCustomerIds(
  supabase: SupabaseClient,
  q: string
): Promise<string[]> {
  const cleaned = sanitizePipelineSearch(q);
  if (!cleaned) return [];

  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .ilike("name", `%${cleaned}%`)
    .limit(200);

  if (error) {
    console.error("[pipeline-search-customers]", error.message);
    return [];
  }

  return (data ?? []).map((c) => c.id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPipelineSearchFilter(query: any, q: string, customerIds: string[]) {
  const cleaned = sanitizePipelineSearch(q);
  if (!cleaned) return query;

  const pattern = `%${cleaned}%`;
  const parts = [
    `pipeline_name.ilike.${pattern}`,
    `no_quote.ilike.${pattern}`,
    `pic_name.ilike.${pattern}`,
  ];
  if (customerIds.length > 0) {
    parts.push(`customer_id.in.(${customerIds.join(",")})`);
  }
  return query.or(parts.join(","));
}

export function buildPipelinesListQuery(
  supabase: SupabaseClient,
  params: PipelineListParams,
  options?: {
    count?: "exact" | "estimated" | "planned";
    range?: { from: number; to: number };
    searchCustomerIds?: string[];
  }
) {
  const { sortBy, isAscending, q } = parsePipelineListParams(params);

  let query = supabase.from("pipelines").select(
    PIPELINE_SELECT,
    options?.count ? { count: options.count } : undefined
  );

  if (params.sales_stage) query = query.eq("sales_stage", params.sales_stage);
  if (params.sales_id) query = query.eq("sales_id", params.sales_id);

  if (q) {
    query = applyPipelineSearchFilter(query, q, options?.searchCustomerIds ?? []);
  }

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
  const q = sanitizePipelineSearch(params.q);
  if (q) search.set("q", q);
  if (params.sales_stage) search.set("sales_stage", params.sales_stage);
  if (params.sales_id) search.set("sales_id", params.sales_id);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.sort_order) search.set("sort_order", params.sort_order);
  return search.toString();
}
