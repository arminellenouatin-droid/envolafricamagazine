-- Comments are served through the authenticated Next.js API.
-- Prevent direct anonymous writes/reads through PostgREST.
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all comments" ON public.comments;
DROP POLICY IF EXISTS "service_write_comments" ON public.comments;
CREATE POLICY "service_write_comments"
  ON public.comments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

