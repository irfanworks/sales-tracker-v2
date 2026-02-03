-- Business Development (BD) Weekly Updates
-- Setiap sales wajib update weekly BD activity (narasi poin-poin text)
-- Admin bisa monitor semua sales

CREATE TABLE public.bd_weekly_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX idx_bd_weekly_updates_user_year ON public.bd_weekly_updates(user_id, year);
CREATE INDEX idx_bd_weekly_updates_year_week ON public.bd_weekly_updates(year, week_number);

ALTER TABLE public.bd_weekly_updates ENABLE ROW LEVEL SECURITY;

-- Sales: baca dan tulis hanya data sendiri
CREATE POLICY "Sales can read own bd updates"
  ON public.bd_weekly_updates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sales can insert own bd updates"
  ON public.bd_weekly_updates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sales can update own bd updates"
  ON public.bd_weekly_updates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin: baca semua BD updates
CREATE POLICY "Admin can read all bd updates"
  ON public.bd_weekly_updates FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.set_bd_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bd_weekly_updates_updated_at
  BEFORE UPDATE ON public.bd_weekly_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_bd_updated_at();
