create table if not exists public.crowdfunding_boost_settings (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  price_per_day_xof integer not null default 500 check (price_per_day_xof > 0),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.crowdfunding_boost_settings (code, price_per_day_xof)
values ('default', 500)
on conflict (code) do nothing;

alter table public.crowdfunding_boost_settings enable row level security;
create policy crowdfunding_boost_settings_deny_direct_client on public.crowdfunding_boost_settings for all to anon, authenticated using (public.crowdfunding_deny_all()) with check (public.crowdfunding_deny_all());
