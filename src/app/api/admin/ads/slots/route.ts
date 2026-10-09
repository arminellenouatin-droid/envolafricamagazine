import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 503 });

  try {
    const { data: slots, error } = await supabase
      .from("ad_slots")
      .select("*")
      .order("code", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ slots: slots || [] });
  } catch (err: any) {
    console.error("Erreur récupération slots:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const access = await getCurrentUserForAdmin("gerant");
  if (access.error || !access.user) return NextResponse.json({ error: access.error || "Non autorisé" }, { status: access.status || 401 });
  const adminUser = access.user;

  const body = await req.json().catch(() => null);
  if (!body || !body.slotId) {
    return NextResponse.json({ error: "slotId requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Base indisponible" }, { status: 503 });

  try {
    const { data: currentSlot, error: fetchErr } = await supabase
      .from("ad_slots")
      .select("*")
      .eq("id", body.slotId)
      .single();

    if (fetchErr || !currentSlot) {
      return NextResponse.json({ error: "Slot introuvable" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (typeof body.actif === "boolean") updates.actif = body.actif;
    if (typeof body.cpm_plancher === "number" && body.cpm_plancher >= 0) updates.cpm_plancher = body.cpm_plancher;
    if (typeof body.cpc_plancher === "number" && body.cpc_plancher >= 0) updates.cpc_plancher = body.cpc_plancher;
    if (typeof body.cpd_fixe === "number" && body.cpd_fixe >= 0) updates.cpd_fixe = body.cpd_fixe;
    if (typeof body.priorite === "number") updates.priorite = body.priorite;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "Aucune mise à jour demandée" });
    }

    const { data: updatedSlot, error: updateErr } = await supabase
      .from("ad_slots")
      .update(updates)
      .eq("id", body.slotId)
      .select("*")
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    try {
      await supabase.from("ad_audit_log").insert({
        actor_id: adminUser.id,
        action: "UPDATE_SLOT_CONFIG",
        entite: "ad_slots",
        entite_id: body.slotId,
        avant: currentSlot,
        apres: updatedSlot,
      });
    } catch {
      // Silencieux
    }

    return NextResponse.json({
      success: true,
      slot: updatedSlot,
      message: "Slot publicitaire mis à jour avec succès",
    });
  } catch (err: any) {
    console.error("Erreur modification slot:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
