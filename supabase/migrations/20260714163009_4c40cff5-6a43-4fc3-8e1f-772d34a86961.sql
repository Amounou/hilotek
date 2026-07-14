DROP POLICY "Users insert audit" ON public.audit_logs;
CREATE POLICY "Users insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());