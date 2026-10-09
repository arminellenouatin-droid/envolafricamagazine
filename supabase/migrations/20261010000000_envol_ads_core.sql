-- ==============================================================================
-- MIGRATION : ENVOL ADS CORE (Ad Server Propriétaire Envol Africa)
-- Schéma ad_*, RLS stricte, waterfall contextuel, anti-fraude, audit log
-- ==============================================================================

-- 1. Table des Annonceurs
CREATE TABLE IF NOT EXISTS public.ad_advertisers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    nom TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'particulier' CHECK (type IN ('particulier', 'entreprise', 'vendeur', 'organisation')),
    pays TEXT NOT NULL DEFAULT 'BJ',
    email_facturation TEXT NOT NULL,
    telephone TEXT,
    identifiant_legal TEXT,
    statut TEXT NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'a_verifier')),
    niveau_confiance TEXT NOT NULL DEFAULT 'standard' CHECK (niveau_confiance IN ('nouveau', 'standard', 'verifie', 'premium')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index sur advertiser
CREATE INDEX IF NOT EXISTS idx_ad_advertisers_user_id ON public.ad_advertisers(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_advertisers_statut ON public.ad_advertisers(statut);

-- 2. Table des Emplacements Publicitaires (Slots)
CREATE TABLE IF NOT EXISTS public.ad_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    page_type TEXT NOT NULL,
    formats TEXT[] NOT NULL DEFAULT '{}',
    width_desktop INTEGER NOT NULL DEFAULT 728,
    height_desktop INTEGER NOT NULL DEFAULT 90,
    width_mobile INTEGER NOT NULL DEFAULT 320,
    height_mobile INTEGER NOT NULL DEFAULT 50,
    tarif_cpm NUMERIC NOT NULL DEFAULT 1500 CHECK (tarif_cpm >= 0),
    tarif_cpc NUMERIC NOT NULL DEFAULT 100 CHECK (tarif_cpc >= 0),
    tarif_jour NUMERIC NOT NULL DEFAULT 10000 CHECK (tarif_jour >= 0),
    actif BOOLEAN NOT NULL DEFAULT true,
    adsense_enabled BOOLEAN NOT NULL DEFAULT false,
    adsense_slot_id TEXT,
    fallback_house_ad JSONB,
    ordre INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_slots_code ON public.ad_slots(code);
CREATE INDEX IF NOT EXISTS idx_ad_slots_page_type ON public.ad_slots(page_type);

-- 3. Table des Campagnes Publicitaires
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advertiser_id UUID NOT NULL REFERENCES public.ad_advertisers(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    objectif TEXT NOT NULL DEFAULT 'notoriete' CHECK (objectif IN ('notoriete', 'trafic', 'conversion', 'candidatures', 'ventes', 'soutien')),
    type TEXT NOT NULL DEFAULT 'display' CHECK (type IN ('display', 'native', 'wab_post', 'carousel', 'video', 'video_overlay', 'sponsoring')),
    modele_facturation TEXT NOT NULL DEFAULT 'cpm' CHECK (modele_facturation IN ('cpm', 'cpc', 'cpv', 'forfait')),
    enchere NUMERIC NOT NULL DEFAULT 1500 CHECK (enchere >= 0),
    budget_total NUMERIC NOT NULL DEFAULT 10000 CHECK (budget_total > 0),
    budget_quotidien NUMERIC NOT NULL DEFAULT 5000 CHECK (budget_quotidien > 0),
    budget_consomme NUMERIC NOT NULL DEFAULT 0 CHECK (budget_consomme >= 0),
    date_debut TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_fin TIMESTAMPTZ NOT NULL,
    fuseau TEXT NOT NULL DEFAULT 'Africa/Porto-Novo',
    statut TEXT NOT NULL DEFAULT 'en_moderation' CHECK (statut IN ('brouillon', 'en_moderation', 'approuvee', 'active', 'pause', 'terminee', 'refusee', 'epuisee')),
    priorite INTEGER NOT NULL DEFAULT 1,
    plafond_frequence_par_jour INTEGER NOT NULL DEFAULT 6,
    pacing TEXT NOT NULL DEFAULT 'lisse' CHECK (pacing IN ('lisse', 'accelere')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_ad_campaign_dates CHECK (date_fin > date_debut)
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON public.ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_statut_dates ON public.ad_campaigns(statut, date_debut, date_fin);

-- 4. Table de Ciblage
CREATE TABLE IF NOT EXISTS public.ad_targeting (
    campaign_id UUID PRIMARY KEY REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    pays TEXT[] NOT NULL DEFAULT '{}',
    langues TEXT[] NOT NULL DEFAULT '{"fr"}',
    categories_contenu TEXT[] NOT NULL DEFAULT '{}',
    types_page TEXT[] NOT NULL DEFAULT '{}',
    appareils TEXT[] NOT NULL DEFAULT '{"mobile", "desktop", "tablet"}',
    slots_inclus TEXT[] NOT NULL DEFAULT '{}',
    slots_exclus TEXT[] NOT NULL DEFAULT '{}',
    mots_cles_contexte TEXT[] NOT NULL DEFAULT '{}'
);

-- 5. Table des Créatives (Annonces)
CREATE TABLE IF NOT EXISTS public.ad_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    format TEXT NOT NULL DEFAULT 'responsive',
    titre TEXT NOT NULL,
    texte TEXT,
    bouton TEXT NOT NULL DEFAULT 'En savoir plus',
    media_url TEXT NOT NULL,
    media_variantes JSONB,
    poster_url TEXT,
    destination_type TEXT NOT NULL DEFAULT 'externe' CHECK (destination_type IN ('externe', 'produit', 'offre', 'projet', 'publication', 'competition')),
    destination_ref TEXT,
    destination_url TEXT NOT NULL,
    statut_moderation TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_moderation IN ('en_attente', 'approuvee', 'refusee')),
    motif_refus TEXT,
    ordre INTEGER NOT NULL DEFAULT 0,
    poids_rotation INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_creatives_campaign ON public.ad_creatives(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_moderation ON public.ad_creatives(statut_moderation);

-- 6. Table des Impressions Brutes
CREATE TABLE IF NOT EXISTS public.ad_impressions_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES public.ad_slots(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_hash TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    pays TEXT,
    appareil TEXT,
    page_ref TEXT,
    valide BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_ad_imp_campaign_ts ON public.ad_impressions_raw(campaign_id, ts);
CREATE INDEX IF NOT EXISTS idx_ad_imp_session ON public.ad_impressions_raw(session_hash);

-- 7. Table des Clics Bruts
CREATE TABLE IF NOT EXISTS public.ad_clicks_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impression_id UUID REFERENCES public.ad_impressions_raw(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES public.ad_slots(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_hash TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    valide BOOLEAN NOT NULL DEFAULT true,
    motif_invalide TEXT
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign_ts ON public.ad_clicks_raw(campaign_id, ts);

-- 8. Table des Événements Vidéo
CREATE TABLE IF NOT EXISTS public.ad_video_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    event TEXT NOT NULL CHECK (event IN ('start', 'q25', 'q50', 'q75', 'complete', 'skip', 'mute', 'unmute')),
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ad_video_creative_ts ON public.ad_video_events(creative_id, ts);

-- 9. Table Agrégée Quotidienne
CREATE TABLE IF NOT EXISTS public.ad_stats_daily (
    date DATE NOT NULL,
    campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES public.ad_slots(id) ON DELETE CASCADE,
    impressions INTEGER NOT NULL DEFAULT 0,
    clics INTEGER NOT NULL DEFAULT 0,
    vues_video INTEGER NOT NULL DEFAULT 0,
    depense NUMERIC NOT NULL DEFAULT 0,
    PRIMARY KEY (date, campaign_id, creative_id, slot_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_stats_campaign_date ON public.ad_stats_daily(campaign_id, date);

-- 10. Table des Publicités Maison (House Ads)
CREATE TABLE IF NOT EXISTS public.ad_house_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_code TEXT,
    titre TEXT NOT NULL,
    texte TEXT NOT NULL,
    bouton TEXT NOT NULL DEFAULT 'Découvrir',
    media_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT true,
    poids INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Table des Signalements de Visiteurs
CREATE TABLE IF NOT EXISTS public.ad_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creative_id UUID NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
    signaleur_user_id TEXT,
    motif TEXT NOT NULL,
    details TEXT,
    statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'traite', 'rejete')),
    traite_par TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_reports_statut ON public.ad_reports(statut);

-- 12. Paramètres de la Régie
CREATE TABLE IF NOT EXISTS public.ad_settings (
    cle TEXT PRIMARY KEY,
    valeur JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Journal d'Audit Immuable (Insert-Only)
CREATE TABLE IF NOT EXISTS public.ad_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entite TEXT NOT NULL,
    entite_id TEXT NOT NULL,
    avant JSONB,
    apres JSONB,
    ip_hash TEXT,
    ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_audit_log_ts ON public.ad_audit_log(ts);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) SUR 100% DES TABLES
-- ==============================================================================

ALTER TABLE public.ad_advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_targeting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_clicks_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_video_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_house_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_audit_log ENABLE ROW LEVEL SECURITY;

-- Retirer tous les droits par défaut sur les tables sensibles
REVOKE ALL ON public.ad_impressions_raw FROM anon, authenticated;
REVOKE ALL ON public.ad_clicks_raw FROM anon, authenticated;
REVOKE ALL ON public.ad_video_events FROM anon, authenticated;
REVOKE ALL ON public.ad_audit_log FROM anon, authenticated;

-- Politiques de lecture publique nécessaires
CREATE POLICY "Lecture publique des emplacements actifs"
    ON public.ad_slots FOR SELECT
    USING (actif = true);

CREATE POLICY "Lecture publique des publicités maison actives"
    ON public.ad_house_ads FOR SELECT
    USING (actif = true);

CREATE POLICY "Signalement de pub ouvert à tous"
    ON public.ad_reports FOR INSERT
    WITH CHECK (true);

-- Politiques annonceur authentifié
CREATE POLICY "Annonceur consulte son propre profil"
    ON public.ad_advertisers FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Annonceur crée son profil"
    ON public.ad_advertisers FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Annonceur met à jour son profil"
    ON public.ad_advertisers FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Annonceur consulte ses campagnes"
    ON public.ad_campaigns FOR SELECT
    TO authenticated
    USING (advertiser_id IN (SELECT id FROM public.ad_advertisers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Annonceur gère ses campagnes"
    ON public.ad_campaigns FOR INSERT
    TO authenticated
    WITH CHECK (advertiser_id IN (SELECT id FROM public.ad_advertisers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Annonceur met à jour ses campagnes"
    ON public.ad_campaigns FOR UPDATE
    TO authenticated
    USING (advertiser_id IN (SELECT id FROM public.ad_advertisers WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (advertiser_id IN (SELECT id FROM public.ad_advertisers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Annonceur consulte ses créatives"
    ON public.ad_creatives FOR SELECT
    TO authenticated
    USING (campaign_id IN (
        SELECT c.id FROM public.ad_campaigns c
        JOIN public.ad_advertisers a ON a.id = c.advertiser_id
        WHERE a.user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Annonceur insère ses créatives"
    ON public.ad_creatives FOR INSERT
    TO authenticated
    WITH CHECK (campaign_id IN (
        SELECT c.id FROM public.ad_campaigns c
        JOIN public.ad_advertisers a ON a.id = c.advertiser_id
        WHERE a.user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Annonceur consulte ses stats agrégées"
    ON public.ad_stats_daily FOR SELECT
    TO authenticated
    USING (campaign_id IN (
        SELECT c.id FROM public.ad_campaigns c
        JOIN public.ad_advertisers a ON a.id = c.advertiser_id
        WHERE a.user_id = (SELECT auth.uid())
    ));

-- ==============================================================================
-- FONCTIONS SECURITY DEFINER POUR COMPTAGE ET DÉBIT ATOMIQUE
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ad_record_impression(
    p_campaign_id UUID,
    p_creative_id UUID,
    p_slot_id UUID,
    p_session_hash TEXT,
    p_ip_hash TEXT,
    p_pays TEXT,
    p_appareil TEXT,
    p_cost NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
BEGIN
    -- 1. Insertion brute
    INSERT INTO public.ad_impressions_raw (
        campaign_id, creative_id, slot_id, session_hash, ip_hash, pays, appareil, valide
    ) VALUES (
        p_campaign_id, p_creative_id, p_slot_id, p_session_hash, p_ip_hash, p_pays, p_appareil, true
    );

    -- 2. Débit atomique du budget campagne
    IF p_cost > 0 THEN
        UPDATE public.ad_campaigns
        SET budget_consomme = budget_consomme + p_cost,
            statut = CASE WHEN (budget_consomme + p_cost) >= budget_total THEN 'epuisee' ELSE statut END,
            updated_at = now()
        WHERE id = p_campaign_id AND statut = 'active';
    END IF;

    -- 3. Mise à jour des stats agrégées
    INSERT INTO public.ad_stats_daily (
        date, campaign_id, creative_id, slot_id, impressions, clics, depense
    ) VALUES (
        v_today, p_campaign_id, p_creative_id, p_slot_id, 1, 0, p_cost
    )
    ON CONFLICT (date, campaign_id, creative_id, slot_id)
    DO UPDATE SET
        impressions = public.ad_stats_daily.impressions + 1,
        depense = public.ad_stats_daily.depense + p_cost;

    RETURN true;
END;
$$;

-- Révocation de l'exécution publique directe de la fonction
REVOKE EXECUTE ON FUNCTION public.ad_record_impression FROM public, anon, authenticated;

-- ==============================================================================
-- SEED INITIAL DES SLOTS & PARAMÈTRES
-- ==============================================================================

INSERT INTO public.ad_slots (code, nom, page_type, width_desktop, height_desktop, width_mobile, height_mobile, tarif_cpm, tarif_cpc, ordre)
VALUES
    ('home_leaderboard', 'Bannière Entête Accueil', 'home', 970, 250, 320, 100, 2500, 150, 1),
    ('home_mid', 'Bannière Milieu Accueil', 'home', 728, 90, 320, 50, 1800, 120, 2),
    ('article_top', 'Encart Haut Article', 'article', 728, 90, 320, 50, 2000, 130, 3),
    ('article_inline_1', 'Encart Intérieur Article 1', 'article', 300, 250, 300, 250, 2200, 140, 4),
    ('article_inline_2', 'Encart Intérieur Article 2', 'article', 300, 250, 300, 250, 2000, 130, 5),
    ('article_sidebar', 'Encart Barre Latérale Article', 'article', 300, 600, 300, 250, 2500, 160, 6),
    ('article_end', 'Bannière Bas Article', 'article', 728, 90, 320, 100, 1800, 120, 7),
    ('marketplace_top', 'Encart En-tête Marketplace', 'marketplace', 728, 90, 320, 50, 2000, 130, 8),
    ('jobs_inline', 'Offre Sponsorisée Jobs', 'jobs', 728, 90, 320, 50, 1800, 120, 9),
    ('crowdfunding_inline', 'Campagne Sponsorisée Crowdfunding', 'crowdfunding', 728, 90, 320, 50, 1800, 120, 10),
    ('awards_top', 'Bannière Sommet Africa Awards', 'awards', 970, 250, 320, 100, 3000, 200, 11),
    ('kiosque_inline', 'Bannière Kiosque', 'kiosque', 728, 90, 320, 50, 1500, 100, 12),
    ('wab_feed_native', 'Publication Native Sponsorisée WAB', 'wab', 600, 400, 360, 360, 2500, 180, 13),
    ('wab_feed_carousel', 'Carrousel Sponsorisé WAB', 'wab', 800, 300, 360, 220, 3000, 200, 14),
    ('wab_video_between', 'Vidéo Interstitielle Plein Écran WAB', 'wab_video', 1080, 1920, 360, 640, 4000, 250, 15),
    ('wab_video_overlay', 'Bandeau Superposé Vidéo WAB', 'wab_video', 400, 80, 320, 70, 2000, 130, 16)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ad_settings (cle, valeur)
VALUES
    ('global', '{"kill_switch": false, "maintenance": false, "feed_native_frequency": 6, "min_click_delay_ms": 400, "viewability_ratio": 0.5, "viewability_seconds": 1}'::jsonb),
    ('anti_fraud', '{"max_clicks_per_session_24h": 5, "max_impressions_per_session_24h": 6, "block_suspicious_user_agents": true}'::jsonb)
ON CONFLICT (cle) DO NOTHING;
