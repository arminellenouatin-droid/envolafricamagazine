-- Article editor: explicit public/free versus subscriber-only access.
alter table public.articles
  add column if not exists is_encrypted boolean not null default true;

comment on column public.articles.is_encrypted is 'When true, non-subscribers receive the preview/paywall; when false, the full article is public.';

update public.articles
set is_encrypted = true
where is_encrypted is null;
