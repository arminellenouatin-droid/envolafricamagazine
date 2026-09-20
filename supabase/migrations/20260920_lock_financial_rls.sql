-- Migration de sécurité critique : verrouillage RLS des 10 tables financières
-- Seul le rôle serveur service_role (backend Next.js) y accède désormais.
-- Suppression de tout droit direct pour 'anon' (visiteur public) et 'authenticated'.

ALTER TABLE IF EXISTS public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ceremony_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.network_size_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.unallocated_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.affiliate_product_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketplace_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketplace_download_tokens ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.affiliates FROM anon, authenticated;
REVOKE ALL ON public.commissions FROM anon, authenticated;
REVOKE ALL ON public.withdrawals FROM anon, authenticated;
REVOKE ALL ON public.ceremony_funds FROM anon, authenticated;
REVOKE ALL ON public.network_size_funds FROM anon, authenticated;
REVOKE ALL ON public.unallocated_funds FROM anon, authenticated;
REVOKE ALL ON public.affiliate_product_wallets FROM anon, authenticated;
REVOKE ALL ON public.product_affiliations FROM anon, authenticated;
REVOKE ALL ON public.marketplace_commissions FROM anon, authenticated;
REVOKE ALL ON public.marketplace_download_tokens FROM anon, authenticated;
