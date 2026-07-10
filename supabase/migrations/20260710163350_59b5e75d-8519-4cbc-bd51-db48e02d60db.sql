
DROP POLICY IF EXISTS "Public track repair" ON public.repairs;
DROP POLICY IF EXISTS "Public track memoire" ON public.memoires;
DROP POLICY IF EXISTS "Public read repair history" ON public.repair_status_history;
DROP POLICY IF EXISTS "Public read memoire history" ON public.memoire_status_history;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;

CREATE POLICY "Own repairs read" ON public.repairs FOR SELECT TO authenticated
  USING (client_email IS NOT NULL AND lower(client_email) = lower(coalesce(auth.jwt()->>'email','')));

CREATE POLICY "Own memoires read" ON public.memoires FOR SELECT TO authenticated
  USING (client_email IS NOT NULL AND lower(client_email) = lower(coalesce(auth.jwt()->>'email','')));

CREATE POLICY "Auth read settings" ON public.settings FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.track_repair(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.repairs; h jsonb;
BEGIN
  IF _token IS NULL OR length(trim(_token)) < 6 THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.repairs
    WHERE tracking_token = _token OR repair_number = _token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id, 'status', x.status, 'note', x.note, 'created_at', x.created_at
  ) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO h FROM public.repair_status_history x WHERE x.repair_id = r.id;
  RETURN jsonb_build_object(
    'id', r.id, 'repair_number', r.repair_number, 'status', r.status,
    'device_type', r.device_type, 'brand', r.brand, 'model', r.model,
    'client_name', r.client_name, 'issue_description', r.issue_description,
    'diagnosis', r.diagnosis, 'created_at', r.created_at,
    'history', h
  );
END; $$;
REVOKE ALL ON FUNCTION public.track_repair(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_repair(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_memoire(_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.memoires; h jsonb;
BEGIN
  IF _token IS NULL OR length(trim(_token)) < 6 THEN RETURN NULL; END IF;
  SELECT * INTO r FROM public.memoires
    WHERE tracking_token = _token OR memoire_number = _token LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id, 'status', x.status, 'note', x.note, 'created_at', x.created_at
  ) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO h FROM public.memoire_status_history x WHERE x.memoire_id = r.id;
  RETURN jsonb_build_object(
    'id', r.id, 'memoire_number', r.memoire_number, 'status', r.status,
    'theme', r.theme, 'university', r.university, 'level', r.level, 'filiere', r.filiere,
    'progress', r.progress, 'total_amount', r.total_amount, 'balance', r.balance,
    'created_at', r.created_at, 'history', h
  );
END; $$;
REVOKE ALL ON FUNCTION public.track_memoire(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_memoire(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_settings()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'company_name', company_name,
    'address', address,
    'phone', phone,
    'email', email,
    'hours', hours,
    'socials', socials,
    'currency', currency,
    'logo_url', logo_url
  ) FROM public.settings WHERE id = 1;
$$;
REVOKE ALL ON FUNCTION public.get_public_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone contact" ON public.contact_messages;
CREATE POLICY "Anyone contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(coalesce(name,'')) BETWEEN 1 AND 200
    AND char_length(coalesce(email,'')) BETWEEN 3 AND 320
    AND email LIKE '%@%'
    AND char_length(coalesce(message,'')) BETWEEN 1 AND 5000
  );

DROP POLICY IF EXISTS "Anyone subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(coalesce(email,'')) BETWEEN 3 AND 320 AND email LIKE '%@%');

DROP POLICY IF EXISTS "Anyone submit quote" ON public.quote_requests;
CREATE POLICY "Anyone submit quote" ON public.quote_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(coalesce(name,'')) BETWEEN 1 AND 200
    AND char_length(coalesce(email,'')) BETWEEN 3 AND 320
    AND email LIKE '%@%'
    AND char_length(coalesce(service_type,'')) BETWEEN 1 AND 200
    AND char_length(coalesce(description,'')) BETWEEN 1 AND 5000
  );

DROP POLICY IF EXISTS "Anyone book service" ON public.service_bookings;
CREATE POLICY "Anyone book service" ON public.service_bookings FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(coalesce(client_name,'')) BETWEEN 1 AND 200
    AND char_length(coalesce(client_phone,'')) BETWEEN 3 AND 40
  );

ALTER FUNCTION public.tg_booking_number() SET search_path = public;
ALTER FUNCTION public.tg_invoice_number() SET search_path = public;
ALTER FUNCTION public.tg_memoire_balance_upd() SET search_path = public;
ALTER FUNCTION public.tg_memoire_setup() SET search_path = public;
ALTER FUNCTION public.tg_order_number() SET search_path = public;
ALTER FUNCTION public.tg_quote_number() SET search_path = public;
ALTER FUNCTION public.tg_repair_setup() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_apply_movement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_decrement_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_memoire_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_repair_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_booking_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_memoire_balance_upd() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_memoire_setup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_quote_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_repair_setup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
