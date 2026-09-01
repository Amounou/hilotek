CREATE OR REPLACE FUNCTION public.get_public_settings()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'company_name', company_name,
    'address', address,
    'phone', phone,
    'email', email,
    'hours', hours,
    'socials', socials,
    'currency', currency,
    'logo_url', logo_url,
    'tax_rate', tax_rate
  ) FROM public.settings WHERE id = 1;
$function$;