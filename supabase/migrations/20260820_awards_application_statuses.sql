alter table public.awards_applications drop constraint if exists awards_applications_status_check;
alter table public.awards_applications add constraint awards_applications_status_check check (status in ('en_attente_paiement','soumise','en_etude','approuvée','rejetée','acceptee','refusee'));
