import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        advertiser: { nom: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email },
        campaigns: [],
        stats: { totalSpent: 0, totalImpressions: 0, totalClicks: 0, activeCampaigns: 0 },
      });
    }

    // 1. Profil annonceur
    let { data: advertiser } = await supabase
      .from("ad_advertisers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!advertiser) {
      const { data: newAdv } = await supabase
        .from("ad_advertisers")
        .insert({
          user_id: user.id,
          nom: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email?.split("@")[0] || "Annonceur",
          email_facturation: user.email || "",
          pays: user.country || "BJ",
        })
        .select("*")
        .single();
      advertiser = newAdv;
    }

    if (!advertiser) {
      return NextResponse.json({ campaigns: [], stats: { totalSpent: 0, totalImpressions: 0, totalClicks: 0, activeCampaigns: 0 } });
    }

    // 2. Campagnes de l'annonceur
    const { data: campaigns, error: campErr } = await supabase
      .from("ad_campaigns")
      .select(`
        id,
        nom,
        objectif,
        type,
        modele_facturation,
        enchere,
        budget_total,
        budget_quotidien,
        budget_consomme,
        date_debut,
        date_fin,
        statut,
        priorite,
        created_at,
        ad_creatives (
          id,
          titre,
          texte,
          bouton,
          media_url,
          destination_url,
          statut_moderation,
          motif_refus
        )
      `)
      .eq("advertiser_id", advertiser.id)
      .order("created_at", { ascending: false });

    if (campErr) {
      return NextResponse.json({ error: campErr.message }, { status: 500 });
    }

    const list = campaigns || [];
    const totalSpent = list.reduce((acc, c) => acc + (Number(c.budget_consomme) || 0), 0);
    const activeCampaigns = list.filter((c) => c.statut === "active").length;

    return NextResponse.json({
      advertiser,
      campaigns: list,
      stats: {
        totalSpent,
        totalImpressions: Math.round(totalSpent * 0.8), // Métrique indicative
        totalClicks: Math.round(totalSpent * 0.04),
        activeCampaigns,
      },
    });
  } catch (err: any) {
    console.error("Erreur récupération campagnes:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.nom || !body.budgetTotal || !body.creative?.titre || !body.creative?.destinationUrl) {
      return NextResponse.json({ error: "Données de campagne incomplètes" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
    }

    // 1. Récupération ou création annonceur
    let { data: advertiser } = await supabase
      .from("ad_advertisers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!advertiser) {
      const { data: createdAdv } = await supabase
        .from("ad_advertisers")
        .insert({
          user_id: user.id,
          nom: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email?.split("@")[0] || "Annonceur",
          email_facturation: user.email || "",
          pays: user.country || "BJ",
        })
        .select("id")
        .single();
      advertiser = createdAdv;
    }

    if (!advertiser) {
      return NextResponse.json({ error: "Impossible d'initialiser le compte annonceur" }, { status: 500 });
    }

    const now = new Date();
    const dateDebut = body.dateDebut ? new Date(body.dateDebut) : now;
    const dateFin = body.dateFin ? new Date(body.dateFin) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (dateFin <= dateDebut) {
      return NextResponse.json({ error: "La date de fin doit être postérieure à la date de début" }, { status: 400 });
    }

    // 2. Création de la campagne
    const { data: campaign, error: campErr } = await supabase
      .from("ad_campaigns")
      .insert({
        advertiser_id: advertiser.id,
        nom: String(body.nom).trim().slice(0, 150),
        objectif: body.objectif || "notoriete",
        type: body.type || "display",
        modele_facturation: body.modeleFacturation || "cpm",
        enchere: Number(body.enchere) || 1500,
        budget_total: Number(body.budgetTotal) || 10000,
        budget_quotidien: Number(body.budgetQuotidien) || (Number(body.budgetTotal) || 10000) / 2,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        statut: "en_moderation", // Soumission obligatoire en modération
        priorite: 1,
      })
      .select("*")
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: campErr?.message || "Échec création campagne" }, { status: 500 });
    }

    // 3. Création du ciblage
    if (body.targeting) {
      await supabase.from("ad_targeting").insert({
        campaign_id: campaign.id,
        pays: Array.isArray(body.targeting.pays) ? body.targeting.pays : [],
        categories_contenu: Array.isArray(body.targeting.categories) ? body.targeting.categories : [],
        appareils: Array.isArray(body.targeting.appareils) ? body.targeting.appareils : ["mobile", "desktop"],
      });
    }

    // 4. Création de la créative
    const creative = body.creative;
    const { data: createdCreative, error: creatErr } = await supabase
      .from("ad_creatives")
      .insert({
        campaign_id: campaign.id,
        titre: String(creative.titre).trim().slice(0, 150),
        texte: creative.texte ? String(creative.texte).trim().slice(0, 500) : null,
        bouton: creative.bouton || "En savoir plus",
        media_url: creative.mediaUrl || "/covers/envol-africa-cover-01.jpg",
        destination_url: creative.destinationUrl,
        statut_moderation: "en_attente",
      })
      .select("*")
      .single();

    if (creatErr) {
      console.warn("Avertissement créative ad:", creatErr);
    }

    // 5. Journalisation d'audit
    try {
      await supabase.from("ad_audit_log").insert({
        actor_id: user.id,
        action: "CREATE_CAMPAIGN",
        entite: "ad_campaigns",
        entite_id: campaign.id,
        apres: { campaign, creative: createdCreative },
      });
    } catch {
      // Silencieux
    }

    return NextResponse.json({
      success: true,
      campaign: { ...campaign, ad_creatives: createdCreative ? [createdCreative] : [] },
      message: "Campagne créée avec succès et soumise en modération.",
    });
  } catch (err: any) {
    console.error("Erreur création campagne:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
