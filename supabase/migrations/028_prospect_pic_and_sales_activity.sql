-- Add PIC to prospects; create company-wide sales activity log for director monitoring.

ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS pic_name TEXT;

COMMENT ON COLUMN public.prospects.pic_name IS
  'Customer PIC name snapshot (from customer_pics.nama)';

CREATE TABLE IF NOT EXISTS public.sales_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  entity_label TEXT,
  summary TEXT NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_activity_log_created_at
  ON public.sales_activity_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_activity_log_actor_id
  ON public.sales_activity_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_activity_log_action_type
  ON public.sales_activity_log (action_type);

ALTER TABLE public.sales_activity_log ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (directors / admin monitor; sales see company activity)
DROP POLICY IF EXISTS "Authenticated can read sales activity" ON public.sales_activity_log;
CREATE POLICY "Authenticated can read sales activity"
  ON public.sales_activity_log FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own sales activity" ON public.sales_activity_log;
CREATE POLICY "Users can insert own sales activity"
  ON public.sales_activity_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

DROP POLICY IF EXISTS "Admin can delete sales activity" ON public.sales_activity_log;
CREATE POLICY "Admin can delete sales activity"
  ON public.sales_activity_log FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

COMMENT ON TABLE public.sales_activity_log IS
  'Human-readable feed of sales actions for director monitoring';

ANALYZE public.sales_activity_log;
ANALYZE public.prospects;
