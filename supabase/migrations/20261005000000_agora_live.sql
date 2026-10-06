-- Agora Live — tables de support. N'altère AUCUNE table existante d'Africa Awards.
-- live_id = identifiant de ton live existant (texte, pas de FK vers tes tables pour ne rien casser).

create table if not exists public.agora_live_channels (
  live_id          text primary key,
  channel_name     text not null unique,
  status           text not null default 'scheduled'
                   check (status in ('scheduled','live','ended')),
  current_viewers  integer not null default 0 check (current_viewers >= 0),
  peak_viewers     integer not null default 0 check (peak_viewers >= 0),
  started_at       timestamptz,
  ended_at         timestamptz,
  created_at       timestamptz not null default now()
);

-- Qui a le droit de PUBLIER / modérer. Tous les autres = spectateurs (audience).
create table if not exists public.agora_live_participants (
  pk          bigint generated always as identity primary key,
  live_id     text not null references public.agora_live_channels(live_id) on delete cascade,
  user_id     uuid not null,
  role        text not null check (role in ('host','cohost','moderator')),
  uid         integer generated always as identity (start with 1000) unique,
  created_at  timestamptz not null default now(),
  unique (live_id, user_id),
  check (uid < 1000000000)
);
create index if not exists agora_live_participants_live_idx on public.agora_live_participants(live_id);

-- Journal d'idempotence des webhooks Agora (NCS peut renvoyer le même événement)
create table if not exists public.agora_event_log (
  notice_id     text primary key,
  channel_name  text not null,
  event_type    integer not null,
  created_at    timestamptz not null default now()
);

alter table public.agora_live_channels     enable row level security;
alter table public.agora_live_participants enable row level security;
alter table public.agora_event_log         enable row level security;

-- Lecture du statut / nombre de spectateurs par les utilisateurs connectés (ex. via Supabase Realtime)
drop policy if exists "agora_channels_read" on public.agora_live_channels;
create policy "agora_channels_read" on public.agora_live_channels
  for select to authenticated using (true);

-- Un utilisateur ne voit que sa propre ligne ; toute écriture passe par le serveur (service role)
drop policy if exists "agora_participants_read_own" on public.agora_live_participants;
create policy "agora_participants_read_own" on public.agora_live_participants
  for select to authenticated using (user_id = auth.uid());

-- Aucune policy sur agora_event_log : accessible uniquement par le service role.

create or replace function public.agora_apply_event(p_notice_id text, p_channel text, p_event integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_rows integer;
begin
  insert into public.agora_event_log(notice_id, channel_name, event_type)
  values (p_notice_id, p_channel, p_event)
  on conflict (notice_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return; end if;  -- déjà traité

  if p_event = 105 then        -- spectateur rejoint
    update public.agora_live_channels
       set current_viewers = current_viewers + 1,
           peak_viewers    = greatest(peak_viewers, current_viewers + 1)
     where channel_name = p_channel;
  elsif p_event = 106 then     -- spectateur quitte
    update public.agora_live_channels
       set current_viewers = greatest(current_viewers - 1, 0)
     where channel_name = p_channel;
  end if;
end $$;

revoke all on function public.agora_apply_event(text, text, integer) from public, anon, authenticated;
grant execute on function public.agora_apply_event(text, text, integer) to service_role;

-- Optionnel : diffuser en temps réel le nombre de spectateurs vers tes écrans existants
-- alter publication supabase_realtime add table public.agora_live_channels;
