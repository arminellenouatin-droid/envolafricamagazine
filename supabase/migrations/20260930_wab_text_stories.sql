-- Migration: Support for text-only WAB status/stories on colored gradient backgrounds
-- Allows media_url to be NULL for text stories
-- Adds story_type ('media' | 'text'), text_content, and background preset identifier

ALTER TABLE public.wab_stories 
  ALTER COLUMN media_url DROP NOT NULL;

ALTER TABLE public.wab_stories 
  ADD COLUMN IF NOT EXISTS story_type text DEFAULT 'media';

ALTER TABLE public.wab_stories 
  ADD COLUMN IF NOT EXISTS text_content text;

ALTER TABLE public.wab_stories 
  ADD COLUMN IF NOT EXISTS background text;

COMMENT ON COLUMN public.wab_stories.story_type IS 'Type de story : media (photo/video) ou text (statut texte colore)';
COMMENT ON COLUMN public.wab_stories.text_content IS 'Texte du statut colore pour les stories de type text';
COMMENT ON COLUMN public.wab_stories.background IS 'Identifiant du preset de couleur WAB_BACKGROUND_PRESETS';
