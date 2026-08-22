-- Style: migration additive, conservatrice et réversible pour la Price Table Magazine.
-- Les prix historiques restent inchangés ; les nouvelles colonnes pilotent uniquement l’affichage et le checkout annuel.

alter table if exists public.magazine_subscription_plans
  add column if not exists annual_price numeric,
  add column if not exists annual_discount_percent numeric not null default 30;

alter table if exists public.magazine_subscription_plans
  drop constraint if exists magazine_subscription_plans_annual_price_check;

alter table if exists public.magazine_subscription_plans
  add constraint magazine_subscription_plans_annual_price_check
  check (annual_price is null or annual_price >= 0);

alter table if exists public.magazine_subscription_plans
  drop constraint if exists magazine_subscription_plans_annual_discount_check;

alter table if exists public.magazine_subscription_plans
  add constraint magazine_subscription_plans_annual_discount_check
  check (annual_discount_percent >= 0 and annual_discount_percent <= 100);

update public.magazine_subscription_plans
set annual_price = case id
  when 'mensuel' then 42000
  when 'annuel' then 42000
  when 'entreprise' then 168000
  when 'soutien' then 420000
  else annual_price
end
where annual_price is null;
