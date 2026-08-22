-- Public catalogue view without internal cost/stock-threshold data
CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = off) AS
SELECT
  id, sku, barcode, slug,
  name_fr, name_en, description_fr, description_en,
  category_id, brand_id,
  price, promo_price, stock,
  warranty_months, images, features,
  is_active, is_featured, created_at, updated_at
FROM public.products
WHERE is_active = true;

REVOKE ALL ON public.products_public FROM PUBLIC;
GRANT SELECT ON public.products_public TO anon, authenticated;
GRANT ALL ON public.products_public TO service_role;

-- Base table: only staff may read full rows (incl. cost_price)
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Staff read products"
ON public.products FOR SELECT
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse','cashier','commercial']::app_role[]));

REVOKE SELECT ON public.products FROM anon;