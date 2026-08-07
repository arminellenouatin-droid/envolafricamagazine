-- Envol Africa Magazine - Missing Tables from MODULE_DONNEES.md
-- Run after 001_init.sql
-- Covers: categories, article_categories, likes, site_settings KV, footer_links, mega_menu_items, landing_blocks, popup_campaigns, user_popup_dismissals, affiliate_links, affiliate_clicks, affiliate_conversions, affiliate_payouts, notifications, push_subscriptions, service_requests with exact enum, audit_log, plus user_devices, subscription_plans, subscriptions, soutien_pack_entitlements, article_ranking_scores, magazine_variants, order_items, downloads, payments, dhl_shipping_rates, local_shipping_rates, exchange_rates

-- Enums
create type user_role as enum ('inscrit', 'redacteur', 'redacteur_en_chef', 'gerant', 'administrateur');
create type plan_code as enum ('mensuel', 'annuel', 'chef_entreprise', 'soutien');
create type billing_interval as enum ('mensuel', 'annuel');
create type subscription_status as enum ('active', 'en_attente_paiement', 'expiree', 'annulee');
create type article_status as enum ('brouillon', 'en_validation', 'publie', 'depublie');
create type comment_status as enum ('visible', 'masque_moderation');
create type edition_type as enum ('normale', 'speciale', 'hors_serie');
create type magazine_version as enum ('cd_audio', 'numerique', 'papier', 'audio_pdf', 'audio_papier');
create type order_status as enum ('panier', 'en_attente_paiement', 'payee', 'annulee', 'remboursee');
create type order_item_type as enum ('magazine', 'abonnement', 'don');
create type payment_status as enum ('initie', 'confirme', 'echoue', 'rembourse');
create type donation_payment_method as enum ('mobile_money', 'carte', 'autre');
create type payout_method as enum ('mobile_money', 'virement', 'carte');
create type payout_status as enum ('demande', 'en_traitement', 'payee', 'rejetee');
create type commission_status as enum ('en_attente', 'validee', 'payee');
create type affiliate_target_type as enum ('general', 'magazine_numero');
create type service_type as enum ('montage_plan_affaires', 'conseils_externalisation', 'recrutement', 'formation_recyclage', 'levee_fonds', 'services_digitaux', 'marketing_strategie_vente', 'audit_gestion', 'gestion_projet', 'courtage');

-- Fix existing users table to add missing columns if not exists
alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists preferred_language text;
alter table public.users add column if not exists preferred_currency text;
alter table public.users add column if not exists company_name text;
alter table public.users add column if not exists is_affiliate boolean default false;

-- 1.2 user_devices
create table if not exists public.user_devices (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  device_fingerprint text,
  ip_address inet,
  country text,
  last_seen_at timestamptz default now(),
  is_revoked boolean default false
);

-- 2.1 subscription_plans
create table if not exists public.subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  code plan_code unique not null,
  price_first_period_xof numeric not null,
  price_recurring_xof numeric not null,
  billing_interval billing_interval not null,
  features jsonb,
  is_active boolean default true
);
insert into public.subscription_plans (code, price_first_period_xof, price_recurring_xof, billing_interval, features, is_active) values
  ('mensuel', 2000, 5000, 'mensuel', '["Articles illimités", "Enquêtes exclusives", "Audio 12 langues", "Mag digital mois gratuit"]', true),
  ('annuel', 42000, 42000, 'annuel', '["Idem mensuel + 12 magazines inclus"]', true),
  ('chef_entreprise', 15000, 20000, 'mensuel', '["Tous avantages + papier/audio avant-première + support dédié + accès IP"]', true),
  ('soutien', 600000, 600000, 'annuel', '["Tout Chef entreprise + pack prestige VIP"]', true)
on conflict (code) do nothing;

-- 2.2 subscriptions (new detailed)
create table if not exists public.subscriptions_detailed (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  plan_id uuid references public.subscription_plans(id),
  status subscription_status not null,
  is_first_period boolean default true,
  current_period_start timestamptz,
  current_period_end timestamptz,
  moneroo_subscription_ref text,
  cancelled_at timestamptz
);

