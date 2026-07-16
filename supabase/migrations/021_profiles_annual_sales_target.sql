-- Annual sales target per profile (for Target Achievement on dashboard)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS annual_sales_target NUMERIC;

COMMENT ON COLUMN public.profiles.annual_sales_target IS
  'Annual sales closing target in IDR; used for dashboard Target Achievement';
