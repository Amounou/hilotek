
CREATE SEQUENCE IF NOT EXISTS public.sale_seq START 1;

CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name TEXT,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage sales" ON public.sales FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse']::app_role[]));

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage sale items" ON public.sale_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse']::app_role[]));

-- Numéro auto
CREATE OR REPLACE FUNCTION public.tg_sale_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'VTE-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.sale_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER sales_number BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.tg_sale_number();

CREATE TRIGGER sales_updated BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Ligne : calcul line_total + gestion stock
CREATE OR REPLACE FUNCTION public.tg_sale_item_line()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.line_total := ROUND(NEW.quantity * NEW.unit_price, 2);
  RETURN NEW;
END; $$;

CREATE TRIGGER sale_items_line BEFORE INSERT OR UPDATE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_sale_item_line();

CREATE OR REPLACE FUNCTION public.tg_sale_item_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_stock NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.product_id IS NOT NULL THEN
      SELECT stock INTO current_stock FROM public.products WHERE id = NEW.product_id;
      IF current_stock IS NOT NULL AND current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Stock insuffisant pour le produit %', NEW.product_name;
      END IF;
      UPDATE public.products SET stock = GREATEST(stock - NEW.quantity, 0) WHERE id = NEW.product_id;
      INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reason, reference)
      VALUES (NEW.product_id, 'out', NEW.quantity, 'Vente directe', NEW.sale_id::text);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.product_id IS NOT NULL THEN
      UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
      INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reason, reference)
      VALUES (OLD.product_id, 'in', OLD.quantity, 'Annulation vente', OLD.sale_id::text);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.product_id IS NOT NULL AND (NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.quantity <> OLD.quantity) THEN
      UPDATE public.products SET stock = stock + OLD.quantity WHERE id = OLD.product_id;
    END IF;
    IF NEW.product_id IS NOT NULL AND (NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.quantity <> OLD.quantity) THEN
      SELECT stock INTO current_stock FROM public.products WHERE id = NEW.product_id;
      IF current_stock IS NOT NULL AND current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Stock insuffisant pour le produit %', NEW.product_name;
      END IF;
      UPDATE public.products SET stock = GREATEST(stock - NEW.quantity, 0) WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER sale_items_stock AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_sale_item_stock();

-- Recalcul des totaux de la vente
CREATE OR REPLACE FUNCTION public.tg_sale_recalc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid UUID; sub NUMERIC; rate NUMERIC;
BEGIN
  sid := COALESCE(NEW.sale_id, OLD.sale_id);
  SELECT COALESCE(SUM(line_total),0) INTO sub FROM public.sale_items WHERE sale_id = sid;
  SELECT tax_rate INTO rate FROM public.sales WHERE id = sid;
  UPDATE public.sales SET
    subtotal = sub,
    tax_amount = ROUND(sub * COALESCE(rate,0) / 100, 2),
    total = ROUND(sub + sub * COALESCE(rate,0) / 100, 2),
    updated_at = now()
  WHERE id = sid;
  RETURN NULL;
END; $$;

CREATE TRIGGER sale_items_recalc AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_sale_recalc();

REVOKE EXECUTE ON FUNCTION public.tg_sale_number() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_item_line() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_item_stock() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_recalc() FROM public, anon, authenticated;
