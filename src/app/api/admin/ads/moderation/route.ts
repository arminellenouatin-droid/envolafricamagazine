import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";

  try {
    let query = supabase
      .from("ad_creatives")
      .select(`
        id,
        titre,
        texte,
        bouton,
        media_url,
        destination_url,
        statut_moderation,
        motif_refus,
        modere_at,
        created_at,
        ad_campaigns (
          id,
          nom,
          objectif,
          type,
          budget_total,
          statut,
          ad_advertisers (
            nom,
            email_facturation,
            entreprise
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("statut_moderation", status);
    }

    const { data: creatives, error } = await query.limit(100);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ creatives: creatives || [] });
  } catch (err: any) {
    console.error("Erreur listing modération créatives:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error || !access.user) return NextResponse.json({ error: access.error || "Non autorisé" }, { status: access.status || 401 });
  const adminUser = access.user;

  const body = await req.json().catch(() => null);
  if (!body || !body.creativeId || !["approve", "reject", "suspend"].includes(body.action)) {
    return NextResponse.json({ error: "Paramètres de modération invalides" }, { status: 400 });
  }

  if (body.action === "reject" && (!body.motif || String(body.motif).trim().length === 0)) {
    return NextResponse.json({ error: "Un motif de refus motivé est obligatoire" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 503 });

  try {
    // 1. Lire la créative
    const { data: creative, error: fetchErr } = await supabase
      .from("ad_creatives")
      .select("*, ad_campaigns(id, statut)")
      .eq("id", body.creativeId)
      .single();

    if (fetchErr || !creative) {
      return NextResponse.json({ error: "Créative introuvable" }, { status: 404 });
    }

    const now = new Date().toISOString();
    let newStatus: "approuvee" | "refusee" | "suspendue" = "approuvee";
    if (body.action === "reject") newStatus = "refusee";
    if (body.action === "suspend") newStatus = "suspendue";

    // 2. Mettre à jour la créative
    const { data: updatedCreative, error: updateErr } = await supabase
      .from("ad_creatives")
      .update({
        statut_moderation: newStatus,
        motif_refus: body.action === "reject" ? String(body.motif).trim() : null,
        modere_par: adminUser.id,
        modere_at: now,
      })
      .eq("id", body.creativeId)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Mettre à jour la campagne parente
    const campaignId = creative.campaign_id;
    if (campaignId) {
      let newCampaignStatus = creative.ad_campaigns?.statut;
      if (body.action === "approve") {
        newCampaignStatus = "active";
      } else if (body.action === "reject") {
        newCampaignStatus = "refusee";
      } else if (body.action === "suspend") {
        newCampaignStatus = "en_pause";
      }

      await supabase
        .from("ad_campaigns")
        .update({ statut: newCampaignStatus })
        .eq("id", campaignId);
    }

    // 4. Audit Log
    try {
      await supabase.from("ad_audit_log").insert({
        actor_id: adminUser.id,
        action: `MODERATE_CREATIVE_${body.action.toUpperCase()}`,
        entite: "ad_creatives",
        entite_id: body.creativeId,
        avant: creative,
        apres: updatedCreative,
      });
    } catch {
      // Silencieux
    }

    return NextResponse.json({
      success: true,
      creative: updatedCreative,
      message: `Créative ${newStatus === "approuvee" ? "approuvée avec succès" : newStatus === "refusee" ? "refusée" : "suspendue"}.`,
    });
  } catch (err: any) {
    console.error("Erreur modération créative:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
