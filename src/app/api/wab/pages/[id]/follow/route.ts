/*
 * Direction Atelier de preuve WAB : abonnement de page explicite.
 * Toute mutation est authentifiée côté serveur et limitée à la page active ciblée.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  const { id } = await params;
  if (!user) return NextResponse.json({ following: false });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ following: false });
  const { data, error } = await supabase.from("wab_page_followers").select("page_id").eq("page_id", id).eq("follower_user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "État d’abonnement indisponible." }, { status: 500 });
  return NextResponse.json({ following: Boolean(data) });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour s’abonner à une page." }, { status: 401 });
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Le service WAB est temporairement indisponible." }, { status: 503 });

  const { data: page, error: pageError } = await supabase.from("wab_pages").select("id,status").eq("id", id).eq("status", "active").maybeSingle();
  if (pageError) return NextResponse.json({ error: "Page indisponible." }, { status: 500 });
  if (!page) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });

  const { data: existing, error: lookupError } = await supabase.from("wab_page_followers").select("page_id").eq("page_id", id).eq("follower_user_id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Impossible de vérifier l’abonnement." }, { status: 500 });
  if (existing) {
    const { error } = await supabase.from("wab_page_followers").delete().eq("page_id", id).eq("follower_user_id", user.id);
    if (error) return NextResponse.json({ error: "Impossible de se désabonner." }, { status: 500 });
    return NextResponse.json({ following: false });
  }

  const { error } = await supabase.from("wab_page_followers").insert({ page_id: id, follower_user_id: user.id });
  if (error) return NextResponse.json({ error: "Impossible de s’abonner à cette page." }, { status: 500 });
  return NextResponse.json({ following: true });
}
