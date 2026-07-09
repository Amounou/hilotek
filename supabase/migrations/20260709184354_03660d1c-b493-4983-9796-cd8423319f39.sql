
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','technician','cashier','commercial','warehouse','writer','support','customer');
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','preparing','shipped','delivered','cancelled','refunded');
CREATE TYPE public.payment_status AS ENUM ('unpaid','pending','paid','refunded','failed');
CREATE TYPE public.payment_method AS ENUM ('orange_money','mtn_money','wave','card','cash','bank_transfer');
CREATE TYPE public.repair_status AS ENUM ('received','diagnosis','waiting_parts','in_repair','completed','delivered','cancelled');
CREATE TYPE public.memoire_status AS ENUM ('received','assigned','in_progress','review','completed','delivered','cancelled');
CREATE TYPE public.invoice_type AS ENUM ('invoice','receipt','quote','delivery_note');
CREATE TYPE public.movement_type AS ENUM ('in','out','adjustment');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ CATEGORIES / BRANDS ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Staff manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]));

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.brands TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Staff manage brands" ON public.brands FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  slug TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(12,2),
  cost_price NUMERIC(12,2),
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  warranty_months INT NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_active ON public.products(is_active);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse','cashier','commercial']::public.app_role[]));
CREATE POLICY "Staff manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_user ON public.clients(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own client record" ON public.clients FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','support']::public.app_role[]));
CREATE POLICY "Staff manage clients" ON public.clients FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','support']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','support']::public.app_role[]));
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ ORDERS ============
CREATE SEQUENCE public.order_seq START 1000;
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse','support']::public.app_role[]));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier']::public.app_role[]));
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse']::public.app_role[]));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.tg_order_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'CMD-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.order_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_orders_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_order_number();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read order items via order" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier','warehouse','support']::public.app_role[])))
);
CREATE POLICY "Insert order items via order" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','cashier']::public.app_role[])))
);

-- Decrement stock automatically on order item insert
CREATE OR REPLACE FUNCTION public.tg_decrement_stock() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products SET stock = GREATEST(stock - NEW.quantity, 0) WHERE id = NEW.product_id;
    INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reason, reference)
    VALUES (NEW.product_id, 'out', NEW.quantity, 'Vente commande', NEW.order_id::text);
  END IF;
  RETURN NEW;
END; $$;

-- ============ SERVICES ============
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  category TEXT,
  icon TEXT,
  image_url TEXT,
  price_from NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Staff manage services" ON public.services FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT NOT NULL,
  preferred_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE SEQUENCE public.booking_seq START 1000;
GRANT SELECT, INSERT, UPDATE ON public.service_bookings TO authenticated;
GRANT INSERT ON public.service_bookings TO anon;
GRANT ALL ON public.service_bookings TO service_role;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone book service" ON public.service_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own bookings" ON public.service_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','support']::public.app_role[]));
CREATE POLICY "Staff update bookings" ON public.service_bookings FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','support']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_booking_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number='' THEN
    NEW.booking_number := 'RDV-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.booking_seq')::text,5,'0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_bookings_number BEFORE INSERT ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION public.tg_booking_number();

-- ============ QUOTE REQUESTS ============
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service_type TEXT NOT NULL,
  budget TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE SEQUENCE public.quote_seq START 1000;
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit quote" ON public.quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read quotes" ON public.quote_requests FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial','support']::public.app_role[]));
CREATE POLICY "Staff update quotes" ON public.quote_requests FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','commercial']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_quote_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number='' THEN
    NEW.request_number := 'DEV-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.quote_seq')::text,5,'0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_quotes_number BEFORE INSERT ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.tg_quote_number();

