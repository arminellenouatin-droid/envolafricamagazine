import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Base indisponible" }, { status: 503 });
    }

    const isAdmin = ["admin", "gerant", "redacteur_chef"].includes(user.role);

    // Récupération de la campagne avec relations
    const { data: campaign, error: campErr } = await supabase
      .from("ad_campaigns")
      .select(`
        *,
        ad_advertisers ( id, user_id, nom, email_facturation, entreprise ),
        ad_targeting ( * ),
        ad_creatives ( * )
      `)
      .eq("id", id)
      .maybeSingle();

    if (campErr || !campaign) {
      return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
    }

    // Contrôle d'accès strict (Anti-IDOR)
    const isOwner = campaign.ad_advertisers?.user_id === user.id;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Récupération des impressions quotidiennes
    const { data: dailyStats } = await supabase
      .from("ad_impressions_daily")
      .select("*")
      .eq("campaign_id", id)
      .order("date_jour", { ascending: false })
      .limit(30);

    return NextResponse.json({
      campaign,
      dailyStats: dailyStats || [],
    });
  } catch (err: any) {
    console.error("Erreur lecture campagne [id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || !id) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Base indisponible" }, { status: 503 });
    }

    const isAdmin = ["admin", "gerant", "redacteur_chef"].includes(user.role);

    // Vérifier propriétaire
    const { data: campaign } = await supabase
      .from("ad_campaigns")
      .select("*, ad_advertisers(user_id)")
      .eq("id", id)
      .maybeSingle();

    if (!campaign) {
      return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
    }

    const isOwner = campaign.ad_advertisers?.user_id === user.id;
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const allowedUpdates: Record<string, any> = {};

    // Gestion du changement de statut (pause / reprise / fin)
    if (body.statut) {
      const validStatuses = ["active", "en_pause", "terminee"];
      if (!validStatuses.includes(body.statut) && !isAdmin) {
        return NextResponse.json({ error: "Statut non autorisé" }, { status: 400 });
      }

      // Un utilisateur normal ne peut pas forcer "active" si la campagne est encore "en_moderation" ou "refusee"
      if (!isAdmin && body.statut === "active" && ["en_moderation", "refusee"].includes(campaign.statut)) {
        return NextResponse.json({
          error: "La campagne doit être validée par la modération avant activation",
        }, { status: 400 });
      }

      allowedUpdates.statut = body.statut;
    }

    // Mise à jour éventuelle du nom ou du budget quotidien
    if (typeof body.nom === "string" && body.nom.trim().length > 0) {
      allowedUpdates.nom = body.nom.trim().slice(0, 150);
    }
    if (typeof body.budget_quotidien === "number" && body.budget_quotidien > 0) {
      allowedUpdates.budget_quotidien = body.budget_quotidien;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ message: "Aucune modification demandée" }, { status: 200 });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("ad_campaigns")
      .update(allowedUpdates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Journal d'audit
    try {
      await supabase.from("ad_audit_log").insert({
        actor_id: user.id,
        action: "UPDATE_CAMPAIGN",
        entite: "ad_campaigns",
        entite_id: id,
        avant: campaign,
        apres: updated,
      });
    } catch {
      // Silencieux
    }

    return NextResponse.json({
      success: true,
      campaign: updated,
      message: "Campagne mise à jour avec succès",
    });
  } catch (err: any) {
    console.error("Erreur mise à jour campagne [id]:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
