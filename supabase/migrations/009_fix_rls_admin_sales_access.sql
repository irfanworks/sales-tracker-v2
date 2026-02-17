-- Fix RLS policies to ensure all admin and sales users can:
-- 1. Insert customers (including customer_pics)
-- 2. Delete customers, BD updates, and projects (admin only)
-- 3. Update customers, BD updates, and projects (admin can update all)

-- ============================================
-- CUSTOMERS: Ensure admin and sales can insert/update/delete
-- ============================================

-- Drop existing policies and recreate with explicit checks
DROP POLICY IF EXISTS "Sales can insert customers" ON public.customers;
CREATE POLICY "Sales and admin can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin', 'sales')
  );

DROP POLICY IF EXISTS "Sales can update customers" ON public.customers;
CREATE POLICY "Sales and admin can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin', 'sales')
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'sales')
  );

DROP POLICY IF EXISTS "Sales can delete customers" ON public.customers;
CREATE POLICY "Sales and admin can delete customers"
  ON public.customers FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin', 'sales')
  );

-- ============================================
-- CUSTOMER_PICS: Ensure admin and sales can insert/update/delete
-- ============================================

DROP POLICY IF EXISTS "Sales can insert customer_pics" ON public.customer_pics;
CREATE POLICY "Sales and admin can insert customer_pics"
  ON public.customer_pics FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('admin', 'sales')
  );

DROP POLICY IF EXISTS "Sales can update customer_pics" ON public.customer_pics;
CREATE POLICY "Sales and admin can update customer_pics"
  ON public.customer_pics FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin', 'sales')
  )
  WITH CHECK (
    public.get_my_role() IN ('admin', 'sales')
  );

DROP POLICY IF EXISTS "Sales can delete customer_pics" ON public.customer_pics;
CREATE POLICY "Sales and admin can delete customer_pics"
  ON public.customer_pics FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN ('admin', 'sales')
  );

-- ============================================
-- BD_WEEKLY_UPDATES: Ensure admin can delete any BD update
-- ============================================

-- Ensure admin delete policy exists (should already exist from migration 008, but recreate to be sure)
DROP POLICY IF EXISTS "Admin can delete any bd update" ON public.bd_weekly_updates;
CREATE POLICY "Admin can delete any bd update"
  ON public.bd_weekly_updates FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Ensure admin can update any BD update (for monitoring/admin purposes)
DROP POLICY IF EXISTS "Admin can update any bd update" ON public.bd_weekly_updates;
CREATE POLICY "Admin can update any bd update"
  ON public.bd_weekly_updates FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ============================================
-- PROJECTS: Ensure admin can delete and update any project
-- ============================================

-- Ensure admin delete policy exists and is correct
DROP POLICY IF EXISTS "Admin can delete any project" ON public.projects;
CREATE POLICY "Admin can delete any project"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Ensure admin update policy exists and is correct
DROP POLICY IF EXISTS "Admin can update any project" ON public.projects;
CREATE POLICY "Admin can update any project"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ============================================
-- PROJECT_UPDATES: Ensure admin can delete any project update
-- ============================================

-- Add delete policy for admin (if not exists)
DROP POLICY IF EXISTS "Admin can delete any project update" ON public.project_updates;
CREATE POLICY "Admin can delete any project update"
  ON public.project_updates FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Add update policy for admin (if not exists)
DROP POLICY IF EXISTS "Admin can update any project update" ON public.project_updates;
CREATE POLICY "Admin can update any project update"
  ON public.project_updates FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');
