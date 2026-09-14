-- Sales Stage (replaces progress_type / prospect heat / outcome_status on pipelines)
-- + stage history + prospect estimated_value + convert linkage

-- 1) Enumerated sales stages
DO $$ BEGIN
  CREATE TYPE public.sales_stage AS ENUM (
    'Identified',
    'Qualified',
    'Budgetary Submitted',
    'Tender/RFQ',
    'Technical Clarification',
    'Commercial Negotiation',
    'LOA/PO Pending',
    'Win',
    'Lose',
    'On Hold'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Columns on pipelines
ALTER TABLE public.pipelines
  ADD COLUMN IF NOT EXISTS sales_stage public.sales_stage,
  ADD COLUMN IF NOT EXISTS sales_stage_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL;

-- 3) Backfill sales_stage from legacy fields
UPDATE public.pipelines
SET
  sales_stage = CASE
    WHEN outcome_status = 'Win' THEN 'Win'::public.sales_stage
    WHEN outcome_status = 'Lose' THEN 'Lose'::public.sales_stage
    WHEN outcome_status = 'On Hold' THEN 'On Hold'::public.sales_stage
    WHEN progress_type = 'Tender' THEN 'Tender/RFQ'::public.sales_stage
    WHEN progress_type = 'Budgetary' THEN 'Budgetary Submitted'::public.sales_stage
    ELSE 'Identified'::public.sales_stage
  END,
  sales_stage_changed_at = COALESCE(sales_stage_changed_at, created_at, NOW()),
  status = CASE
    WHEN outcome_status IN ('Win', 'Lose') THEN 'Closed'
    ELSE COALESCE(status, 'Open')
  END
WHERE sales_stage IS NULL;

UPDATE public.pipelines
SET sales_stage = 'Identified'::public.sales_stage
WHERE sales_stage IS NULL;

UPDATE public.pipelines
SET sales_stage_changed_at = COALESCE(sales_stage_changed_at, created_at, NOW())
WHERE sales_stage_changed_at IS NULL;

ALTER TABLE public.pipelines
  ALTER COLUMN sales_stage SET DEFAULT 'Identified'::public.sales_stage,
  ALTER COLUMN sales_stage SET NOT NULL,
  ALTER COLUMN sales_stage_changed_at SET DEFAULT NOW(),
  ALTER COLUMN sales_stage_changed_at SET NOT NULL;

-- Closed without Win/Lose is not allowed going forward
UPDATE public.pipelines
SET status = 'Open'
WHERE status = 'Closed'
  AND sales_stage IS DISTINCT FROM 'Win'
  AND sales_stage IS DISTINCT FROM 'Lose';

ALTER TABLE public.pipelines
  DROP CONSTRAINT IF EXISTS pipelines_closed_requires_win_lose;

ALTER TABLE public.pipelines
  ADD CONSTRAINT pipelines_closed_requires_win_lose
  CHECK (
    status IS DISTINCT FROM 'Closed'
    OR sales_stage IN ('Win', 'Lose')
  );

ALTER TABLE public.pipelines
  DROP CONSTRAINT IF EXISTS pipelines_win_lose_are_closed;

ALTER TABLE public.pipelines
  ADD CONSTRAINT pipelines_win_lose_are_closed
  CHECK (
    sales_stage NOT IN ('Win', 'Lose')
    OR status = 'Closed'
  );

CREATE INDEX IF NOT EXISTS idx_pipelines_sales_stage ON public.pipelines (sales_stage);
CREATE INDEX IF NOT EXISTS idx_pipelines_source_prospect ON public.pipelines (source_prospect_id);

-- 4) Stage history
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  stage public.sales_stage NOT NULL,
  previous_stage public.sales_stage NULL,
  changed_at timestamptz NOT NULL DEFAULT NOW(),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text NULL,
  reason text NULL
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_pipeline
  ON public.pipeline_stage_history (pipeline_id, changed_at DESC);

ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pipeline_stage_history_select" ON public.pipeline_stage_history;
CREATE POLICY "pipeline_stage_history_select"
  ON public.pipeline_stage_history FOR SELECT TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id AND p.sales_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pipeline_stage_history_insert" ON public.pipeline_stage_history;
CREATE POLICY "pipeline_stage_history_insert"
  ON public.pipeline_stage_history FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id AND p.sales_id = auth.uid()
    )
  );

