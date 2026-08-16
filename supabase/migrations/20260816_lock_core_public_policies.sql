-- Ferme les policies publiques permissives des tables core.
-- Les écritures applicatives passent par le service_role côté serveur.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for service_role" ON public.users;
DROP POLICY IF EXISTS "Users can read own orders, service_role all" ON public.orders;
DROP POLICY IF EXISTS "Allow all donations" ON public.donations;
DROP POLICY IF EXISTS "Allow all for service_role articles" ON public.articles;
DROP POLICY IF EXISTS "Allow all for service_role magazines" ON public.magazines;
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;
DROP POLICY IF EXISTS "public_read_published_articles" ON public.articles;
DROP POLICY IF EXISTS "public_read_magazines" ON public.magazines;

CREATE POLICY "public_read_published_articles"
  ON public.articles FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "public_read_magazines"
  ON public.magazines FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "service_write_users"
  ON public.users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_write_orders"
  ON public.orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_write_payments"
  ON public.payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_write_donations"
  ON public.donations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_write_articles"
  ON public.articles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_write_magazines"
  ON public.magazines FOR ALL TO service_role
  USING (true) WITH CHECK (true);
