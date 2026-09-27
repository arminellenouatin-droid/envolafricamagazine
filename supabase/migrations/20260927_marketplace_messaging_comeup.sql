-- ============================================================================
-- MESSAGERIE MARKETPLACE ISOLÉE (STYLE COMEUP) — ENVOL AFRICA
-- Table dédiée aux échanges Acheteur <-> Fournisseur, distincte de WAB
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 1. Extension de la table des conversations
create table if not exists public.marketplace_conversations (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.marketplace_products(id) on delete set null,
  buyer_id uuid not null references public.users(id) on delete cascade,
  supplier_id uuid not null references public.marketplace_suppliers(id) on delete cascade,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  status text not null default 'pre_purchase' check (status in ('pre_purchase', 'order_pending_acceptance', 'order_rejected', 'in_progress', 'delivered_pending_validation', 'revision_requested', 'completed', 'disputed', 'refunded')),
  warning_acknowledged_at timestamptz default now(),
  last_message_at timestamptz default now(),
  last_message_preview text,
  buyer_unread_count integer not null default 0,
  supplier_unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Si la table existait déjà avec un schéma partiel, on s'assure d'ajouter les colonnes nécessaires
alter table public.marketplace_conversations add column if not exists order_id uuid references public.marketplace_orders(id) on delete set null;
alter table public.marketplace_conversations add column if not exists status text not null default 'pre_purchase';
alter table public.marketplace_conversations add column if not exists last_message_at timestamptz default now();
alter table public.marketplace_conversations add column if not exists last_message_preview text;
alter table public.marketplace_conversations add column if not exists buyer_unread_count integer not null default 0;
alter table public.marketplace_conversations add column if not exists supplier_unread_count integer not null default 0;
alter table public.marketplace_conversations add column if not exists updated_at timestamptz default now();

-- 2. Messages Marketplace (Non modifiables, non supprimables par les parties)
create table if not exists public.marketplace_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  sender_role text not null default 'buyer' check (sender_role in ('buyer', 'supplier', 'system', 'admin')),
  message_type text not null default 'text' check (message_type in ('text', 'image', 'video', 'document', 'system', 'delivery', 'revision', 'call')),
  body text,
  media jsonb not null default '[]'::jsonb,
  is_delivery boolean not null default false,
  delivery_assets jsonb not null default '[]'::jsonb,
  is_quick_reply boolean not null default false,
  call_meta jsonb not null default '{}'::jsonb,
  moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'rejected')),
  moderation_reason text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.marketplace_messages add column if not exists sender_role text not null default 'buyer';
alter table public.marketplace_messages add column if not exists message_type text not null default 'text';
alter table public.marketplace_messages add column if not exists is_delivery boolean not null default false;
alter table public.marketplace_messages add column if not exists delivery_assets jsonb not null default '[]'::jsonb;
alter table public.marketplace_messages add column if not exists is_quick_reply boolean not null default false;
alter table public.marketplace_messages add column if not exists call_meta jsonb not null default '{}'::jsonb;

-- 3. Extension de la table des commandes Marketplace pour le cycle ComeUp
alter table public.marketplace_orders add column if not exists acceptance_deadline timestamptz;
alter table public.marketplace_orders add column if not exists auto_validation_deadline timestamptz;
alter table public.marketplace_orders add column if not exists revisions_used integer not null default 0;
alter table public.marketplace_orders add column if not exists revisions_max integer not null default 2;
alter table public.marketplace_orders add column if not exists delivered_at timestamptz;
alter table public.marketplace_orders add column if not exists disputed_at timestamptz;

-- 4. Appels 1:1 ComeUp Direct
create table if not exists public.marketplace_calls (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  caller_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  call_type text not null check (call_type in ('audio', 'video')),
  status text not null default 'initiated' check (status in ('initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended')),
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

-- 5. Litiges Marketplace & Arbitrage
create table if not exists public.marketplace_disputes (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  opened_by uuid not null references public.users(id) on delete cascade,
  reason text not null check (reason in ('non_compliant', 'delays', 'bypass_attempt', 'abusive_behavior', 'other')),
  description text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  decision text check (decision in ('release_funds', 'refund_buyer', 'dismissed')),
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. Journal d'audit des accès administrateur aux conversations
create table if not exists public.marketplace_admin_access_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  dispute_id uuid references public.marketplace_disputes(id) on delete set null,
  reason text not null,
  accessed_at timestamptz not null default now()
);

-- 7. Modèles de réponses rapides vendeur (ComeUp Quick Replies)
create table if not exists public.marketplace_quick_replies (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid not null references public.marketplace_suppliers(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 8. Disponibilité appels fournisseur
alter table public.marketplace_suppliers add column if not exists call_available boolean not null default true;

-- 9. Alertes anti-contournement répétées
create table if not exists public.marketplace_bypass_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.marketplace_conversations(id) on delete cascade,
  matched_pattern text not null,
  offending_text text not null,
  attempt_count integer not null default 1,
  created_at timestamptz not null default now()
);

-- 10. Index de performance
create index if not exists idx_marketplace_conversations_buyer on public.marketplace_conversations(buyer_id, last_message_at desc);
create index if not exists idx_marketplace_conversations_supplier on public.marketplace_conversations(supplier_id, last_message_at desc);
create index if not exists idx_marketplace_conversations_order on public.marketplace_conversations(order_id);
create index if not exists idx_marketplace_messages_conv_created on public.marketplace_messages(conversation_id, created_at asc);
create index if not exists idx_marketplace_calls_conv on public.marketplace_calls(conversation_id, created_at desc);
create index if not exists idx_marketplace_disputes_conv on public.marketplace_disputes(conversation_id);
create index if not exists idx_marketplace_quick_replies_supp on public.marketplace_quick_replies(supplier_id);

-- 11. Sécurité RLS stricte : tables fermées à anon & authenticated (accès via Service Role uniquement)
alter table public.marketplace_conversations enable row level security;
alter table public.marketplace_messages enable row level security;
alter table public.marketplace_calls enable row level security;
alter table public.marketplace_disputes enable row level security;
alter table public.marketplace_admin_access_logs enable row level security;
alter table public.marketplace_quick_replies enable row level security;
alter table public.marketplace_bypass_alerts enable row level security;

revoke all on public.marketplace_conversations, public.marketplace_messages, public.marketplace_calls, public.marketplace_disputes, public.marketplace_admin_access_logs, public.marketplace_quick_replies, public.marketplace_bypass_alerts from anon, authenticated;
