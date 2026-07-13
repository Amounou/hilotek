
CREATE POLICY "Staff can read memoire docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'memoire-documents' AND (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'commercial') OR public.has_role(auth.uid(), 'writer')
  OR public.has_role(auth.uid(), 'support')
));
CREATE POLICY "Staff can upload memoire docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'memoire-documents' AND (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'commercial') OR public.has_role(auth.uid(), 'writer')
  OR public.has_role(auth.uid(), 'support')
));
CREATE POLICY "Staff can update memoire docs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'memoire-documents' AND (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'commercial') OR public.has_role(auth.uid(), 'writer')
));
CREATE POLICY "Staff can delete memoire docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'memoire-documents' AND (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
));
