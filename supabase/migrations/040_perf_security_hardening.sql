-- Production hardening: authz locks, activity RLS, overdue index, search metrics RPC

-- 1) Prevent privilege escalation: users cannot change their own role / email
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       AND COALESCE(public.get_my_role(), '') <> 'admin'
       AND auth.uid() IS DISTINCT FROM NULL THEN
      -- Allow service role (auth.uid() null in some admin contexts) and admins only
      IF auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'Changing profile role is not allowed';
      END IF;
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email
       AND COALESCE(public.get_my_role(), '') <> 'admin'
       AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Changing profile email is not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 2) Sales activity: sales see own rows; admin sees all
DROP POLICY IF EXISTS "Authenticated can read sales activity" ON public.sales_activity_log;
CREATE POLICY "Sales activity select own or admin"
  ON public.sales_activity_log FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR public.get_my_role() = 'admin'
  );

-- 3) Customers writes: require admin/sales role (not any authenticated identity)
DROP POLICY IF EXISTS "Authenticated can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated can delete customers" ON public.customers;

CREATE POLICY "Sales can insert customers"
  ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

CREATE POLICY "Sales can update customers"
  ON public.customers FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'sales'));

CREATE POLICY "Sales can delete customers"
  ON public.customers FOR DELETE TO authenticated
  USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "Authenticated can insert customer_pics" ON public.customer_pics;
DROP POLICY IF EXISTS "Authenticated can update customer_pics" ON public.customer_pics;
DROP POLICY IF EXISTS "Authenticated can delete customer_pics" ON public.customer_pics;

CREATE POLICY "Sales can insert customer_pics"
  ON public.customer_pics FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

CREATE POLICY "Sales can update customer_pics"
  ON public.customer_pics FOR UPDATE TO authenticated
  USING (public.get_my_role() IN ('admin', 'sales'));

CREATE POLICY "Sales can delete customer_pics"
  ON public.customer_pics FOR DELETE TO authenticated
  USING (public.get_my_role() IN ('admin', 'sales'));

-- 4) Replace dead outcome_status overdue index with sales_stage equivalent
DROP INDEX IF EXISTS public.idx_pipelines_overdue_no_outcome;
CREATE INDEX IF NOT EXISTS idx_pipelines_overdue_open_stage
  ON public.pipelines (target_closing_at ASC)
  WHERE COALESCE(status, 'Open') = 'Open'
    AND target_closing_at IS NOT NULL
    AND sales_stage IS DISTINCT FROM 'Win'
    AND sales_stage IS DISTINCT FROM 'Lose'
    AND sales_stage IS DISTINCT FROM 'On Hold';

-- 5) Pipeline list metrics with optional text search (avoids shipping all rows to Node)
CREATE OR REPLACE FUNCTION public.get_pipeline_list_metrics_search(
  p_sales_stage text DEFAULT NULL,
  p_sales_id uuid DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_customer_ids uuid[] DEFAULT NULL
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
    AND (p_sales_id IS NULL OR p.sales_id = p_sales_id)
    AND (
      p_q IS NULL
      OR length(trim(p_q)) = 0
      OR p.pipeline_name ILIKE '%' || p_q || '%'
      OR p.no_quote ILIKE '%' || p_q || '%'
      OR COALESCE(p.pic_name, '') ILIKE '%' || p_q || '%'
      OR (
        p_customer_ids IS NOT NULL
        AND p.customer_id = ANY (p_customer_ids)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_pipeline_list_metrics_search(text, uuid, text, uuid[])
  TO authenticated;
