import type { SupabaseClient } from "@supabase/supabase-js";

export const PROJECTS_PAGE_SIZE = 50;

export type ProjectListScope = "projects" | "bd";

export type ProjectListParams = {
  progress_type?: string;
  prospect?: string;
  sales_id?: string;
  sort_by?: string;
  sort_order?: string;
  page?: string;
};

const PROJECT_SELECT = `
  id,
  slug,
  created_at,
  no_quote,
  project_name,
  customer_id,
  value,
  progress_type,
  outcome_status,
  prospect,
  target_closing_at,
  sales_id,
  customers ( id, name, slug )
`;

export function parseProjectListParams(params: ProjectListParams) {
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

function applyScopeFilter<T extends { neq: (col: string, val: string) => T; eq: (col: string, val: string) => T }>(
  query: T,
  scope: ProjectListScope
): T {
  if (scope === "projects") return query.neq("progress_type", "BD");
  return query.eq("progress_type", "BD");
}

export function buildProjectsListQuery(
  supabase: SupabaseClient,
  params: ProjectListParams,
  options?: { count?: "exact"; range?: { from: number; to: number }; scope?: ProjectListScope }
) {
  const { sortBy, isAscending } = parseProjectListParams(params);
  const scope = options?.scope ?? "projects";

  let query = supabase.from("projects").select(
    PROJECT_SELECT,
    options?.count ? { count: options.count } : undefined
  );

  query = applyScopeFilter(query, scope);

  if (params.progress_type) query = query.eq("progress_type", params.progress_type);
  if (params.prospect) query = query.eq("prospect", params.prospect);
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

export function buildProjectsMetricsQuery(
  supabase: SupabaseClient,
  params: ProjectListParams,
  scope: ProjectListScope = "projects"
) {
  let query = supabase.from("projects").select("value, progress_type, prospect, outcome_status");

  query = applyScopeFilter(query, scope);

  if (params.progress_type) query = query.eq("progress_type", params.progress_type);
  if (params.prospect) query = query.eq("prospect", params.prospect);
  if (params.sales_id) query = query.eq("sales_id", params.sales_id);

  return query;
}

export function buildExportSearchParams(params: ProjectListParams, scope: ProjectListScope = "projects") {
  const search = new URLSearchParams();
  search.set("scope", scope);
  if (params.progress_type) search.set("progress_type", params.progress_type);
  if (params.prospect) search.set("prospect", params.prospect);
  if (params.sales_id) search.set("sales_id", params.sales_id);
  if (params.sort_by) search.set("sort_by", params.sort_by);
  if (params.sort_order) search.set("sort_order", params.sort_order);
  return search.toString();
}
