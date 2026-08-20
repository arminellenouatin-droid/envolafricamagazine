-- Lot RLS 2: tables métier sensibles lues/écrites par les routes serveur.
-- Les accès navigateur passent par les API Next.js avec service_role.
alter table public.soutien_pack_entitlements enable row level security;
alter table public.article_ranking_scores enable row level security;
alter table public.order_items_detailed enable row level security;
alter table public.dhl_shipping_rates enable row level security;
alter table public.local_shipping_rates enable row level security;
alter table public.user_popup_dismissals enable row level security;
alter table public.affiliate_conversions enable row level security;
alter table public.crowdfunding_boosts enable row level security;
alter table public.wab_legacy_post_metrics enable row level security;
alter table public.wab_legacy_reactions enable row level security;
alter table public.wab_legacy_comments enable row level security;
alter table public.magazine_subscription_plans enable row level security;
alter table public.magazine_categories enable row level security;
