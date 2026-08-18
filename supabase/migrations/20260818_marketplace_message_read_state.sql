alter table public.marketplace_messages add column if not exists read_at timestamptz;
create index if not exists idx_marketplace_messages_unread on public.marketplace_messages (conversation_id, read_at, created_at desc);
