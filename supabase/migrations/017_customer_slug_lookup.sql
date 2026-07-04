-- Resolve customer by slug, UUID, or id-prefix embedded in slug (e.g. acme-corp-c0405d36).

CREATE OR REPLACE FUNCTION public.get_customer_by_slug(p_slug text)
RETURNS SETOF public.customers
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
BEGIN
  SELECT (regexp_match(p_slug, '-([a-f0-9]{8})$', 'i'))[1] INTO v_prefix;

  RETURN QUERY
  SELECT c.*
  FROM public.customers c
  WHERE c.slug = p_slug
     OR c.id::text = p_slug
     OR (
       v_prefix IS NOT NULL
       AND replace(c.id::text, '-', '') ILIKE v_prefix || '%'
     )
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_by_slug(text) TO authenticated;

-- Re-sync slugs to match app slugify(name + id prefix)
UPDATE public.customers c
SET slug = lower(regexp_replace(regexp_replace(trim(c.name), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
  || '-'
  || replace(substring(c.id::text from 1 for 8), '-', '')
WHERE slug IS NULL
   OR slug = ''
   OR slug <> (
     lower(regexp_replace(regexp_replace(trim(c.name), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
     || '-'
     || replace(substring(c.id::text from 1 for 8), '-', '')
   );
