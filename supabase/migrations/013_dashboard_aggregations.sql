-- Dashboard aggregations: avoid loading all project rows on the home page.

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
    COALESCE(SUM(CASE WHEN p.progress_type <> 'Lose' THEN p.value ELSE 0 END), 0) AS total_value,
    COUNT(*)::bigint AS project_count
  FROM projects p
  GROUP BY p.sales_id;
$$;

CREATE OR REPLACE FUNCTION get_sector_coverage()
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
  FROM projects p
  INNER JOIN customers c ON c.id = p.customer_id
  GROUP BY 1;
$$;

GRANT EXECUTE ON FUNCTION get_sales_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION get_sector_coverage() TO authenticated;
