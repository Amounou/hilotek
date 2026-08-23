
CREATE OR REPLACE FUNCTION public.tg_order_item_price_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE p RECORD; is_staff boolean;
BEGIN
  is_staff := public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','warehouse']::app_role[]);
  IF is_staff THEN RETURN NEW; END IF;

  IF NEW.product_id IS NULL THEN
    RAISE EXCEPTION 'Article invalide';
  END IF;

  SELECT price, promo_price, name_fr, sku, is_active INTO p FROM public.products WHERE id = NEW.product_id;
  IF NOT FOUND OR NOT p.is_active THEN RAISE EXCEPTION 'Produit indisponible'; END IF;

  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;

  NEW.unit_price := COALESCE(p.promo_price, p.price);
  NEW.total := ROUND(NEW.unit_price * NEW.quantity, 2);
  NEW.product_name := p.name_fr;
  NEW.product_sku := p.sku;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_order_items_price_guard ON public.order_items;
CREATE TRIGGER trg_order_items_price_guard
BEFORE INSERT OR UPDATE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.tg_order_item_price_guard();

CREATE OR REPLACE FUNCTION public.tg_order_totals_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE is_staff boolean;
BEGIN
  is_staff := public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','warehouse']::app_role[]);
  IF is_staff THEN RETURN NEW; END IF;
  -- Client-supplied money values are not trusted; totals are recomputed from items.
  NEW.subtotal := 0;
  NEW.tax := 0;
  NEW.shipping := 0;
  NEW.discount := 0;
  NEW.total := 0;
  NEW.payment_status := 'pending';
  NEW.status := 'pending';
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orders_totals_guard ON public.orders;
CREATE TRIGGER trg_orders_totals_guard
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_order_totals_guard();

CREATE OR REPLACE FUNCTION public.tg_order_recalc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE oid uuid; sub numeric; rate numeric; ship numeric; is_staff boolean;
BEGIN
  oid := COALESCE(NEW.order_id, OLD.order_id);
  is_staff := public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','warehouse']::app_role[]);
  IF is_staff THEN RETURN NULL; END IF;

  SELECT COALESCE(SUM(total),0) INTO sub FROM public.order_items WHERE order_id = oid;
  SELECT COALESCE(tax_rate,0) INTO rate FROM public.settings WHERE id = 1;
  ship := CASE WHEN sub > 0 THEN 3000 ELSE 0 END;

  UPDATE public.orders SET
    subtotal = sub,
    tax = ROUND(sub * rate / 100, 2),
    shipping = ship,
    discount = 0,
    total = ROUND(sub + sub * rate / 100 + ship, 2),
    updated_at = now()
  WHERE id = oid;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_order_items_recalc ON public.order_items;
CREATE TRIGGER trg_order_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.tg_order_recalc();
