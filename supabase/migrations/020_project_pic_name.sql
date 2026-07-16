-- Store selected customer PIC name on each project (name only, snapshot).

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS pic_name TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_pic_name ON public.projects(pic_name);
