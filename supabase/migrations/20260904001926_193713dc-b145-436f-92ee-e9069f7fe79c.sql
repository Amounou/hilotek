ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.proforma_items ADD COLUMN IF NOT EXISTS image_url text;