-- Add target closing date to projects (nullable, can be updated over time)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS target_closing_at DATE;

COMMENT ON COLUMN public.projects.target_closing_at IS 'Target date for closing the project; can be updated over time';
