import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { mapCrowdProject } from "@/lib/crowdfunding-supabase";

const REVIEWABLE_STATUSES = ["en_attente_validation", "draft", "en_cours", "objectif_atteint", "objectif_depasse", "termine_sans_objectif", "cloture", "en_litige"];

export async function GET() {
  const { error, status } = await getCurrentUserForAdmin("gerant");
  if (error) return NextResponse.json({ error }, { status });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase est requis pour administrer Crowdfunding." }, { status: 503 });
  const { data, error: queryError } = await supabase.from("crowdfunding_projects").select("*").order("created_at", { ascending: false });
  if (queryError) return NextResponse.json({ error: queryError.message }, { status: 500 });
  return NextResponse.json({ projets: (data || []).map((row) => mapCrowdProject(row as Record<string, unknown>)) });
}

export async function PUT(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const projectId = String(body.projectId || "");
    const action = String(body.action || "");
    if (!projectId || !["approve", "reject", "draft"].includes(action)) return NextResponse.json({ error: "Projet et action valides requis." }, { status: 400 });
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Supabase est requis pour administrer Crowdfunding." }, { status: 503 });
    const nextStatus = action === "approve" ? "en_cours" : action === "reject" ? "en_litige" : "draft";
    const { data, error: updateError } = await supabase.from("crowdfunding_projects").update({ statut: nextStatus }).eq("id", projectId).in("statut", REVIEWABLE_STATUSES).select("*").maybeSingle();
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Projet introuvable ou statut non modifiable." }, { status: 404 });
    return NextResponse.json({ success: true, action, changedBy: user?.id, projet: mapCrowdProject(data as Record<string, unknown>) });
  } catch {
    return NextResponse.json({ error: "Requête administrative invalide." }, { status: 400 });
  }
}
