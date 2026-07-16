-- Quote number generator (EI-YYXXX-RR) + commercial quote fields + revision history

-- Year-scoped sequential counter (XXX = 001–999)
CREATE TABLE IF NOT EXISTS public.quote_number_sequences (
  year_yy INT PRIMARY KEY,
  last_seq INT NOT NULL DEFAULT 0 CHECK (last_seq >= 0 AND last_seq <= 999)
);

COMMENT ON TABLE public.quote_number_sequences IS
  'Per 2-digit year counter for EI-YYXXX quote bases (starts at 001).';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS quote_base TEXT,
  ADD COLUMN IF NOT EXISTS quote_revision INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_validity_days INT,
  ADD COLUMN IF NOT EXISTS delivery_weeks INT,
  ADD COLUMN IF NOT EXISTS payment_terms JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_quote_revision_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_quote_revision_check
  CHECK (quote_revision >= 0 AND quote_revision <= 9);

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_price_validity_days_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_price_validity_days_check
  CHECK (price_validity_days IS NULL OR price_validity_days IN (60, 90));

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_delivery_weeks_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_delivery_weeks_check
  CHECK (delivery_weeks IS NULL OR delivery_weeks >= 0);

COMMENT ON COLUMN public.projects.quote_base IS
  'Immutable quote base e.g. EI-26001 (without revision suffix)';
COMMENT ON COLUMN public.projects.quote_revision IS
  '0 = -00, 1 = -R1 … 9 = -R9';
COMMENT ON COLUMN public.projects.price_validity_days IS
  'Price validity in days: 60 or 90';
COMMENT ON COLUMN public.projects.delivery_weeks IS
  'Delivery lead time in weeks';
COMMENT ON COLUMN public.projects.payment_terms IS
  'JSON array: [{label, percent, is_custom}] — percents must sum to 100';

-- Backfill: treat existing no_quote as display; leave quote_base null for legacy
UPDATE public.projects
SET quote_revision = 0
WHERE quote_revision IS NULL;

CREATE TABLE IF NOT EXISTS public.quote_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  revision INT NOT NULL CHECK (revision >= 0 AND revision <= 9),
  no_quote TEXT NOT NULL,
  value NUMERIC,
  price_validity_days INT,
  delivery_weeks INT,
  payment_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (project_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_quote_revisions_project_id
  ON public.quote_revisions(project_id, created_at DESC);

ALTER TABLE public.quote_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read quote revisions for accessible projects" ON public.quote_revisions;
CREATE POLICY "Users can read quote revisions for accessible projects"
  ON public.quote_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can insert quote revisions for accessible projects" ON public.quote_revisions;
CREATE POLICY "Users can insert quote revisions for accessible projects"
  ON public.quote_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (p.sales_id = auth.uid() OR public.get_my_role() = 'admin')
    )
  );

-- Format helpers
CREATE OR REPLACE FUNCTION public.format_quote_revision_suffix(p_revision INT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_revision IS NULL OR p_revision <= 0 THEN '00'
    ELSE 'R' || p_revision::TEXT
  END;
$$;

CREATE OR REPLACE FUNCTION public.format_quote_number(p_base TEXT, p_revision INT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_base || '-' || public.format_quote_revision_suffix(p_revision);
$$;

-- Allocate next EI-YYXXX-00 (starts EI-26001-00 for 2026)
CREATE OR REPLACE FUNCTION public.allocate_next_quote_number()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_yy INT;
  v_seq INT;
  v_base TEXT;
  v_no_quote TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_year_yy := EXTRACT(YEAR FROM NOW())::INT % 100;

  INSERT INTO public.quote_number_sequences (year_yy, last_seq)
  VALUES (v_year_yy, 0)
  ON CONFLICT (year_yy) DO NOTHING;

  SELECT last_seq INTO v_seq
  FROM public.quote_number_sequences
  WHERE year_yy = v_year_yy
  FOR UPDATE;

  IF v_seq >= 999 THEN
    RAISE EXCEPTION 'Quote number sequence exhausted for year % (max 999)', v_year_yy;
  END IF;

  v_seq := v_seq + 1;

  UPDATE public.quote_number_sequences
  SET last_seq = v_seq
  WHERE year_yy = v_year_yy;

  v_base := 'EI-' || lpad(v_year_yy::TEXT, 2, '0') || lpad(v_seq::TEXT, 3, '0');
  v_no_quote := public.format_quote_number(v_base, 0);

  RETURN jsonb_build_object(
    'quote_base', v_base,
    'no_quote', v_no_quote,
    'quote_year', v_year_yy,
    'quote_seq', v_seq,
    'quote_revision', 0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.allocate_next_quote_number() TO authenticated;

-- Revise quote: snapshot current commercial state, bump R1–R9, apply new values
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
DECLARE
  v_project public.projects%ROWTYPE;
  v_next_rev INT;
  v_new_no_quote TEXT;
  v_base TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_project
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_project.sales_id IS DISTINCT FROM auth.uid()
     AND public.get_my_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Not allowed to revise this quote';
  END IF;

  IF v_project.quote_revision >= 9 THEN
    RAISE EXCEPTION 'Maximum quote revision R9 reached';
  END IF;

  IF p_price_validity_days IS NOT NULL AND p_price_validity_days NOT IN (60, 90) THEN
    RAISE EXCEPTION 'Price validity must be 60 or 90 days';
  END IF;

  -- Snapshot current (pre-revision) commercial state
  INSERT INTO public.quote_revisions (
    project_id,
    revision,
    no_quote,
    value,
    price_validity_days,
    delivery_weeks,
    payment_terms,
    project_name,
    notes,
    created_by
  ) VALUES (
    v_project.id,
    v_project.quote_revision,
    v_project.no_quote,
    v_project.value,
    v_project.price_validity_days,
    v_project.delivery_weeks,
    COALESCE(v_project.payment_terms, '[]'::jsonb),
    v_project.project_name,
    NULLIF(TRIM(COALESCE(p_notes, '')), ''),
    auth.uid()
  )
  ON CONFLICT (project_id, revision) DO NOTHING;

  v_next_rev := v_project.quote_revision + 1;
  v_base := COALESCE(
    NULLIF(TRIM(v_project.quote_base), ''),
    regexp_replace(v_project.no_quote, '-(00|R[1-9])$', '')
  );
  v_new_no_quote := public.format_quote_number(v_base, v_next_rev);

  UPDATE public.projects
  SET
    quote_base = v_base,
    quote_revision = v_next_rev,
    no_quote = v_new_no_quote,
    value = p_value,
    price_validity_days = p_price_validity_days,
    delivery_weeks = p_delivery_weeks,
    payment_terms = COALESCE(p_payment_terms, '[]'::jsonb),
    slug = NULL
  WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'no_quote', v_new_no_quote,
    'quote_base', v_base,
    'quote_revision', v_next_rev
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.revise_project_quote(UUID, NUMERIC, INT, INT, JSONB, TEXT) TO authenticated;

COMMENT ON FUNCTION public.allocate_next_quote_number() IS
  'Allocates next EI-YYXXX-00 quote number (year-scoped sequence).';
COMMENT ON FUNCTION public.revise_project_quote(UUID, NUMERIC, INT, INT, JSONB, TEXT) IS
  'Snapshots current quote commercial data then bumps revision suffix 00→R1→…→R9.';
