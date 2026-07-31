-- Rename Project → Pipeline (tables, columns, RPCs) + optimize indexes/stats
-- Additive: data preserved via RENAME (no drop).

-- ─── 1) Core tables ─────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.projects RENAME TO pipelines;
ALTER TABLE IF EXISTS public.project_updates RENAME TO pipeline_updates;

-- ─── 2) Columns ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pipelines' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE public.pipelines RENAME COLUMN project_name TO pipeline_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pipelines' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE public.pipelines RENAME COLUMN project_type TO pipeline_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pipeline_updates' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.pipeline_updates RENAME COLUMN project_id TO pipeline_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_revisions' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.quote_revisions RENAME COLUMN project_id TO pipeline_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_revisions' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE public.quote_revisions RENAME COLUMN project_name TO pipeline_name;
  END IF;
END $$;

-- ─── 3) Constraints / indexes (best-effort renames) ──────────────────────────
ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS projects_project_type_check;
ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS pipelines_pipeline_type_check;
ALTER TABLE public.pipelines
  ADD CONSTRAINT pipelines_pipeline_type_check
  CHECK (pipeline_type IN ('Project', 'Trading', 'Service'));

ALTER INDEX IF EXISTS idx_projects_sales_id RENAME TO idx_pipelines_sales_id;
ALTER INDEX IF EXISTS idx_projects_customer_id RENAME TO idx_pipelines_customer_id;
ALTER INDEX IF EXISTS idx_projects_progress_type RENAME TO idx_pipelines_progress_type;
ALTER INDEX IF EXISTS idx_projects_prospect RENAME TO idx_pipelines_prospect;
ALTER INDEX IF EXISTS idx_projects_project_type RENAME TO idx_pipelines_pipeline_type;
ALTER INDEX IF EXISTS idx_projects_status RENAME TO idx_pipelines_status;
ALTER INDEX IF EXISTS idx_projects_outcome_status RENAME TO idx_pipelines_outcome_status;
ALTER INDEX IF EXISTS idx_projects_target_closing RENAME TO idx_pipelines_target_closing;
ALTER INDEX IF EXISTS idx_projects_pic_name RENAME TO idx_pipelines_pic_name;
ALTER INDEX IF EXISTS idx_project_updates_project_id RENAME TO idx_pipeline_updates_pipeline_id;
ALTER INDEX IF EXISTS idx_quote_revisions_project_id RENAME TO idx_quote_revisions_pipeline_id;

