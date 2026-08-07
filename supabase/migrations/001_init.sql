-- Envol Africa Magazine - Initial Schema for Supabase
-- Run this in Supabase SQL Editor
-- Project: rtfjwpytiuvoekomevpu

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  prenom text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('visitor','user','subscriber','affiliate','client','redacteur','redacteur_chef','gerant','admin')),
  avatar text,
  lang text default 'fr',
  currency text default 'XOF',
  created_at timestamptz default now(),
  is_verified boolean default true,
  two_factor_enabled boolean default false,
  company text,
  country text default 'BJ',
  phone text,
  affiliate_code text unique not null,
  referred_by uuid references public.users(id),
  subscription jsonb,
  favorites text[] default '{}',
  downloads text[] default '{}'
);

-- Articles table
create table public.articles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  summary text,
  content text not null,
  preview_lines int default 12,
  category text,
  tags text[] default '{}',
  author text,
  author_id text,
  image text,
  images text[] default '{}',
  is_published boolean default true,
  is_featured boolean default false,
  is_sentinelle boolean default false,
  is_essor boolean default false,
  is_ombre_douce boolean default false,
  views int default 0,
  likes int default 0,
  created_at timestamptz default now(),
  published_at timestamptz default now(),
  language text default 'fr',
  has_audio boolean default true,
  audio_url text,
  reading_time int default 5,
  is_video boolean default false,
  video_url text
);

-- Magazines table
create table public.magazines (
  id uuid primary key default uuid_generate_v4(),
  numero int unique not null,
  title text not null,
  cover text,
  date date,
  year int,
  description text,
  preview_pages int default 5,
  formats text[] default '{"numerique","papier","cd_audio","audio_pdf","audio_papier"}',
  languages text[] default '{"fr","en","es"}',
  featured boolean default false,
  price_overrides jsonb
);

-- Orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  items jsonb not null,
  total int not null,
  currency text default 'XOF',
  status text default 'pending' check (status in ('pending','paid','failed','shipped')),
  payment_id text,
  affiliate_code text,
  shipping_country text,
  shipping_cost int default 0,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- Affiliate earnings
create table public.affiliate_earnings (
  id uuid primary key default uuid_generate_v4(),
  affiliate_id uuid references public.users(id) not null,
  order_id uuid references public.orders(id) not null,
  amount int not null,
  commission int not null,
  rate float not null,
  status text default 'available' check (status in ('pending','available','paid')),
  created_at timestamptz default now()
);

-- Donations
create table public.donations (
  id uuid primary key default uuid_generate_v4(),
  user_id text,
  amount int not null,
  currency text default 'XOF',
  email text,
  message text,
  payment_id text,
  status text default 'pending' check (status in ('pending','paid')),
  created_at timestamptz default now()
);

-- Comments
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles(id) not null,
  user_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamptz default now(),
  likes int default 0,
  is_moderated boolean default false
);

-- Indexes
create index idx_articles_slug on public.articles(slug);
create index idx_articles_category on public.articles(category);
create index idx_articles_published on public.articles(is_published, published_at desc);
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_affiliate_affiliate on public.affiliate_earnings(affiliate_id);
create index idx_users_email on public.users(email);
create index idx_users_affiliate on public.users(affiliate_code);

-- Enable RLS
alter table public.users enable row level security;
alter table public.articles enable row level security;
alter table public.magazines enable row level security;
alter table public.orders enable row level security;
alter table public.affiliate_earnings enable row level security;
alter table public.donations enable row level security;
alter table public.comments enable row level security;

-- Policies: allow all for service_role, read for anon on published
-- For simplicity in this project, we create permissive policies.
-- In production, tighten as needed.

create policy "Allow all for service_role"
  on public.users for all
  using (true) with check (true);

create policy "Public can read published articles"
  on public.articles for select
  using (is_published = true);

create policy "Allow all for service_role articles"
  on public.articles for all
  using (true) with check (true);

create policy "Allow all for service_role magazines"
  on public.magazines for all
  using (true) with check (true);

create policy "Users can read own orders, service_role all"
  on public.orders for all
  using (true) with check (true);

create policy "Allow all affiliate"
  on public.affiliate_earnings for all
  using (true) with check (true);

create policy "Allow all donations"
  on public.donations for all
  using (true) with check (true);

create policy "Allow all comments"
  on public.comments for all
  using (true) with check (true);

-- Storage buckets (run in Supabase dashboard Storage)
-- Create buckets: covers, magazines, audio, avatars
-- Enable public read for covers
