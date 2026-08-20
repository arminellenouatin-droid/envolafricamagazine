-- Versions linguistiques et pistes audio des articles Magazine
alter table public.articles add column if not exists translations jsonb not null default '{}'::jsonb;
alter table public.articles add column if not exists audio_by_language jsonb not null default '{}'::jsonb;

comment on column public.articles.translations is 'Versions éditoriales par code langue: { fr: { title, summary, content }, en: ... }';
comment on column public.articles.audio_by_language is 'Pistes audio publiques par code langue: { fr: "https://...", en: "https://..." }';

create index if not exists articles_translations_gin_idx on public.articles using gin (translations);
create index if not exists articles_audio_by_language_gin_idx on public.articles using gin (audio_by_language);
