alter table public.marketplace_products
  add column if not exists product_type text not null default 'physical',
  add column if not exists delivery_type text not null default 'shipping',
  add column if not exists digital_file_url text,
  add column if not exists digital_external_url text,
  add column if not exists digital_access_instructions text,
  add column if not exists digital_download_limit integer not null default 5,
  add column if not exists service_duration_minutes integer,
  add column if not exists training_access_days integer;

alter table public.marketplace_products drop constraint if exists marketplace_products_product_type_check;
alter table public.marketplace_products add constraint marketplace_products_product_type_check check (product_type in ('physical','service','training','digital','downloadable'));
alter table public.marketplace_products drop constraint if exists marketplace_products_delivery_type_check;
alter table public.marketplace_products add constraint marketplace_products_delivery_type_check check (delivery_type in ('shipping','online','download','external_link'));
alter table public.marketplace_products drop constraint if exists marketplace_products_digital_download_limit_check;
alter table public.marketplace_products add constraint marketplace_products_digital_download_limit_check check (digital_download_limit between 1 and 50);

create index if not exists marketplace_products_type_status_idx on public.marketplace_products(product_type, status);


insert into storage.buckets (id, name, public)
values ('marketplace-digital', 'marketplace-digital', false)
on conflict (id) do update set public = false;

create table if not exists public.marketplace_download_tokens (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  buyer_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  download_count integer not null default 0 check (download_count >= 0),
  max_downloads integer not null default 5 check (max_downloads between 1 and 50),
  expires_at timestamptz not null,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists marketplace_download_tokens_buyer_idx on public.marketplace_download_tokens(buyer_id, created_at desc);
create index if not exists marketplace_download_tokens_order_idx on public.marketplace_download_tokens(order_id);
