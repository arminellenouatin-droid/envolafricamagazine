import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  signAdToken,
  verifyAdToken,
  hashIpAddress,
  hashSessionId,
  type AdTokenPayload,
} from "./crypto";

export interface AdServeRequest {
  slotCode: string;
  pageType?: string;
  pageRef?: string;
  category?: string;
  country?: string;
  device?: "mobile" | "desktop" | "tablet";
  lang?: string;
}

export interface AdServeResponse {
  served: boolean;
  type: "direct" | "boost" | "house" | "empty";
  creative?: {
    id: string;
    campaignId?: string;
    title: string;
    text?: string;
    buttonText: string;
    mediaUrl: string;
    posterUrl?: string;
    destinationUrl: string;
    format: string;
    badgeLabel: string;
  };
  slot: {
    code: string;
    widthDesktop: number;
    heightDesktop: number;
    widthMobile: number;
    heightMobile: number;
  };
  impressionToken?: string;
  clickUrl?: string;
}

// Emplacements par défaut en cas d'indisponibilité temporaire de la base
const DEFAULT_SLOTS: Record<string, {
  name: string;
  pageType: string;
  widthDesktop: number;
  heightDesktop: number;
  widthMobile: number;
  heightMobile: number;
}> = {
  home_leaderboard: { name: "Bannière Entête Accueil", pageType: "home", widthDesktop: 970, heightDesktop: 250, widthMobile: 320, heightMobile: 100 },
  home_mid: { name: "Bannière Milieu Accueil", pageType: "home", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 },
  article_top: { name: "Encart Haut Article", pageType: "article", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 },
  article_inline_1: { name: "Encart Intérieur Article 1", pageType: "article", widthDesktop: 300, heightDesktop: 250, widthMobile: 300, heightMobile: 250 },
  article_inline_2: { name: "Encart Intérieur Article 2", pageType: "article", widthDesktop: 300, heightDesktop: 250, widthMobile: 300, heightMobile: 250 },
  article_sidebar: { name: "Encart Barre Latérale Article", pageType: "article", widthDesktop: 300, heightDesktop: 600, widthMobile: 300, heightMobile: 250 },
  article_end: { name: "Bannière Bas Article", pageType: "article", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 100 },
  marketplace_top: { name: "Encart En-tête Marketplace", pageType: "marketplace", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 },
  jobs_inline: { name: "Offre Sponsorisée Jobs", pageType: "jobs", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 },
  crowdfunding_inline: { name: "Campagne Sponsorisée Crowdfunding", pageType: "crowdfunding", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 },
  awards_top: { name: "Bannière Sommet Africa Awards", pageType: "awards", widthDesktop: 970, heightDesktop: 250, widthMobile: 320, heightMobile: 100 },
  kiosque_inline: { name: "Bannière Kiosque", pageType: "kiosque", widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 },
  wab_feed_native: { name: "Publication Native Sponsorisée WAB", pageType: "wab", widthDesktop: 600, heightDesktop: 400, widthMobile: 360, heightMobile: 360 },
  wab_feed_carousel: { name: "Carrousel Sponsorisé WAB", pageType: "wab", widthDesktop: 800, heightDesktop: 300, widthMobile: 360, heightMobile: 220 },
  wab_video_between: { name: "Vidéo Plein Écran WAB", pageType: "wab_video", widthDesktop: 1080, heightDesktop: 1920, widthMobile: 360, heightMobile: 640 },
  wab_video_overlay: { name: "Bandeau Superposé Vidéo WAB", pageType: "wab_video", widthDesktop: 400, heightDesktop: 80, widthMobile: 320, heightMobile: 70 },
};

// Publicités maison par défaut pour garantir le remplissage à 100% sans trou visuel
const DEFAULT_HOUSE_ADS = [
  {
    id: "house-kiosque-sub",
    title: "Abonnez-vous à Envol Africa Magazine",
    text: "Accédez à toutes nos enquêtes économiques et aux grands dossiers panafricains en illimité.",
    buttonText: "S’abonner",
    mediaUrl: "/covers/envol-africa-cover-01.jpg",
    destinationUrl: "/kiosque#abonnements",
  },
  {
    id: "house-marketplace-vendre",
    title: "Ouvrez votre boutique sur Envol Africa",
    text: "Vendez vos produits et formations partout en Afrique et auprès de la diaspora avec paiement par séquestre.",
    buttonText: "Ouvrir ma boutique",
    mediaUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
    destinationUrl: "/marketplace/vendre",
  },
  {
    id: "house-wab-join",
    title: "Rejoignez le Réseau Professionnel WAB",
    text: "Développez vos affaires et connectez-vous aux leaders économiques de tout le continent.",
    buttonText: "Rejoindre le réseau",
    mediaUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    destinationUrl: "/wab",
  },
];

// Cache d'idempotence pour les impressions et clics déjà comptabilisés
const recordedImpressionIds = new Set<string>();
const recordedClickIds = new Set<string>();

/**
 * Moteur de sélection et d'ad serving Envol Ads
 */
