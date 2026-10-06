-- Table de métadonnées pour le stockage Cloudflare R2
create table if not exists public.storage_objects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null,
  module       text not null check (module in ('wab', 'magazine', 'marketplace', 'crowdfunding', 'jobs', 'awards', 'messaging', 'profile')),
  kind         text not null check (kind in ('image', 'video', 'document', 'attachment')),
  visibility   text not null check (visibility in ('public', 'private')),
  bucket       text not null,
  key          text unique not null,
  content_type text not null,
  bytes        bigint not null check (bytes >= 0),
  status       text not null default 'pending' check (status in ('pending', 'ready', 'deleted')),
  ref_type     text,
  ref_id       text,
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz
);

-- Index pour requêtes performantes
create index if not exists idx_storage_objects_owner on public.storage_objects(owner_id);
create index if not exists idx_storage_objects_status_created on public.storage_objects(status, created_at);
create index if not exists idx_storage_objects_module on public.storage_objects(module);

-- Table de sauvegarde pour la migration et le rollback sans risque
create table if not exists public.storage_migration_backup (
  id           bigint generated always as identity primary key,
  table_name   text not null,
  column_name  text not null,
  record_id    text not null,
  old_value    text not null,
  new_key      text not null,
  migrated_at  timestamptz not null default now()
);

-- RLS activée sur les tables de stockage
alter table public.storage_objects enable row level security;
alter table public.storage_migration_backup enable row level security;

-- Sécurité par défaut : révoquer les privilèges publics
revoke all on public.storage_objects from anon, authenticated;
revoke all on public.storage_migration_backup from anon, authenticated;

-- Politique de lecture : un utilisateur authentifié ne peut lire que ses propres objets
grant select on public.storage_objects to authenticated;

drop policy if exists "storage_objects_read_own" on public.storage_objects;
create policy "storage_objects_read_own" on public.storage_objects
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- Toute écriture (INSERT, UPDATE, DELETE) s'effectue exclusivement côté serveur via le service_role.
