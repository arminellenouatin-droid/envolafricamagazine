-- Remplacement du prototype 2FA par TOTP réel.
alter table public.users add column if not exists two_factor_secret text;
alter table public.users add column if not exists two_factor_recovery_hashes jsonb not null default '[]'::jsonb;
comment on column public.users.two_factor_secret is 'Secret TOTP chiffré côté application avec JWT_SECRET.';
comment on column public.users.two_factor_recovery_hashes is 'Hashes SHA-256 des codes de récupération à usage unique.';
