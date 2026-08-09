-- Dashboard Work by Category / Sector: same filter as Total Pipeline
-- Open (or null status), exclude outcome Lose / On Hold

CREATE OR REPLACE FUNCTION public.get_dashboard_work_by_type(
  p_sales_id uuid DEFAULT NULL
)
RETURNS TABLE (
  label text,
  project_count bigint,
  total_value numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(p.pipeline_type), ''), 'Project') AS label,
    COUNT(*)::bigint AS project_count,
    COALESCE(SUM(COALESCE(p.value, 0)), 0) AS total_value
  FROM public.pipelines p
  WHERE (p_sales_id IS NULL OR p.sales_id = p_sales_id)
    AND COALESCE(p.status, 'Open') = 'Open'
    AND p.outcome_status IS DISTINCT FROM 'Lose'
    AND p.outcome_status IS DISTINCT FROM 'On Hold'
  GROUP BY 1;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_work_by_sector(
  p_sales_id uuid DEFAULT NULL
)
RETURNS TABLE (
  sector text,
  project_count bigint,
  total_value numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(c.sector), ''), 'Unspecified') AS sector,
    COUNT(*)::bigint AS project_count,
    COALESCE(SUM(COALESCE(p.value, 0)), 0) AS total_value
  FROM public.pipelines p
  LEFT JOIN public.customers c ON c.id = p.customer_id
  WHERE (p_sales_id IS NULL OR p.sales_id = p_sales_id)
    AND COALESCE(p.status, 'Open') = 'Open'
    AND p.outcome_status IS DISTINCT FROM 'Lose'
    AND p.outcome_status IS DISTINCT FROM 'On Hold'
  GROUP BY 1
  ORDER BY project_count DESC, total_value DESC;
$$;
