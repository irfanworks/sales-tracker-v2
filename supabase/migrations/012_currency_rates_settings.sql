CREATE TABLE IF NOT EXISTS public.currency_rates (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  usd_per_idr NUMERIC(20, 10) NOT NULL DEFAULT 0.000065,
  sgd_per_idr NUMERIC(20, 10) NOT NULL DEFAULT 0.000086,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read currency_rates" ON public.currency_rates;
CREATE POLICY "Authenticated can read currency_rates"
  ON public.currency_rates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can upsert currency_rates" ON public.currency_rates;
CREATE POLICY "Admin can upsert currency_rates"
  ON public.currency_rates FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

INSERT INTO public.currency_rates (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
