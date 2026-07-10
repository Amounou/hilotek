
CREATE POLICY "Admins read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'admin'::app_role]));

CREATE POLICY "Admins read all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin'::app_role,'admin'::app_role]));
