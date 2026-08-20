-- Crowdfunding security hardening and private document storage.
-- The application accesses these resources through server-side service_role routes.
-- Explicit deny policies document the intended boundary for anon/authenticated clients.

create or replace function public.crowdfunding_deny_all()
returns boolean
language sql
stable
as $$ select false $$;

-- Keep direct client access closed; service_role bypasses RLS by design.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'crowdfunding_projects',
    'crowdfunding_contributions',
    'crowdfunding_documents',
    'crowdfunding_messages',
    'crowdfunding_repayments',
    'crowdfunding_payment_transactions',
    'crowdfunding_boosts',
    'crowdfunding_advisory_plans',
    'crowdfunding_advisory_engagements',
    'crowdfunding_monthly_reports',
    'crowdfunding_angel_chain_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', 'deny_direct_client_' || table_name, table_name);
    execute format('create policy %I on public.%I for all to anon, authenticated using (public.crowdfunding_deny_all()) with check (public.crowdfunding_deny_all())', 'deny_direct_client_' || table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('crowdfunding-documents', 'crowdfunding-documents', false)
on conflict (id) do update set public = false;

drop policy if exists crowdfunding_documents_no_direct_client_read on storage.objects;
create policy crowdfunding_documents_no_direct_client_read
on storage.objects for select to anon, authenticated
using (bucket_id = 'crowdfunding-documents' and public.crowdfunding_deny_all());

drop policy if exists crowdfunding_documents_no_direct_client_insert on storage.objects;
create policy crowdfunding_documents_no_direct_client_insert
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'crowdfunding-documents' and public.crowdfunding_deny_all());

drop policy if exists crowdfunding_documents_no_direct_client_update on storage.objects;
create policy crowdfunding_documents_no_direct_client_update
on storage.objects for update to anon, authenticated
using (bucket_id = 'crowdfunding-documents' and public.crowdfunding_deny_all())
with check (bucket_id = 'crowdfunding-documents' and public.crowdfunding_deny_all());

drop policy if exists crowdfunding_documents_no_direct_client_delete on storage.objects;
create policy crowdfunding_documents_no_direct_client_delete
on storage.objects for delete to anon, authenticated
using (bucket_id = 'crowdfunding-documents' and public.crowdfunding_deny_all());
