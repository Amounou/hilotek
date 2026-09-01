ALTER TABLE public.settings ALTER COLUMN company_name SET DEFAULT 'HiloTek Services & Tech';
INSERT INTO public.settings (id, company_name, email, phone, address, hours, currency, tax_rate, socials)
VALUES (1, 'HiloTek Services & Tech', 'contact@hilotek.com', '+225 00 00 00 00', 'Abidjan, Côte d''Ivoire', 'Lun-Sam 08:00-18:00', 'XOF', 18.0, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;