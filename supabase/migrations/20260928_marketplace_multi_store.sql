-- Migration: Autoriser un vendeur à posséder plusieurs boutiques
-- Suppression de la contrainte unique sur user_id dans marketplace_suppliers

ALTER TABLE public.marketplace_suppliers DROP CONSTRAINT IF EXISTS marketplace_suppliers_user_id_key;
CREATE INDEX IF NOT EXISTS idx_marketplace_suppliers_user_id ON public.marketplace_suppliers(user_id);