-- Seed initial history from current stage (idempotent-ish: only when empty)
INSERT INTO public.pipeline_stage_history (pipeline_id, stage, previous_stage, changed_at, note)
SELECT p.id, p.sales_stage, NULL, p.sales_stage_changed_at, 'Migrated from legacy progress/outcome'
FROM public.pipelines p
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_stage_history h WHERE h.pipeline_id = p.id
);

-- 5) Drop legacy pipeline fields
ALTER TABLE public.pipelines
  DROP COLUMN IF EXISTS progress_type,
  DROP COLUMN IF EXISTS prospect,
  DROP COLUMN IF EXISTS outcome_status;

-- 6) Prospect estimated value for convert
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS estimated_value numeric NULL;

-- 7) Refresh list metrics RPC for sales_stage
CREATE OR REPLACE FUNCTION public.get_pipeline_list_metrics(
  p_sales_stage text DEFAULT NULL,
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
        WHEN COALESCE(p.status, 'Open') = 'Open'
         AND p.sales_stage IS DISTINCT FROM 'Lose'
         AND p.sales_stage IS DISTINCT FROM 'On Hold'
        THEN COALESCE(p.value, 0)
        ELSE 0
      END
    ), 0) AS total_value_project,
    COALESCE(SUM(
      CASE WHEN p.sales_stage = 'Win' THEN COALESCE(p.value, 0) ELSE 0 END
    ), 0) AS total_value_win,
    COALESCE(SUM(
      CASE
        WHEN COALESCE(p.status, 'Open') = 'Open'
         AND p.sales_stage IN (
           'Technical Clarification',
           'Commercial Negotiation',
           'LOA/PO Pending'
         )
        THEN COALESCE(p.value, 0)
        ELSE 0
      END
    ), 0) AS total_value_hot_prospect,
    COUNT(*) FILTER (WHERE p.sales_stage = 'Lose')::bigint AS project_lose,
    COUNT(*) FILTER (WHERE p.sales_stage = 'On Hold')::bigint AS project_on_hold,
    COALESCE(SUM(
      CASE WHEN p.sales_stage = 'On Hold' THEN COALESCE(p.value, 0) ELSE 0 END
    ), 0) AS value_project_on_hold,
    COUNT(*) FILTER (
      WHERE p.sales_stage = 'Tender/RFQ' AND COALESCE(p.status, 'Open') = 'Open'
    )::bigint AS tender_on_progress
  FROM public.pipelines p
  WHERE (p_sales_stage IS NULL OR p.sales_stage::text = p_sales_stage)
    AND (p_sales_id IS NULL OR p.sales_id = p_sales_id);
$$;

-- Drop old 4-arg overload if present
DROP FUNCTION IF EXISTS public.get_pipeline_list_metrics(text, text, text, uuid);

GRANT EXECUTE ON FUNCTION public.get_pipeline_list_metrics(text, uuid) TO authenticated;

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
    WHERE sales_stage = 'Win'
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
         AND s.sales_stage IS DISTINCT FROM 'Lose'
         AND s.sales_stage IS DISTINCT FROM 'On Hold'
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
        WHEN COALESCE(s.status, 'Open') = 'Open'
         AND s.sales_stage IN (
           'Technical Clarification',
           'Commercial Negotiation',
           'LOA/PO Pending'
         )
        THEN COALESCE(s.value, 0)
        ELSE 0
      END
    ), 0) AS hot_prospect_value,
    COUNT(*)::bigint AS total_proposals,
    COUNT(*) FILTER (WHERE s.sales_stage = 'Win')::bigint AS total_project_win_count,
    COUNT(*) FILTER (
      WHERE s.sales_stage = 'Tender/RFQ' AND COALESCE(s.status, 'Open') = 'Open'
    )::bigint AS tender_on_progress
  FROM scoped s;
$$;

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
    AND p.sales_stage IS DISTINCT FROM 'Lose'
    AND p.sales_stage IS DISTINCT FROM 'On Hold'
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
    AND p.sales_stage IS DISTINCT FROM 'Lose'
    AND p.sales_stage IS DISTINCT FROM 'On Hold'
  GROUP BY 1
  ORDER BY project_count DESC, total_value DESC;
$$;
