-- Sales: hanya bisa lihat dan edit project yang dia buat (sales_id = auth.uid()).
-- Admin: keleluasaan akses (bisa lihat/edit semua project).

-- Hapus policy yang mengizinkan semua authenticated baca semua project (jika ada)
DROP POLICY IF EXISTS "Authenticated can read projects" ON public.projects;

-- Sales: baca hanya project milik sendiri
DROP POLICY IF EXISTS "Sales can read own projects" ON public.projects;
CREATE POLICY "Sales can read own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (sales_id = auth.uid());

-- Admin: baca semua project
DROP POLICY IF EXISTS "Admin can read all projects" ON public.projects;
CREATE POLICY "Admin can read all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');
