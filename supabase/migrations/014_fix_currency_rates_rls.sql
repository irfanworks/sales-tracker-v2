-- Fix currency_rates RLS so admins can save USD/SGD conversion settings.

GRANT SELECT, INSERT, UPDATE ON public.currency_rates TO authenticated;

DROP POLICY IF EXISTS "Admin can upsert currency_rates" ON public.currency_rates;
DROP POLICY IF EXISTS "Admin can insert currency_rates" ON public.currency_rates;
DROP POLICY IF EXISTS "Admin can update currency_rates" ON public.currency_rates;

CREATE POLICY "Admin can insert currency_rates"
  ON public.currency_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admin can update currency_rates"
  ON public.currency_rates
  FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Reliable admin-only write path (bypasses table RLS, still checks role in function).
CREATE OR REPLACE FUNCTION public.update_currency_rates(
  p_usd_per_idr NUMERIC,
  p_sgd_per_idr NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can update currency rates';
  END IF;

  IF p_usd_per_idr IS NULL OR p_usd_per_idr <= 0 OR p_sgd_per_idr IS NULL OR p_sgd_per_idr <= 0 THEN
    RAISE EXCEPTION 'Currency rates must be positive numbers';
  END IF;

  INSERT INTO public.currency_rates (id, usd_per_idr, sgd_per_idr, updated_by, updated_at)
  VALUES (1, p_usd_per_idr, p_sgd_per_idr, auth.uid(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET
    usd_per_idr = EXCLUDED.usd_per_idr,
    sgd_per_idr = EXCLUDED.sgd_per_idr,
    updated_by = auth.uid(),
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_currency_rates(NUMERIC, NUMERIC) TO authenticated;
