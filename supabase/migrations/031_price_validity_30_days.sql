-- Allow Price validity of 30 days (in addition to 60 and 90).
-- Assumes rename migrations (024/026) already applied: table is public.pipelines.
-- Do NOT re-run 024/026 just to apply this change.

DO $$
BEGIN
  IF to_regclass('public.pipelines') IS NULL THEN
    RAISE EXCEPTION
      'public.pipelines not found. Your DB may still use public.projects, or you are on the wrong Supabase project. Check: SELECT to_regclass(''public.pipelines''), to_regclass(''public.projects'');';
  END IF;
END;
$$;

ALTER TABLE public.pipelines
  DROP CONSTRAINT IF EXISTS projects_price_validity_days_check;

ALTER TABLE public.pipelines
  DROP CONSTRAINT IF EXISTS pipelines_price_validity_days_check;

ALTER TABLE public.pipelines
  ADD CONSTRAINT pipelines_price_validity_days_check
  CHECK (price_validity_days IS NULL OR price_validity_days IN (30, 60, 90));

COMMENT ON COLUMN public.pipelines.price_validity_days IS
  'Price validity in days: 30, 60, or 90';

-- Update validation inside revise RPC (CREATE OR REPLACE keeps the rest of the function).
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

  IF p_price_validity_days IS NOT NULL AND p_price_validity_days NOT IN (30, 60, 90) THEN
    RAISE EXCEPTION 'Price validity must be 30, 60, or 90 days';
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
