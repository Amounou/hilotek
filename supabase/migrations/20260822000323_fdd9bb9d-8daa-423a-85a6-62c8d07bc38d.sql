-- Backfill profiles and roles for existing accounts
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- First created account becomes super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
ORDER BY u.created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'customer'::app_role FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- Self-healing function callable by any signed-in user
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); is_first boolean;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;

  INSERT INTO public.profiles (id, email, full_name)
  SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email)
  FROM auth.users u WHERE u.id = uid
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;
END; $$;

REVOKE ALL ON FUNCTION public.ensure_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated;