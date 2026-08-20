-- Lot RLS 1: tables sensibles exclusivement utilisées par les routes serveur.
-- La clé service_role contourne RLS côté backend ; anon/authenticated n'ont aucune
-- policy permissive par défaut, ce qui ferme l'exposition directe du navigateur.
alter table public.wab_messages enable row level security;
alter table public.wab_conversations enable row level security;
alter table public.downloads_detailed enable row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.audit_log enable row level security;
alter table public.service_requests_exact enable row level security;
