-- Ensure all customers have readable slugs for permalink URLs.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.customers
SET slug = lower(regexp_replace(regexp_replace(trim(name), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
  || '-'
  || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL OR slug = '';

UPDATE public.customers
SET slug = 'customer-' || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.customers
  ALTER COLUMN slug SET NOT NULL;
