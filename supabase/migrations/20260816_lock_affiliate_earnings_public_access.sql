-- Protect affiliate commissions from public PostgREST access.
-- The Next.js API reads this table with the server service role and filters by
-- the authenticated user's id before returning data.
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all affiliate" ON public.affiliate_earnings;
DROP POLICY IF EXISTS "service_write_affiliate_earnings" ON public.affiliate_earnings;
CREATE POLICY "service_write_affiliate_earnings"
  ON public.affiliate_earnings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

