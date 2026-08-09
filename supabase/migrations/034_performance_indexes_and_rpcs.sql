-- Performance: indexes + aggregate RPCs (avoid full-row transfers for metrics/dashboard).

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_prospects_updated_at
  ON public.prospects (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_name
  ON public.customers (name);

CREATE INDEX IF NOT EXISTS idx_pipelines_sales_created
  ON public.pipelines (sales_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipelines_sales_target_closing
  ON public.pipelines (sales_id, target_closing_at ASC NULLS LAST);

-- Open overdue without outcome (layout modal + attention lists)
CREATE INDEX IF NOT EXISTS idx_pipelines_overdue_no_outcome
  ON public.pipelines (target_closing_at ASC)
  WHERE outcome_status IS NULL
    AND (status IS NULL OR status = 'Open')
    AND target_closing_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Pipeline list page metrics (replaces selecting every row into JS)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_pipeline_list_metrics(
  p_progress_type text DEFAULT NULL,
  p_prospect text DEFAULT NULL,
  p_outcome_status text DEFAULT NULL,
  p_sales_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_value_project numeric,
  total_value_win numeric,
  total_value_hot_prospect numeric,
  project_lose bigint,
  project_on_hold bigint,
  value_project_on_hold numeric,
  tender_on_progress bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(
      CASE
        WHEN p.outcome_status IS DISTINCT FROM 'Lose'
         AND p.outcome_status IS DISTINCT FROM 'On Hold'
        THEN COALESCE(p.value, 0)
        ELSE 0
      END
    ), 0) AS total_value_project,
    COALESCE(SUM(
      CASE WHEN p.outcome_status = 'Win' THEN COALESCE(p.value, 0) ELSE 0 END
    ), 0) AS total_value_win,
    COALESCE(SUM(
      CASE
        WHEN p.prospect = 'Hot Prospect'
         AND p.outcome_status IS DISTINCT FROM 'Lose'
         AND p.outcome_status IS DISTINCT FROM 'On Hold'
        THEN COALESCE(p.value, 0)
        ELSE 0
      END
    ), 0) AS total_value_hot_prospect,
    COUNT(*) FILTER (WHERE p.outcome_status = 'Lose')::bigint AS project_lose,
    COUNT(*) FILTER (WHERE p.outcome_status = 'On Hold')::bigint AS project_on_hold,
    COALESCE(SUM(
      CASE WHEN p.outcome_status = 'On Hold' THEN COALESCE(p.value, 0) ELSE 0 END
    ), 0) AS value_project_on_hold,
    COUNT(*) FILTER (
      WHERE p.progress_type = 'Tender'
        AND COALESCE(p.status, 'Open') = 'Open'
    )::bigint AS tender_on_progress
  FROM public.pipelines p
  WHERE (p_progress_type IS NULL OR p.progress_type = p_progress_type)
    AND (p_prospect IS NULL OR p.prospect = p_prospect)
    AND (p_outcome_status IS NULL OR p.outcome_status = p_outcome_status)
    AND (p_sales_id IS NULL OR p.sales_id = p_sales_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_pipeline_list_metrics(text, text, text, uuid)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- Dashboard KPIs (single row aggregate)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_sales_id uuid DEFAULT NULL
)
RETURNS TABLE (
  total_pipeline_value numeric,
  total_won numeric,
  closing_for_target numeric,
  hot_prospect_value numeric,
  total_proposals bigint,
  total_project_win_count bigint,
  tender_on_progress bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH scoped AS (
    SELECT *
    FROM public.pipelines p
    WHERE p_sales_id IS NULL OR p.sales_id = p_sales_id
  ),
  wins AS (
    SELECT COALESCE(value, 0) AS value, created_at
    FROM scoped
    WHERE outcome_status = 'Win'
  ),
  won_ytd AS (
    SELECT COALESCE(SUM(value), 0) AS v
    FROM wins
    WHERE EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Jakarta')
      = EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Jakarta'))
  ),
  won_all AS (
    SELECT COALESCE(SUM(value), 0) AS v FROM wins
  )
  SELECT
    COALESCE(SUM(
      CASE
        WHEN COALESCE(s.status, 'Open') = 'Open'
         AND s.outcome_status IS DISTINCT FROM 'Lose'
         AND s.outcome_status IS DISTINCT FROM 'On Hold'
        THEN COALESCE(s.value, 0)
        ELSE 0
      END
    ), 0) AS total_pipeline_value,
    (SELECT v FROM won_all) AS total_won,
    CASE
      WHEN (SELECT v FROM won_ytd) > 0 THEN (SELECT v FROM won_ytd)
      ELSE (SELECT v FROM won_all)
    END AS closing_for_target,
    COALESCE(SUM(
      CASE
        WHEN s.prospect = 'Hot Prospect'
         AND s.outcome_status IS DISTINCT FROM 'Lose'
         AND s.outcome_status IS DISTINCT FROM 'On Hold'
        THEN COALESCE(s.value, 0)
        ELSE 0
      END
    ), 0) AS hot_prospect_value,
    COUNT(*)::bigint AS total_proposals,
    COUNT(*) FILTER (WHERE s.outcome_status = 'Win')::bigint AS total_project_win_count,
    COUNT(*) FILTER (
      WHERE s.progress_type = 'Tender' AND COALESCE(s.status, 'Open') = 'Open'
    )::bigint AS tender_on_progress
  FROM scoped s;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(uuid) TO authenticated;

-- Work by pipeline_type
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
  WHERE p_sales_id IS NULL OR p.sales_id = p_sales_id
  GROUP BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_work_by_type(uuid) TO authenticated;

-- Work by customer sector (sales-filterable)
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
  INNER JOIN public.customers c ON c.id = p.customer_id
  WHERE p_sales_id IS NULL OR p.sales_id = p_sales_id
  GROUP BY 1
  ORDER BY project_count DESC, total_value DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_work_by_sector(uuid) TO authenticated;

ANALYZE public.pipelines;
ANALYZE public.prospects;
ANALYZE public.customers;
