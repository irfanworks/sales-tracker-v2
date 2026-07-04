-- Readable project slugs + lookup RPC + backfill initial updates into history.

CREATE OR REPLACE FUNCTION public.get_project_by_slug(p_slug text)
RETURNS SETOF public.projects
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
  SELECT p.*
  FROM public.projects p
  WHERE p.slug = p_slug
     OR p.id::text = p_slug
     OR (
       v_prefix IS NOT NULL
       AND replace(p.id::text, '-', '') ILIKE v_prefix || '%'
     )
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_by_slug(text) TO authenticated;

-- Slugs: no_quote + project_name + id prefix (readable, unique)
UPDATE public.projects p
SET slug = trim(both '-' from
  lower(
    regexp_replace(
      regexp_replace(
        trim(coalesce(p.no_quote, '') || ' ' || coalesce(p.project_name, '')),
        '[^a-zA-Z0-9\s]',
        '',
        'g'
      ),
      '\s+',
      '-',
      'g'
    )
  )
  || '-'
  || replace(substring(p.id::text from 1 for 8), '-', '')
);

UPDATE public.projects
SET slug = 'project-' || replace(substring(id::text from 1 for 8), '-', '')
WHERE slug IS NULL OR slug = '';

-- Preserve legacy weekly_update text as first history entry when missing
INSERT INTO public.project_updates (project_id, content, created_by, created_at)
SELECT p.id, p.weekly_update, p.sales_id, p.created_at
FROM public.projects p
WHERE p.weekly_update IS NOT NULL
  AND trim(p.weekly_update) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.project_updates pu WHERE pu.project_id = p.id
  );