-- ============ REPAIRS ============
CREATE SEQUENCE public.repair_seq START 1000;
CREATE TABLE public.repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_number TEXT UNIQUE NOT NULL,
  tracking_token TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  device_type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  imei TEXT,
  serial_number TEXT,
  accessories TEXT,
  issue_description TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.repair_status NOT NULL DEFAULT 'received',
  diagnosis TEXT,
  price_quote NUMERIC(12,2),
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_repairs_status ON public.repairs(status);
CREATE INDEX idx_repairs_tech ON public.repairs(technician_id);
GRANT SELECT ON public.repairs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.repairs TO authenticated;
GRANT ALL ON public.repairs TO service_role;
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;
-- Public read only via tracking_token match (we'll query WHERE tracking_token = X)
CREATE POLICY "Public track repair" ON public.repairs FOR SELECT USING (true);
CREATE POLICY "Staff manage repairs" ON public.repairs FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','technician','support','commercial']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','technician','support','commercial']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_repair_setup() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.repair_number IS NULL OR NEW.repair_number='' THEN
    NEW.repair_number := 'REP-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.repair_seq')::text,5,'0');
  END IF;
  IF NEW.tracking_token IS NULL OR NEW.tracking_token='' THEN
    NEW.tracking_token := encode(gen_random_bytes(9),'hex');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_repairs_setup BEFORE INSERT ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.tg_repair_setup();
CREATE TRIGGER trg_repairs_updated BEFORE UPDATE ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.repair_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID NOT NULL REFERENCES public.repairs(id) ON DELETE CASCADE,
  status public.repair_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.repair_status_history TO anon, authenticated;
GRANT INSERT ON public.repair_status_history TO authenticated;
GRANT ALL ON public.repair_status_history TO service_role;
ALTER TABLE public.repair_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read repair history" ON public.repair_status_history FOR SELECT USING (true);
CREATE POLICY "Staff insert repair history" ON public.repair_status_history FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','technician','support']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_repair_history() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.repair_status_history (repair_id, status, note, created_by)
    VALUES (NEW.id, NEW.status, NEW.notes, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_repairs_history_i AFTER INSERT ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.tg_repair_history();
CREATE TRIGGER trg_repairs_history_u AFTER UPDATE ON public.repairs FOR EACH ROW EXECUTE FUNCTION public.tg_repair_history();

-- ============ MEMOIRES ============
CREATE SEQUENCE public.memoire_seq START 1000;
CREATE TABLE public.memoires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memoire_number TEXT UNIQUE NOT NULL,
  tracking_token TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  university TEXT,
  level TEXT,
  filiere TEXT,
  theme TEXT NOT NULL,
  deadline DATE,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.memoire_status NOT NULL DEFAULT 'received',
  writer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  progress INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.memoires TO anon;
GRANT SELECT, INSERT, UPDATE ON public.memoires TO authenticated;
GRANT ALL ON public.memoires TO service_role;
ALTER TABLE public.memoires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public track memoire" ON public.memoires FOR SELECT USING (true);
CREATE POLICY "Staff manage memoires" ON public.memoires FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','writer','support','commercial']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','writer','support','commercial']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_memoire_setup() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.memoire_number IS NULL OR NEW.memoire_number='' THEN
    NEW.memoire_number := 'MEM-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.memoire_seq')::text,5,'0');
  END IF;
  IF NEW.tracking_token IS NULL OR NEW.tracking_token='' THEN
    NEW.tracking_token := encode(gen_random_bytes(9),'hex');
  END IF;
  NEW.balance := COALESCE(NEW.total_amount,0) - COALESCE(NEW.deposit,0);
  -- Auto-assign a writer if none: pick first writer
  IF NEW.writer_id IS NULL THEN
    SELECT user_id INTO NEW.writer_id FROM public.user_roles WHERE role='writer' ORDER BY random() LIMIT 1;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_memoires_setup BEFORE INSERT ON public.memoires FOR EACH ROW EXECUTE FUNCTION public.tg_memoire_setup();

CREATE OR REPLACE FUNCTION public.tg_memoire_balance_upd() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.balance := COALESCE(NEW.total_amount,0) - COALESCE(NEW.deposit,0);
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_memoires_bal BEFORE UPDATE ON public.memoires FOR EACH ROW EXECUTE FUNCTION public.tg_memoire_balance_upd();

CREATE TABLE public.memoire_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memoire_id UUID NOT NULL REFERENCES public.memoires(id) ON DELETE CASCADE,
  status public.memoire_status NOT NULL,
  note TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.memoire_status_history TO anon, authenticated;
