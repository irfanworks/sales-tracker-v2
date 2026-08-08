-- Ensure customer inserts always get a slug (column is NOT NULL since 016).

CREATE OR REPLACE FUNCTION public.set_customer_slug_if_missing()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  short_id text;
BEGIN
  IF NEW.slug IS NOT NULL AND btrim(NEW.slug) <> '' THEN
    RETURN NEW;
  END IF;

  short_id := replace(substring(NEW.id::text from 1 for 8), '-', '');
  base := lower(
    regexp_replace(
      regexp_replace(trim(COALESCE(NEW.name, '')), '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+',
      '-',
      'g'
    )
  );
  base := trim(both '-' from base);

  IF base = '' THEN
    NEW.slug := 'customer-' || short_id;
  ELSE
    NEW.slug := base || '-' || short_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_set_slug ON public.customers;
CREATE TRIGGER trg_customers_set_slug
  BEFORE INSERT OR UPDATE OF name, slug
  ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_customer_slug_if_missing();
