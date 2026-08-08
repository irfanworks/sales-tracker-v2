-- Fix customers/customer_pics RLS inserts for authenticated sales/admin,
-- and ensure every auth user has a profiles row so get_my_role() works.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(role, 'sales')::TEXT
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Backfill profiles for any auth users missing a row
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', '')::TEXT,
  'sales'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Normalize roles that may have drifted / been null
UPDATE public.profiles
SET role = 'sales'
WHERE role IS NULL OR btrim(role) = '';

-- Customers: any logged-in app user can insert/update/delete
DROP POLICY IF EXISTS "Sales can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Sales and admin can insert customers" ON public.customers;
CREATE POLICY "Authenticated can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Sales can update customers" ON public.customers;
DROP POLICY IF EXISTS "Sales and admin can update customers" ON public.customers;
CREATE POLICY "Authenticated can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Sales can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Sales and admin can delete customers" ON public.customers;
CREATE POLICY "Authenticated can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- customer_pics: same rule
DROP POLICY IF EXISTS "Sales can insert customer_pics" ON public.customer_pics;
DROP POLICY IF EXISTS "Sales and admin can insert customer_pics" ON public.customer_pics;
CREATE POLICY "Authenticated can insert customer_pics"
  ON public.customer_pics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Sales can update customer_pics" ON public.customer_pics;
DROP POLICY IF EXISTS "Sales and admin can update customer_pics" ON public.customer_pics;
CREATE POLICY "Authenticated can update customer_pics"
  ON public.customer_pics FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Sales can delete customer_pics" ON public.customer_pics;
DROP POLICY IF EXISTS "Sales and admin can delete customer_pics" ON public.customer_pics;
CREATE POLICY "Authenticated can delete customer_pics"
  ON public.customer_pics FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
