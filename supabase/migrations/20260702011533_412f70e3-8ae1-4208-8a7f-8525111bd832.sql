
CREATE POLICY "Public read certificates bucket" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Public read drawings bucket" ON storage.objects FOR SELECT USING (bucket_id = 'drawings');

CREATE POLICY "Admins upload certificates" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND public.is_current_user_admin());
CREATE POLICY "Admins update certificates" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'certificates' AND public.is_current_user_admin());
CREATE POLICY "Admins delete certificates" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'certificates' AND public.is_current_user_admin());

CREATE POLICY "Admins upload drawings" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drawings' AND public.is_current_user_admin());
CREATE POLICY "Admins update drawings" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'drawings' AND public.is_current_user_admin());
CREATE POLICY "Admins delete drawings" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'drawings' AND public.is_current_user_admin());