-- Ensure hot-path indexes exist after rename
CREATE INDEX IF NOT EXISTS idx_pipelines_sales_id ON public.pipelines(sales_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_customer_id ON public.pipelines(customer_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_progress_type ON public.pipelines(progress_type);
CREATE INDEX IF NOT EXISTS idx_pipelines_prospect ON public.pipelines(prospect);
CREATE INDEX IF NOT EXISTS idx_pipelines_pipeline_type ON public.pipelines(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON public.pipelines(status);
CREATE INDEX IF NOT EXISTS idx_pipelines_outcome_status ON public.pipelines(outcome_status);
CREATE INDEX IF NOT EXISTS idx_pipelines_created_at ON public.pipelines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipelines_target_closing_at ON public.pipelines(target_closing_at);
CREATE INDEX IF NOT EXISTS idx_pipelines_no_quote ON public.pipelines(no_quote);
CREATE INDEX IF NOT EXISTS idx_pipelines_slug ON public.pipelines(slug);
CREATE INDEX IF NOT EXISTS idx_pipeline_updates_pipeline_id ON public.pipeline_updates(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_updates_created_at ON public.pipeline_updates(pipeline_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_revisions_pipeline_id
  ON public.quote_revisions(pipeline_id, created_at DESC);

-- ─── 4) RLS policy names (drop + recreate on new table names) ───────────────
-- Pipelines
DROP POLICY IF EXISTS "Sales can read own projects" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can read all projects" ON public.pipelines;
DROP POLICY IF EXISTS "Sales can read own pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can read all pipelines" ON public.pipelines;
CREATE POLICY "Sales can read own pipelines"
  ON public.pipelines FOR SELECT TO authenticated
  USING (sales_id = auth.uid());
CREATE POLICY "Admin can read all pipelines"
  ON public.pipelines FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Sales can insert own projects" ON public.pipelines;
DROP POLICY IF EXISTS "Sales can insert own pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can insert projects" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can insert pipelines" ON public.pipelines;
-- Keep permissive insert for sales/admin (match prior behavior)
DO $$
BEGIN
  -- Re-create common write policies if missing (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipelines' AND policyname = 'Sales can insert pipelines'
  ) THEN
    CREATE POLICY "Sales can insert pipelines"
      ON public.pipelines FOR INSERT TO authenticated
      WITH CHECK (sales_id = auth.uid() OR public.get_my_role() = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipelines' AND policyname = 'Sales can update own pipelines'
  ) THEN
    CREATE POLICY "Sales can update own pipelines"
      ON public.pipelines FOR UPDATE TO authenticated
      USING (sales_id = auth.uid() OR public.get_my_role() = 'admin')
      WITH CHECK (sales_id = auth.uid() OR public.get_my_role() = 'admin');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipelines' AND policyname = 'Sales can delete own pipelines'
  ) THEN
    CREATE POLICY "Sales can delete own pipelines"
      ON public.pipelines FOR DELETE TO authenticated
      USING (sales_id = auth.uid() OR public.get_my_role() = 'admin');
  END IF;
END $$;

-- Also drop old-named policies that may still exist after table rename
DROP POLICY IF EXISTS "Sales can insert own projects" ON public.pipelines;
DROP POLICY IF EXISTS "Sales can update own projects" ON public.pipelines;
DROP POLICY IF EXISTS "Sales can delete own projects" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can update any project" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can delete any project" ON public.pipelines;
DROP POLICY IF EXISTS "Admin can insert projects" ON public.pipelines;

-- Ensure write policies exist (recreate cleanly)
DROP POLICY IF EXISTS "Sales can insert pipelines" ON public.pipelines;
CREATE POLICY "Sales can insert pipelines"
  ON public.pipelines FOR INSERT TO authenticated
  WITH CHECK (sales_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Sales can update own pipelines" ON public.pipelines;
CREATE POLICY "Sales can update own pipelines"
  ON public.pipelines FOR UPDATE TO authenticated
  USING (sales_id = auth.uid() OR public.get_my_role() = 'admin')
  WITH CHECK (sales_id = auth.uid() OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Sales can delete own pipelines" ON public.pipelines;
CREATE POLICY "Sales can delete own pipelines"
  ON public.pipelines FOR DELETE TO authenticated
  USING (sales_id = auth.uid() OR public.get_my_role() = 'admin');

-- Pipeline updates
DROP POLICY IF EXISTS "Read project_updates if can read project" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Insert project_updates if can update project" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Admin can delete any project update" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Admin can update any project update" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Read pipeline_updates if can read pipeline" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Insert pipeline_updates if can update pipeline" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Admin can delete any pipeline update" ON public.pipeline_updates;
DROP POLICY IF EXISTS "Admin can update any pipeline update" ON public.pipeline_updates;

CREATE POLICY "Read pipeline_updates if can read pipeline"
  ON public.pipeline_updates FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_updates.pipeline_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

CREATE POLICY "Insert pipeline_updates if can update pipeline"
  ON public.pipeline_updates FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_updates.pipeline_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

CREATE POLICY "Admin can delete any pipeline update"
  ON public.pipeline_updates FOR DELETE TO authenticated
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admin can update any pipeline update"
  ON public.pipeline_updates FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'admin');

-- Quote revisions policies (reference pipelines)
DROP POLICY IF EXISTS "Users can read quote revisions for accessible projects" ON public.quote_revisions;
DROP POLICY IF EXISTS "Users can insert quote revisions for accessible projects" ON public.quote_revisions;
DROP POLICY IF EXISTS "Users can read quote revisions for accessible pipelines" ON public.quote_revisions;
DROP POLICY IF EXISTS "Users can insert quote revisions for accessible pipelines" ON public.quote_revisions;

CREATE POLICY "Users can read quote revisions for accessible pipelines"
  ON public.quote_revisions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

CREATE POLICY "Users can insert quote revisions for accessible pipelines"
  ON public.quote_revisions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pipelines p
      WHERE p.id = pipeline_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

-- ─── 5) RPCs ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_pipeline_by_slug(p_slug text)
RETURNS SETOF public.pipelines
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT p.*
  FROM public.pipelines p
  WHERE p.slug = p_slug
     OR p.id::text = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_pipeline_by_slug(text) TO authenticated;

-- Compatibility wrapper
CREATE OR REPLACE FUNCTION public.get_project_by_slug(p_slug text)
RETURNS SETOF public.pipelines
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.get_pipeline_by_slug(p_slug);
$$;

GRANT EXECUTE ON FUNCTION public.get_project_by_slug(text) TO authenticated;

-- Refresh slug helper uses pipeline_name
UPDATE public.pipelines
SET slug = lower(
  regexp_replace(
    regexp_replace(
      trim(coalesce(no_quote, '') || ' ' || coalesce(pipeline_name, '')),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || substr(replace(id::text, '-', ''), 1, 8)
WHERE slug IS NULL OR slug = '';

CREATE OR REPLACE FUNCTION public.revise_pipeline_quote(
  p_pipeline_id UUID,
  p_value NUMERIC,
  p_price_validity_days INT,
  p_delivery_weeks INT,
  p_payment_terms JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pipeline public.pipelines%ROWTYPE;
  v_next_rev INT;
  v_new_no_quote TEXT;
  v_base TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_pipeline
  FROM public.pipelines
  WHERE id = p_pipeline_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pipeline not found';
  END IF;

  IF v_pipeline.sales_id IS DISTINCT FROM auth.uid()
     AND public.get_my_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Not allowed to revise this quote';
  END IF;

  IF v_pipeline.quote_revision >= 9 THEN
    RAISE EXCEPTION 'Maximum quote revision R9 reached';
  END IF;

  IF p_price_validity_days IS NOT NULL AND p_price_validity_days NOT IN (60, 90) THEN
    RAISE EXCEPTION 'Price validity must be 60 or 90 days';
  END IF;

  INSERT INTO public.quote_revisions (
    pipeline_id,
    revision,
    no_quote,
    value,
    price_validity_days,
    delivery_weeks,
    payment_terms,
    pipeline_name,
    notes,
    created_by
  ) VALUES (
    v_pipeline.id,
    v_pipeline.quote_revision,
    v_pipeline.no_quote,
    v_pipeline.value,
    v_pipeline.price_validity_days,
    v_pipeline.delivery_weeks,
    COALESCE(v_pipeline.payment_terms, '[]'::jsonb),
    v_pipeline.pipeline_name,
    NULLIF(TRIM(COALESCE(p_notes, '')), ''),
    auth.uid()
  )
  ON CONFLICT (pipeline_id, revision) DO NOTHING;

  v_next_rev := v_pipeline.quote_revision + 1;
  v_base := COALESCE(
    NULLIF(TRIM(v_pipeline.quote_base), ''),
    regexp_replace(v_pipeline.no_quote, '-(00|R[1-9])$', '')
  );
  v_new_no_quote := public.format_quote_number(v_base, v_next_rev);

  UPDATE public.pipelines
  SET
    quote_base = v_base,
    quote_revision = v_next_rev,
    no_quote = v_new_no_quote,
    value = p_value,
    price_validity_days = p_price_validity_days,
    delivery_weeks = p_delivery_weeks,
    payment_terms = COALESCE(p_payment_terms, '[]'::jsonb),
    slug = NULL
  WHERE id = p_pipeline_id;

  RETURN jsonb_build_object(
    'no_quote', v_new_no_quote,
    'quote_base', v_base,
    'quote_revision', v_next_rev
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.revise_pipeline_quote(UUID, NUMERIC, INT, INT, JSONB, TEXT) TO authenticated;

-- Compatibility wrapper for old RPC name
CREATE OR REPLACE FUNCTION public.revise_project_quote(
  p_project_id UUID,
  p_value NUMERIC,
  p_price_validity_days INT,
  p_delivery_weeks INT,
  p_payment_terms JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.revise_pipeline_quote(
    p_project_id,
    p_value,
    p_price_validity_days,
    p_delivery_weeks,
    p_payment_terms,
    p_notes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.revise_project_quote(UUID, NUMERIC, INT, INT, JSONB, TEXT) TO authenticated;

-- Refresh aggregation helpers to read pipelines
-- Must DROP first: CREATE OR REPLACE cannot change OUT/RETURNS TABLE shape.
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

-- Unique constraint on quote_revisions may still be named for project_id
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
  NULL; -- ignore if already renamed / absent
END $$;

-- ─── 6) Optimize ────────────────────────────────────────────────────────────
ANALYZE public.pipelines;
ANALYZE public.pipeline_updates;
ANALYZE public.quote_revisions;
ANALYZE public.customers;
ANALYZE public.profiles;

COMMENT ON TABLE public.pipelines IS 'Sales pipeline / quote records (renamed from projects)';
COMMENT ON TABLE public.pipeline_updates IS 'Pipeline progress update history (renamed from project_updates)';
COMMENT ON COLUMN public.pipelines.pipeline_type IS
  'Work category: Project | Trading | Service (entity is Pipeline; type Project = project-work)';