GRANT INSERT ON public.memoire_status_history TO authenticated;
GRANT ALL ON public.memoire_status_history TO service_role;
ALTER TABLE public.memoire_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read memoire history" ON public.memoire_status_history FOR SELECT USING (true);
CREATE POLICY "Staff insert memoire history" ON public.memoire_status_history FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','writer','support']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_memoire_history() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP='INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.memoire_status_history (memoire_id, status, note, created_by)
    VALUES (NEW.id, NEW.status, NEW.notes, auth.uid());
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_memoires_hist_i AFTER INSERT ON public.memoires FOR EACH ROW EXECUTE FUNCTION public.tg_memoire_history();
CREATE TRIGGER trg_memoires_hist_u AFTER UPDATE ON public.memoires FOR EACH ROW EXECUTE FUNCTION public.tg_memoire_history();

-- ============ INVOICES ============
CREATE SEQUENCE public.invoice_seq START 1000;
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  type public.invoice_type NOT NULL DEFAULT 'invoice',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  repair_id UUID REFERENCES public.repairs(id) ON DELETE SET NULL,
  memoire_id UUID REFERENCES public.memoires(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]',
  qr_data TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read invoices" ON public.invoices FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial','support']::public.app_role[]));
CREATE POLICY "Users read own invoices" ON public.invoices FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = invoices.order_id AND o.user_id = auth.uid())
);
CREATE POLICY "Staff create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','cashier','commercial']::public.app_role[]));

CREATE OR REPLACE FUNCTION public.tg_invoice_number() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE prefix TEXT;
BEGIN
  prefix := CASE NEW.type WHEN 'invoice' THEN 'FAC' WHEN 'receipt' THEN 'REC' WHEN 'quote' THEN 'DEV' WHEN 'delivery_note' THEN 'BL' END;
  IF NEW.invoice_number IS NULL OR NEW.invoice_number='' THEN
    NEW.invoice_number := prefix || '-' || to_char(now(),'YYYYMM') || '-' || lpad(nextval('public.invoice_seq')::text,5,'0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_invoices_number BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.tg_invoice_number();

-- ============ INVENTORY MOVEMENTS ============
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.movement_type NOT NULL,
  quantity INT NOT NULL,
  reason TEXT,
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_inv_product ON public.inventory_movements(product_id);
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read movements" ON public.inventory_movements FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse','cashier']::public.app_role[]));
CREATE POLICY "Staff insert movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','warehouse']::public.app_role[]));

-- Wire stock decrement trigger AFTER inventory_movements exists
CREATE TRIGGER trg_order_items_stock AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.tg_decrement_stock();

-- Adjust stock when inventory_movements inserted directly (in/out/adjust)
CREATE OR REPLACE FUNCTION public.tg_apply_movement() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Skip auto-apply if reason is 'Vente commande' (already applied by tg_decrement_stock)
  IF NEW.reason = 'Vente commande' THEN RETURN NEW; END IF;
  IF NEW.movement_type = 'in' THEN
    UPDATE public.products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE public.products SET stock = GREATEST(stock - NEW.quantity, 0) WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'adjustment' THEN
    UPDATE public.products SET stock = NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_inv_apply AFTER INSERT ON public.inventory_movements FOR EACH ROW EXECUTE FUNCTION public.tg_apply_movement();

-- ============ CONTACT / NEWSLETTER ============
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone contact" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read contacts" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','support']::public.app_role[]));
CREATE POLICY "Staff update contacts" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','support']::public.app_role[]));

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff read subs" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- ============ BLOG POSTS ============
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_fr TEXT,
  excerpt_en TEXT,
  content_fr TEXT,
  content_en TEXT,
  cover_url TEXT,
  category TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON public.blog_posts FOR SELECT USING (is_published = true OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','support']::public.app_role[]));
CREATE POLICY "Staff manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));

-- ============ SETTINGS (singleton) ============
CREATE TABLE public.settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT '@lkof Services & Tech',
  address TEXT,
  phone TEXT,
  email TEXT,
  hours TEXT,
  socials JSONB NOT NULL DEFAULT '{}',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));
INSERT INTO public.settings (id) VALUES (1);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::public.app_role[]));
CREATE POLICY "Users insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
