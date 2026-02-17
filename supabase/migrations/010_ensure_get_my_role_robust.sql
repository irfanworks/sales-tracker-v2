-- Ensure get_my_role() function is robust and handles edge cases
-- This function must always return a valid role or NULL, never cause errors

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

-- Ensure all authenticated users have a profile (backfill)
-- This is a safety measure in case trigger didn't fire
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
