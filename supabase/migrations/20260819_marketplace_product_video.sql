-- Option vidéo Marketplace : 5 000 XOF par mois, jusqu'à 10 produits vidéo actifs.
create table if not exists public.marketplace_video_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  amount_xof integer not null default 5000 check (amount_xof = 5000),
  currency char(3) not null default 'XOF',
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','failed')),
  provider_payment_id text unique,
  starts_at timestamptz,
  ends_at timestamptz,
  video_count integer not null default 0 check (video_count between 0 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketplace_products add column if not exists product_video_url text;
alter table public.marketplace_products add column if not exists product_video_mime text;
alter table public.marketplace_products add column if not exists product_video_size integer;
alter table public.marketplace_products add column if not exists product_video_updated_at timestamptz;

create index if not exists idx_marketplace_products_video on public.marketplace_products (supplier_id, product_video_url) where product_video_url is not null;
alter table public.marketplace_video_subscriptions enable row level security;
revoke all on table public.marketplace_video_subscriptions from anon, authenticated;