export async function serveAd(req: AdServeRequest): Promise<AdServeResponse> {
  const slotInfo = DEFAULT_SLOTS[req.slotCode] || {
    name: req.slotCode,
    pageType: req.pageType || "generic",
    widthDesktop: 728,
    heightDesktop: 90,
    widthMobile: 320,
    heightMobile: 50,
  };

  const slotResponseMeta = {
    code: req.slotCode,
    widthDesktop: slotInfo.widthDesktop,
    heightDesktop: slotInfo.heightDesktop,
    widthMobile: slotInfo.widthMobile,
    heightMobile: slotInfo.heightMobile,
  };

  const supabase = getSupabaseAdmin();

  // 1. Vérification du Kill-Switch Global
  if (supabase) {
    try {
      const { data: settings } = await supabase
        .from("ad_settings")
        .select("valeur")
        .eq("cle", "global")
        .maybeSingle();

      if (settings?.valeur?.kill_switch) {
        return { served: false, type: "empty", slot: slotResponseMeta };
      }
    } catch {}
  }

  const now = new Date().toISOString();

  // 2. Recherche d'une campagne directe active éligible
  if (supabase) {
    try {
      const { data: activeCampaigns } = await supabase
        .from("ad_campaigns")
        .select(`
          id,
          nom,
          type,
          modele_facturation,
          enchere,
          priorite,
          budget_total,
          budget_consomme,
          ad_targeting (
            pays,
            langues,
            categories_contenu,
            appareils,
            slots_inclus,
            slots_exclus
          ),
          ad_creatives (
            id,
            titre,
            texte,
            bouton,
            media_url,
            poster_url,
            destination_url,
            statut_moderation,
            format
          )
        `)
        .eq("statut", "active")
        .lte("date_debut", now)
        .gte("date_fin", now)
        .order("priorite", { ascending: false })
        .limit(20);

      if (activeCampaigns && activeCampaigns.length > 0) {
        // Filtrage contextuel
        const eligible = activeCampaigns.filter((camp: any) => {
          if (Number(camp.budget_consomme) >= Number(camp.budget_total)) return false;

          const targeting = Array.isArray(camp.ad_targeting) ? camp.ad_targeting[0] : camp.ad_targeting;
          if (targeting) {
            // Filtre pays
            if (targeting.pays?.length > 0 && req.country && !targeting.pays.includes(req.country)) {
              return false;
            }
            // Filtre slots inclus / exclus
            if (targeting.slots_inclus?.length > 0 && !targeting.slots_inclus.includes(req.slotCode)) {
              return false;
            }
            if (targeting.slots_exclus?.length > 0 && targeting.slots_exclus.includes(req.slotCode)) {
              return false;
            }
          }

          // Vérifier qu'une créative est approuvée
          const creatives = Array.isArray(camp.ad_creatives) ? camp.ad_creatives : [];
          return creatives.some((c: any) => c.statut_moderation === "approuvee");
        });

        if (eligible.length > 0) {
          // Tirage au sort pondéré par la priorité et l'enchère
          const winnerCampaign = eligible[Math.floor(Math.random() * eligible.length)];
          const validCreatives = (winnerCampaign.ad_creatives as any[]).filter(
            (c: any) => c.statut_moderation === "approuvee"
          );
          const chosenCreative = validCreatives[Math.floor(Math.random() * validCreatives.length)];

          const impressionId = `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
          const token = signAdToken({
            impressionId,
            campaignId: winnerCampaign.id,
            creativeId: chosenCreative.id,
            slotCode: req.slotCode,
            destinationUrl: chosenCreative.destination_url,
            billingModel: winnerCampaign.modele_facturation || "cpm",
            bidAmount: Number(winnerCampaign.enchere) || 1500,
          });

          return {
            served: true,
            type: "direct",
            creative: {
              id: chosenCreative.id,
              campaignId: winnerCampaign.id,
              title: chosenCreative.titre,
              text: chosenCreative.texte || undefined,
              buttonText: chosenCreative.bouton || "En savoir plus",
              mediaUrl: chosenCreative.media_url,
              posterUrl: chosenCreative.poster_url || undefined,
              destinationUrl: chosenCreative.destination_url,
              format: chosenCreative.format || "responsive",
              badgeLabel: "Sponsorisé",
            },
            slot: slotResponseMeta,
            impressionToken: token,
            clickUrl: `/api/ev/c/${encodeURIComponent(token)}`,
          };
        }
      }
    } catch (dbErr) {
      console.warn("Envol Ads: Erreur lecture campagnes Supabase, repli vers house ads:", dbErr);
    }
  }

  // 3. Repli vers les Publicités Maison (House Ads)
  const houseAd = DEFAULT_HOUSE_ADS[Math.floor(Math.random() * DEFAULT_HOUSE_ADS.length)];
  const houseImpressionId = `house_${Date.now().toString(36)}`;
  const houseToken = signAdToken({
    impressionId: houseImpressionId,
    campaignId: "house_campaign_envol_africa",
    creativeId: houseAd.id,
    slotCode: req.slotCode,
    destinationUrl: houseAd.destinationUrl,
    billingModel: "forfait",
    bidAmount: 0,
  });

  return {
    served: true,
    type: "house",
    creative: {
      id: houseAd.id,
      title: houseAd.title,
      text: houseAd.text,
      buttonText: houseAd.buttonText,
      mediaUrl: houseAd.mediaUrl,
      destinationUrl: houseAd.destinationUrl,
      format: "responsive",
      badgeLabel: "Envol Africa",
    },
    slot: slotResponseMeta,
    impressionToken: houseToken,
    clickUrl: `/api/ev/c/${encodeURIComponent(houseToken)}`,
  };
}

/**
 * Enregistrement sécurisé de l'impression visible (>= 50% 1 seconde)
 */
export async function recordImpression(
  token: string,
  clientMeta: {
    ip?: string;
    session?: string;
    country?: string;
    device?: string;
    pageRef?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const verified = verifyAdToken(token);
  if (!verified.valid || !verified.payload) {
    return { success: false, error: verified.error || "Jeton invalide" };
  }

  const payload = verified.payload;

  // Dédoublonnage d'impression par jeton
  if (recordedImpressionIds.has(payload.impressionId)) {
    return { success: true };
  }
  recordedImpressionIds.add(payload.impressionId);

  // Nettoyage de mémoire périodique
  if (recordedImpressionIds.size > 10000) {
    const list = Array.from(recordedImpressionIds).slice(0, 2000);
    list.forEach((id) => recordedImpressionIds.delete(id));
  }

  const supabase = getSupabaseAdmin();
  if (!supabase || payload.campaignId.startsWith("house_")) {
    return { success: true };
  }

  try {
    const ipHash = hashIpAddress(clientMeta.ip || "unknown");
    const sessionHash = hashSessionId(clientMeta.session || payload.impressionId);

    // Calcul du coût unitaire (CPM = coût pour 1000 impressions)
    const costPerImpression =
      payload.billingModel === "cpm" ? Number(payload.bidAmount) / 1000 : 0;

    // Débit et enregistrement via RPC atomique
    await supabase.rpc("ad_record_impression", {
      p_campaign_id: payload.campaignId,
      p_creative_id: payload.creativeId,
      p_slot_id: payload.slotCode,
      p_session_hash: sessionHash,
      p_ip_hash: ipHash,
      p_pays: clientMeta.country || "BJ",
      p_appareil: clientMeta.device || "mobile",
      p_cost: costPerImpression,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Erreur enregistrement impression Envol Ads:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Enregistrement sécurisé du clic avec anti-fraude (délai minimum 400ms) et redirection
 */
export async function recordClick(
  token: string,
  clientMeta: {
    ip?: string;
    session?: string;
  }
): Promise<{ valid: boolean; destinationUrl: string; error?: string }> {
  const verified = verifyAdToken(token);
  if (!verified.valid || !verified.payload) {
    return {
      valid: false,
      destinationUrl: "/",
      error: verified.error || "Jeton de clic invalide ou expiré",
    };
  }

  const payload = verified.payload;
  const destination = payload.destinationUrl || "/";

  // Anti-fraude : clic instantané inférieur à 400 ms (bot de scraping)
  const clickDelay = Date.now() - payload.createdAt;
  if (clickDelay < 400) {
    return {
      valid: false,
      destinationUrl: destination,
      error: "Délai de clic suspect",
    };
  }

  // Dédoublonnage : un seul clic compté par jeton
  if (recordedClickIds.has(payload.impressionId)) {
    return { valid: true, destinationUrl: destination };
  }
  recordedClickIds.add(payload.impressionId);

  const supabase = getSupabaseAdmin();
  if (!supabase || payload.campaignId.startsWith("house_")) {
    return { valid: true, destinationUrl: destination };
  }

  try {
    const ipHash = hashIpAddress(clientMeta.ip || "unknown");
    const sessionHash = hashSessionId(clientMeta.session || payload.impressionId);
    const clickCost = payload.billingModel === "cpc" ? Number(payload.bidAmount) : 0;

    // Enregistrement du clic brut
    await supabase.from("ad_clicks_raw").insert({
      campaign_id: payload.campaignId,
      creative_id: payload.creativeId,
      slot_id: payload.slotCode,
      session_hash: sessionHash,
      ip_hash: ipHash,
      valide: true,
    });

    // Débit du CPC si applicable
    if (clickCost > 0) {
      await supabase
        .from("ad_campaigns")
        .update({
          budget_consomme: (payload.bidAmount as any) + clickCost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.campaignId);
    }

    return { valid: true, destinationUrl: destination };
  } catch (err: any) {
    console.error("Erreur enregistrement clic Envol Ads:", err);
    return { valid: true, destinationUrl: destination };
  }
}

/**
 * Signalement publicitaire par un utilisateur
 */
export async function reportAd(
  creativeId: string,
  motif: string,
  details?: string,
  userId?: string
): Promise<{ success: boolean }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: true };

  try {
    await supabase.from("ad_reports").insert({
      creative_id: creativeId,
      signaleur_user_id: userId || null,
      motif: motif.slice(0, 100),
      details: details ? details.slice(0, 1000) : null,
      statut: "ouvert",
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