-- 2.3 soutien_pack_entitlements
create table if not exists public.soutien_pack_entitlements (
  id uuid primary key default uuid_generate_v4(),
  subscription_id uuid references public.subscriptions_detailed(id),
  entitlement_code text,
  status text default 'en_attente_validation'
);

-- 3.1 categories
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  label text not null,
  color_hex text,
  is_active boolean default true
);
insert into public.categories (slug, label, color_hex, is_active) values
  ('editorial', 'Éditorial', '#9e001f', true),
  ('chronique', 'Chronique', '#5f5e5e', true),
  ('opinion', 'Opinion', '#664700', true),
  ('entrepreneuriat', 'Entrepreneuriat', '#bf0229', true),
  ('management', 'Management', '#303030', true),
  ('economie', 'Économie', '#9e001f', true),
  ('finance', 'Finance', '#845e00', true)
on conflict (slug) do nothing;

-- 3.3 article_categories
create table if not exists public.article_categories (
  article_id uuid references public.articles(id),
  category_id uuid references public.categories(id),
  is_primary boolean default false,
  primary key (article_id, category_id)
);

-- 3.5 likes
create table if not exists public.likes (
  article_id uuid references public.articles(id),
  profile_id uuid references public.users(id),
  created_at timestamptz default now(),
  primary key (article_id, profile_id)
);

-- 3.6 article_ranking_scores
create table if not exists public.article_ranking_scores (
  article_id uuid references public.articles(id) primary key,
  score numeric,
  computed_at timestamptz default now()
);

-- 4.2 magazine_variants
create table if not exists public.magazine_variants (
  id uuid primary key default uuid_generate_v4(),
  magazine_id uuid references public.magazines(id),
  version magazine_version not null,
  price_xof numeric not null,
  available_languages text[] not null,
  file_url text
);

-- 4.3 order_items (detailed)
create table if not exists public.order_items_detailed (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id),
  item_type order_item_type not null,
  magazine_variant_id uuid references public.magazine_variants(id),
  language text,
  unit_price numeric
);

-- 4.4 downloads detailed
create table if not exists public.downloads_detailed (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  magazine_variant_id uuid references public.magazine_variants(id),
  signed_url_issued_at timestamptz default now(),
  signed_url_expires_at timestamptz,
  watermark_applied boolean default false
);

-- 5.1 payments append-only
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id),
  donation_id uuid references public.donations(id),
  provider text default 'moneroo',
  provider_ref text,
  amount numeric,
  currency text,
  status payment_status,
  webhook_signature_verified boolean default false,
  raw_webhook_payload jsonb,
  created_at timestamptz default now()
);

-- 5.3 shipping rates
create table if not exists public.dhl_shipping_rates (
  id uuid primary key default uuid_generate_v4(),
  country_code text,
  price_xof numeric,
  updated_at timestamptz default now()
);
create table if not exists public.local_shipping_rates (
  id uuid primary key default uuid_generate_v4(),
  zone text,
  price_xof numeric,
  updated_at timestamptz default now()
);

-- 5.4 exchange_rates
create table if not exists public.exchange_rates (
  currency_code text primary key,
  rate_to_xof numeric,
  updated_at timestamptz default now()
);
insert into public.exchange_rates (currency_code, rate_to_xof, updated_at) values
  ('XOF', 1, now()),
  ('EUR', 655.957, now()),
  ('USD', 605.5, now()),
  ('NGN', 0.4, now()),
  ('GHS', 40, now())
on conflict (currency_code) do update set rate_to_xof = excluded.rate_to_xof, updated_at = now();

-- 6.1 site_settings KV
create table if not exists public.site_settings_kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);
insert into public.site_settings_kv (key, value) values
  ('pop_up_duration', '{"countdown_hours":48,"discount_percent":50,"reappear_after_days":30}'::jsonb),
  ('ranking_weights', '{"poids_vue":1,"poids_partage":3,"poids_commentaire":2,"decroissance":0.95,"fenetre_jours":7}'::jsonb)
on conflict (key) do nothing;

-- 6.2 footer_links
create table if not exists public.footer_links (
  id uuid primary key default uuid_generate_v4(),
  column_name text,
  label text,
  url text,
  "order" int,
  is_active boolean default true
);

