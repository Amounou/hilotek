
CREATE OR REPLACE FUNCTION public.place_order(_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order public.orders;
  it jsonb;
  p RECORD;
  qty integer;
  unit numeric;
  sub numeric := 0;
  rate numeric := 0;
  ship numeric := 0;
  tax_amt numeric := 0;
  items_arr jsonb := COALESCE(_payload->'items', '[]'::jsonb);
  inv_items jsonb := '[]'::jsonb;
BEGIN
  IF jsonb_array_length(items_arr) = 0 THEN
    RAISE EXCEPTION 'Panier vide';
  END IF;
  IF COALESCE(trim(_payload->>'customer_name'),'') = '' OR COALESCE(trim(_payload->>'customer_phone'),'') = '' THEN
    RAISE EXCEPTION 'Nom et téléphone requis';
  END IF;

  INSERT INTO public.orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, subtotal, tax, shipping, discount, total,
    payment_method, payment_status, status, notes
  ) VALUES (
    '', auth.uid(),
    _payload->>'customer_name', _payload->>'customer_email', _payload->>'customer_phone',
    _payload->>'shipping_address', 0, 0, 0, 0, 0,
    NULLIF(_payload->>'payment_method','')::payment_method, 'pending', 'pending',
    _payload->>'notes'
  ) RETURNING * INTO v_order;

  FOR it IN SELECT * FROM jsonb_array_elements(items_arr) LOOP
    qty := GREATEST(COALESCE((it->>'quantity')::int, 0), 0);
    IF qty < 1 THEN RAISE EXCEPTION 'Quantité invalide'; END IF;

    SELECT id, sku, name_fr, price, promo_price, stock, is_active INTO p
      FROM public.products WHERE id = (it->>'product_id')::uuid;
    IF NOT FOUND OR NOT p.is_active THEN RAISE EXCEPTION 'Produit indisponible'; END IF;
    IF p.stock < qty THEN RAISE EXCEPTION 'Stock insuffisant pour %', p.name_fr; END IF;

    unit := COALESCE(p.promo_price, p.price);
    sub := sub + ROUND(unit * qty, 2);

    INSERT INTO public.order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total)
    VALUES (v_order.id, p.id, p.name_fr, p.sku, unit, qty, ROUND(unit * qty, 2));

    inv_items := inv_items || jsonb_build_object(
      'product_name', p.name_fr, 'product_sku', p.sku,
      'unit_price', unit, 'quantity', qty, 'total', ROUND(unit * qty, 2)
    );
  END LOOP;

  SELECT COALESCE(tax_rate, 0) INTO rate FROM public.settings WHERE id = 1;
  tax_amt := ROUND(sub * rate / 100, 2);
  ship := CASE WHEN sub > 0 THEN 3000 ELSE 0 END;

  UPDATE public.orders SET
    subtotal = sub, tax = tax_amt, shipping = ship, discount = 0,
    total = ROUND(sub + tax_amt + ship, 2), updated_at = now()
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  INSERT INTO public.invoices (
    invoice_number, type, order_id, client_name, client_email, client_phone,
    client_address, subtotal, tax, total, items, qr_data
  ) VALUES (
    '', 'invoice', v_order.id, v_order.customer_name, v_order.customer_email, v_order.customer_phone,
    v_order.shipping_address, sub, tax_amt, v_order.total, inv_items, v_order.order_number
  );

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'subtotal', v_order.subtotal,
    'tax', v_order.tax,
    'shipping', v_order.shipping,
    'total', v_order.total
  );
END; $$;

REVOKE ALL ON FUNCTION public.place_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb) TO anon, authenticated;
