-- Allow admins to set annual_sales_target for any sales/admin profile (Settings team targets).

CREATE OR REPLACE FUNCTION public.admin_update_annual_sales_targets(p_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
BEGIN
  IF COALESCE(public.get_my_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can update team annual sales targets';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(p_updates, '[]'::jsonb))
  LOOP
    UPDATE public.profiles
    SET annual_sales_target = CASE
      WHEN item->>'annual_sales_target' IS NULL
        OR TRIM(item->>'annual_sales_target') = ''
        THEN NULL
      ELSE (item->>'annual_sales_target')::numeric
    END
    WHERE id = (item->>'id')::uuid
      AND role IN ('admin', 'sales');
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_annual_sales_targets(jsonb) TO authenticated;

COMMENT ON FUNCTION public.admin_update_annual_sales_targets(jsonb) IS
  'Admin-only: batch-update annual_sales_target on profiles. Payload: [{id, annual_sales_target}]';