-- 6.3 mega_menu_items
create table if not exists public.mega_menu_items (
  id uuid primary key default uuid_generate_v4(),
  column_name text,
  label text,
  url text,
  icon text,
  "order" int,
  featured_article_id uuid references public.articles(id)
);

-- 6.4 landing_blocks
create table if not exists public.landing_blocks (
  block_key text primary key,
  article_id uuid references public.articles(id),
  magazine_id uuid references public.magazines(id),
  "order" int
);
insert into public.landing_blocks (block_key, article_id, "order") values
  ('sentinelles', null, 1),
  ('bloc_secondaire', null, 2),
  ('essor', null, 3),
  ('ombre_douce', null, 4),
  ('clarte', null, 5),
  ('sous_bloc_1', null, 6),
  ('sous_bloc_2', null, 7),
  ('sous_bloc_3', null, 8),
  ('sous_bloc_4', null, 9),
  ('sous_bloc_5', null, 10),
  ('sous_bloc_6', null, 11),
  ('sous_bloc_7', null, 12),
  ('manager_du_mois', null, 13)
on conflict (block_key) do nothing;

-- 6.5 popup_campaigns
create table if not exists public.popup_campaigns (
  id uuid primary key default uuid_generate_v4(),
  discount_percent numeric default 50,
  countdown_hours int default 48,
  reappear_after_days int default 30,
  is_active boolean default false
);

-- 6.6 user_popup_dismissals
create table if not exists public.user_popup_dismissals (
  profile_id uuid references public.users(id),
  popup_id uuid references public.popup_campaigns(id),
  dismissed_at timestamptz default now(),
  primary key (profile_id, popup_id)
);

-- 7.1 affiliate_links
create table if not exists public.affiliate_links (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  target_type affiliate_target_type not null,
  magazine_id uuid references public.magazines(id),
  short_code text unique not null,
  created_at timestamptz default now()
);

-- 7.2 affiliate_clicks
create table if not exists public.affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid references public.affiliate_links(id),
  clicked_at timestamptz default now(),
  ip_address inet,
  converted boolean default false
);

-- 7.3 affiliate_conversions
create table if not exists public.affiliate_conversions (
  id uuid primary key default uuid_generate_v4(),
  link_id uuid references public.affiliate_links(id),
  order_id uuid references public.orders(id),
  subscription_id uuid references public.subscriptions_detailed(id),
  commission_rate numeric not null,
  commission_rate_reason text not null,
  commission_amount numeric not null,
  status commission_status default 'en_attente',
  created_at timestamptz default now()
);

-- 7.4 affiliate_payouts
create table if not exists public.affiliate_payouts (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  amount numeric not null,
  method payout_method not null,
  status payout_status default 'demande',
  created_at timestamptz default now()
);

-- 8.1 notifications
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  type text,
  title text,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- 8.2 push_subscriptions
create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  endpoint text,
  keys jsonb,
  created_at timestamptz default now()
);

-- 9.1 service_requests with exact enum
create table if not exists public.service_requests_exact (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.users(id),
  service_type service_type not null,
  description text,
  budget_indicatif text,
  company_name text,
  contact_name text,
  contact_phone text,
  status text default 'nouveau',
  created_at timestamptz default now()
);

-- 9.2 audit_log append-only
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.users(id),
  action text,
  entity_type text,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- RLS enable
alter table public.user_devices enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions_detailed enable row level security;
alter table public.categories enable row level security;
alter table public.article_categories enable row level security;
alter table public.likes enable row level security;
alter table public.magazine_variants enable row level security;
alter table public.payments enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.site_settings_kv enable row level security;
alter table public.footer_links enable row level security;
alter table public.mega_menu_items enable row level security;
alter table public.landing_blocks enable row level security;
alter table public.popup_campaigns enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.notifications enable row level security;

-- Permissive policies for service_role (for MVP, tighten later)
create policy "Allow all service_role" on public.user_devices for all using (true) with check (true);
create policy "Allow all service_role" on public.subscription_plans for all using (true) with check (true);
create policy "Allow all service_role" on public.categories for all using (true) with check (true);
create policy "Allow all service_role" on public.footer_links for all using (true) with check (true);
create policy "Allow all service_role" on public.landing_blocks for all using (true) with check (true);
