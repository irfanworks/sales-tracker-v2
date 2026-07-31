-- Remove BD progress type; add Prospects module for pre-quote opportunities.

-- 1) Migrate existing BD pipelines into Tender funnel
UPDATE public.pipelines
SET progress_type = 'Tender'
WHERE progress_type = 'BD';

ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS projects_progress_type_check;
ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS pipelines_progress_type_check;

-- Discover any leftover check name
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.pipelines'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%progress_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.pipelines
  ADD CONSTRAINT pipelines_progress_type_check
  CHECK (progress_type IN ('Budgetary', 'Tender'));

-- 2) Prospects (pre-quote business opportunities)
CREATE TABLE IF NOT EXISTS public.prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  work_description TEXT,
  status TEXT NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Closed', 'Converted')),
  sales_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latest_update TEXT
);

CREATE INDEX IF NOT EXISTS idx_prospects_sales_id ON public.prospects(sales_id);
CREATE INDEX IF NOT EXISTS idx_prospects_customer_id ON public.prospects(customer_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON public.prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_created_at ON public.prospects(created_at DESC);

CREATE TABLE IF NOT EXISTS public.prospect_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_prospect_updates_prospect_id
  ON public.prospect_updates(prospect_id, created_at DESC);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospect_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales can read own prospects" ON public.prospects;
CREATE POLICY "Sales can read own prospects"
  ON public.prospects FOR SELECT TO authenticated
  USING (sales_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Sales can insert own prospects" ON public.prospects;
CREATE POLICY "Sales can insert own prospects"
  ON public.prospects FOR INSERT TO authenticated
  WITH CHECK (sales_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Sales can update own prospects" ON public.prospects;
CREATE POLICY "Sales can update own prospects"
  ON public.prospects FOR UPDATE TO authenticated
  USING (sales_id = auth.uid() OR public.get_my_role() = 'admin')
  WITH CHECK (sales_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Sales can delete own prospects" ON public.prospects;
CREATE POLICY "Sales can delete own prospects"
  ON public.prospects FOR DELETE TO authenticated
  USING (sales_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Read prospect_updates if can read prospect" ON public.prospect_updates;
CREATE POLICY "Read prospect_updates if can read prospect"
  ON public.prospect_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.prospects p
      WHERE p.id = prospect_updates.prospect_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "Insert prospect_updates if can update prospect" ON public.prospect_updates;
CREATE POLICY "Insert prospect_updates if can update prospect"
  ON public.prospect_updates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prospects p
      WHERE p.id = prospect_updates.prospect_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admin can delete prospect updates" ON public.prospect_updates;
CREATE POLICY "Admin can delete prospect updates"
  ON public.prospect_updates FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE OR REPLACE FUNCTION public.touch_prospect_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prospects_updated_at ON public.prospects;
CREATE TRIGGER trg_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.touch_prospect_updated_at();

COMMENT ON TABLE public.prospects IS
  'Pre-quote business opportunities (customer + work + progress updates)';
COMMENT ON TABLE public.prospect_updates IS
  'Activity / progress log for prospects';

ANALYZE public.prospects;
ANALYZE public.prospect_updates;
ANALYZE public.pipelines;
