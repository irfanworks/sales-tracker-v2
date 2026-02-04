-- Sales bisa delete BD updates milik sendiri
CREATE POLICY "Sales can delete own bd updates"
  ON public.bd_weekly_updates FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin bisa delete BD updates (untuk monitoring/cleanup)
CREATE POLICY "Admin can delete any bd update"
  ON public.bd_weekly_updates FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');
