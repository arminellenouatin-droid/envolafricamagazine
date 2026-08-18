create table if not exists public.wab_conversations (
  id uuid primary key default uuid_generate_v4(),
  participant_a uuid not null references public.users(id) on delete cascade,
  participant_b uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_a <> participant_b),
  unique (participant_a, participant_b)
);
create table if not exists public.wab_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.wab_conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_wab_messages_conversation on public.wab_messages(conversation_id, created_at desc);
create index if not exists idx_wab_messages_unread on public.wab_messages(sender_id, read_at);
