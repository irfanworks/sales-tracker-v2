-- Progress type: Budgetary, Tender, BD (Win/Lose moved to outcome_status)

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS outcome_status TEXT
  CHECK (outcome_status IS NULL OR outcome_status IN ('Win', 'Lose'));

UPDATE public.projects
SET outcome_status = 'Win', progress_type = 'Tender'
WHERE progress_type = 'Win';

UPDATE public.projects
SET outcome_status = 'Lose', progress_type = 'Tender'
WHERE progress_type = 'Lose';

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_progress_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_progress_type_check
  CHECK (progress_type IN ('Budgetary', 'Tender', 'BD'));

ALTER TABLE public.projects ALTER COLUMN value DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_outcome_status ON public.projects(outcome_status);

-- Dashboard aggregations use outcome_status for Win/Lose
CREATE OR REPLACE FUNCTION get_sales_performance()
RETURNS TABLE (
  sales_id uuid,
  total_value numeric,
  project_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.sales_id,
    COALESCE(SUM(CASE WHEN p.outcome_status IS DISTINCT FROM 'Lose' THEN COALESCE(p.value, 0) ELSE 0 END), 0) AS total_value,
    COUNT(*)::bigint AS project_count
  FROM projects p
  GROUP BY p.sales_id;
$$;
