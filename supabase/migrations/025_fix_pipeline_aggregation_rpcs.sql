-- Fix continuation after 024 failed on get_sales_performance return type.
-- Safe to run even if earlier parts of 024 already succeeded.

-- Drop + recreate with the SAME OUT signature as production (019), pointing at pipelines
DROP FUNCTION IF EXISTS public.get_sales_performance();
DROP FUNCTION IF EXISTS public.get_sector_coverage();

CREATE FUNCTION public.get_sales_performance()
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
  FROM public.pipelines p
  GROUP BY p.sales_id;
$$;

CREATE FUNCTION public.get_sector_coverage()
RETURNS TABLE (
  sector text,
  project_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(TRIM(c.sector), ''), 'Unspecified') AS sector,
    COUNT(*)::bigint AS project_count
  FROM public.pipelines p
  INNER JOIN public.customers c ON c.id = p.customer_id
  GROUP BY 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_sales_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sector_coverage() TO authenticated;

-- Finish remaining 024 tail (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quote_revisions_project_id_revision_key'
  ) THEN
    ALTER TABLE public.quote_revisions
      RENAME CONSTRAINT quote_revisions_project_id_revision_key
      TO quote_revisions_pipeline_id_revision_key;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ANALYZE public.pipelines;
ANALYZE public.pipeline_updates;
ANALYZE public.quote_revisions;
ANALYZE public.customers;
ANALYZE public.profiles;

COMMENT ON TABLE public.pipelines IS 'Sales pipeline / quote records (renamed from projects)';
COMMENT ON TABLE public.pipeline_updates IS 'Pipeline progress update history (renamed from project_updates)';
COMMENT ON COLUMN public.pipelines.pipeline_type IS
  'Work category: Project | Trading | Service (entity is Pipeline; type Project = project-work)';
