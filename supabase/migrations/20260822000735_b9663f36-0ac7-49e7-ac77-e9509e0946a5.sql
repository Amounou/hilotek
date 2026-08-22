DROP VIEW IF EXISTS public.products_public;

-- Internal cost data moved to a staff-only table
CREATE TABLE IF NOT EXISTS public.product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  cost_price numeric,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;
GRANT ALL ON public.product_costs TO service_role;

ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read product costs" ON public.product_costs FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse','commercial']::app_role[]));

CREATE POLICY "Staff manage product costs" ON public.product_costs FOR ALL TO authenticated
USING (has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::app_role[]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::app_role[]));

INSERT INTO public.product_costs (product_id, cost_price, low_stock_threshold)
SELECT id, cost_price, COALESCE(low_stock_threshold, 5) FROM public.products
ON CONFLICT (product_id) DO NOTHING;

ALTER TABLE public.products DROP COLUMN IF EXISTS cost_price;
ALTER TABLE public.products DROP COLUMN IF EXISTS low_stock_threshold;

-- Restore public catalogue access on the now cost-free products table
DROP POLICY IF EXISTS "Staff read products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT
USING (
  is_active = true
  OR has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse','cashier','commercial']::app_role[])
);
GRANT SELECT ON public.products TO anon;