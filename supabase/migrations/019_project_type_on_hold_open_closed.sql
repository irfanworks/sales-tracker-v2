-- Project type (Project / Trading / Service)
-- Outcome: add On Hold
-- Lifecycle status: Open / Closed (ticketing-style)

-- 1) Project type
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type TEXT;

UPDATE public.projects
SET project_type = 'Project'
WHERE project_type IS NULL OR project_type = '';

ALTER TABLE public.projects
  ALTER COLUMN project_type SET DEFAULT 'Project';

ALTER TABLE public.projects
  ALTER COLUMN project_type SET NOT NULL;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_project_type_check
  CHECK (project_type IN ('Project', 'Trading', 'Service'));

CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);

-- 2) Outcome: Win / Lose / On Hold
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_outcome_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_outcome_status_check
  CHECK (outcome_status IS NULL OR outcome_status IN ('Win', 'Lose', 'On Hold'));

-- 3) Lifecycle status Open / Closed (reuse legacy status column)
UPDATE public.projects
SET status = 'Open'
WHERE status IS NULL
   OR status = ''
   OR status NOT IN ('Open', 'Closed');

ALTER TABLE public.projects
  ALTER COLUMN status SET DEFAULT 'Open';

ALTER TABLE public.projects
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('Open', 'Closed'));

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- 4) Dashboard RPC: exclude Lose and On Hold from total_value
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
    COALESCE(
      SUM(
        CASE
          WHEN p.outcome_status IS DISTINCT FROM 'Lose'
           AND p.outcome_status IS DISTINCT FROM 'On Hold'
          THEN COALESCE(p.value, 0)
          ELSE 0
        END
      ),
      0
    ) AS total_value,
    COUNT(*)::bigint AS project_count
  FROM projects p
  GROUP BY p.sales_id;
$$;
