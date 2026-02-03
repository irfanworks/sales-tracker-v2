-- BD Weekly Updates: tambah customer_id, sales bisa add lebih dari 1 customer per week

ALTER TABLE public.bd_weekly_updates
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Hapus unique lama (user, year, week), ganti dengan (user, year, week, customer)
ALTER TABLE public.bd_weekly_updates DROP CONSTRAINT IF EXISTS bd_weekly_updates_user_id_year_week_number_key;

-- Unique: satu sales satu update per (year, week, customer)
-- customer_id null = satu row "umum" per week; customer_id set = satu per customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_bd_weekly_updates_user_year_week_customer
  ON public.bd_weekly_updates(user_id, year, week_number, COALESCE(customer_id::text, '00000000-0000-0000-0000-000000000000'));
