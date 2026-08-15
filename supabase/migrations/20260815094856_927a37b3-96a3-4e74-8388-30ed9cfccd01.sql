
CREATE TABLE public.proformas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_number text UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name text,
  proforma_date timestamptz NOT NULL DEFAULT now(),
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.proforma_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_id uuid NOT NULL REFERENCES public.proformas(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proformas TO authenticated;
GRANT ALL ON public.proformas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proforma_items TO authenticated;
GRANT ALL ON public.proforma_items TO service_role;

ALTER TABLE public.proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage proformas" ON public.proformas FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','support']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','support']::app_role[]));

CREATE POLICY "Staff manage proforma items" ON public.proforma_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','support']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','support']::app_role[]));

CREATE OR REPLACE FUNCTION public.tg_proforma_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NEW.proforma_number IS NULL OR NEW.proforma_number = '' THEN
    SELECT COUNT(*) + 1 INTO n FROM public.proformas
      WHERE to_char(created_at, 'YYYYMM') = to_char(now(), 'YYYYMM');
    NEW.proforma_number := 'PRO-' || to_char(now(), 'YYYYMM') || '-' || lpad(n::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_proforma_number BEFORE INSERT ON public.proformas
FOR EACH ROW EXECUTE FUNCTION public.tg_proforma_number();

CREATE TRIGGER trg_proforma_updated BEFORE UPDATE ON public.proformas
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_proforma_item_line()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.line_total := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_proforma_item_line BEFORE INSERT OR UPDATE ON public.proforma_items
FOR EACH ROW EXECUTE FUNCTION public.tg_proforma_item_line();

CREATE OR REPLACE FUNCTION public.tg_proforma_recalc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pid uuid; st numeric; rate numeric;
BEGIN
  pid := COALESCE(NEW.proforma_id, OLD.proforma_id);
  SELECT COALESCE(SUM(line_total), 0) INTO st FROM public.proforma_items WHERE proforma_id = pid;
  SELECT tax_rate INTO rate FROM public.proformas WHERE id = pid;
  UPDATE public.proformas
    SET subtotal = st,
        tax_amount = round(st * COALESCE(rate, 0) / 100, 2),
        total = st + round(st * COALESCE(rate, 0) / 100, 2)
  WHERE id = pid;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_proforma_recalc AFTER INSERT OR UPDATE OR DELETE ON public.proforma_items
FOR EACH ROW EXECUTE FUNCTION public.tg_proforma_recalc();
