-- Marketplace EAM : catalogue, certification, boosts et paiements échelonnés.
-- Aucune table des autres sous-projets n'est modifiée.

create extension if not exists "uuid-ossp";

create table if not exists public.marketplace_suppliers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  business_name text not null,
  description text,
  country_code char(2),
  city text,
  logo_url text,
  certification_status text not null default 'unverified' check (certification_status in ('unverified','pending','certified','expired','rejected')),
  certification_expires_at timestamptz,
  certification_payment_id text,
  rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_products (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.marketplace_suppliers(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique,
  description text,
  category text not null,
  country_code char(2),
  city text,
  price_xof integer not null check (price_xof >= 0),
  currency char(3) not null default 'XOF',
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  media jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft','pending_review','published','paused','sold_out','archived')),
  installment_enabled boolean not null default false,
  installment_months_max integer check (installment_months_max between 1 and 12),
  reserved_until timestamptz,
  is_boosted boolean not null default false,
  boost_ends_at timestamptz,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_boosts (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  supplier_id uuid not null references public.marketplace_suppliers(id) on delete cascade,
  amount_xof integer not null check (amount_xof > 0),
  duration_days integer not null check (duration_days between 1 and 90),
  provider_payment_id text unique,
  status text not null default 'pending' check (status in ('pending','active','ended','cancelled','failed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_conversations (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  supplier_id uuid not null references public.marketplace_suppliers(id) on delete cascade,
  warning_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  unique(product_id, buyer_id, supplier_id)
);

create table if not exists public.marketplace_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text check (char_length(body) between 1 and 4000),
  media jsonb not null default '[]'::jsonb,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  moderation_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.marketplace_orders (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.marketplace_products(id),
  buyer_id uuid not null references public.users(id),
  supplier_id uuid not null references public.marketplace_suppliers(id),
  total_xof integer not null check (total_xof > 0),
  payment_mode text not null check (payment_mode in ('full','installment')),
  status text not null default 'pending_payment' check (status in ('pending_payment','active_installment','paid','reserved','shipped','received','cancelled','disputed')),
  received_at timestamptz,
  provider_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_installments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  sequence_no integer not null check (sequence_no between 1 and 12),
  due_at timestamptz not null,
  principal_xof integer not null check (principal_xof > 0),
  penalty_xof integer not null default 0 check (penalty_xof >= 0),
  paid_at timestamptz,
  status text not null default 'due' check (status in ('due','paid','late','cancelled')),
  provider_payment_id text,
  unique(order_id, sequence_no)
);

create index if not exists idx_marketplace_products_feed on public.marketplace_products (status, is_boosted desc, boost_ends_at desc, created_at desc);
create index if not exists idx_marketplace_products_category on public.marketplace_products (category, country_code, created_at desc);
create index if not exists idx_marketplace_messages_conversation on public.marketplace_messages (conversation_id, created_at desc);
create index if not exists idx_marketplace_installments_due on public.marketplace_installments (status, due_at);

alter table public.marketplace_suppliers enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_boosts enable row level security;
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_installments enable row level security;

revoke all on table public.marketplace_suppliers, public.marketplace_products, public.marketplace_boosts, public.marketplace_conversations, public.marketplace_messages, public.marketplace_orders, public.marketplace_installments from anon, authenticated;
