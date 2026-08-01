-- When a pipeline or prospect is deleted, purge its prior sales_activity_log rows.
-- The app may still insert a single "…_deleted" entry afterwards for the weekly review.

CREATE OR REPLACE FUNCTION public.purge_sales_activity_for_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'pipelines' THEN
    DELETE FROM public.sales_activity_log
    WHERE entity_type = 'pipeline'
      AND entity_id = OLD.id;
  ELSIF TG_TABLE_NAME = 'prospects' THEN
    DELETE FROM public.sales_activity_log
    WHERE entity_type = 'prospect'
      AND entity_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_pipelines_purge_activity ON public.pipelines;
CREATE TRIGGER trg_pipelines_purge_activity
  AFTER DELETE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.purge_sales_activity_for_entity();

DROP TRIGGER IF EXISTS trg_prospects_purge_activity ON public.prospects;
CREATE TRIGGER trg_prospects_purge_activity
  AFTER DELETE ON public.prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.purge_sales_activity_for_entity();

-- Allow sales (and admin) to purge entity history from the client as a fallback
-- before the row is deleted (trigger remains the primary path).
DROP POLICY IF EXISTS "Admin can delete sales activity" ON public.sales_activity_log;
DROP POLICY IF EXISTS "Authenticated can purge entity activity" ON public.sales_activity_log;
CREATE POLICY "Authenticated can purge entity activity"
  ON public.sales_activity_log FOR DELETE TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR actor_id = auth.uid()
    OR (
      entity_type = 'pipeline'
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.pipelines p
        WHERE p.id = sales_activity_log.entity_id
          AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
      )
    )
    OR (
      entity_type = 'prospect'
      AND entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.prospects pr
        WHERE pr.id = sales_activity_log.entity_id
          AND (pr.sales_id = auth.uid() OR public.get_my_role() = 'admin')
      )
    )
  );

COMMENT ON FUNCTION public.purge_sales_activity_for_entity() IS
  'Removes sales_activity_log history for a deleted pipeline or prospect';
