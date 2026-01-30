-- Add slug column for human-readable URLs

-- Projects: slug = slugified project_name + '-' + first 8 chars of id (no hyphens)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill projects: simple slug from project_name + id prefix
UPDATE public.projects
SET slug = lower(regexp_replace(regexp_replace(trim(project_name), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
  || '-'
  || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL;

-- If slug is empty use fallback
UPDATE public.projects
SET slug = 'project-' || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL OR slug = '';

-- Allow NULL for new inserts; app updates slug after insert
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug) WHERE slug IS NOT NULL;

-- Customers: same pattern
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.customers
SET slug = lower(regexp_replace(regexp_replace(trim(name), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
  || '-'
  || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL;

UPDATE public.customers
SET slug = 'customer-' || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_slug ON public.customers(slug) WHERE slug IS NOT NULL;
