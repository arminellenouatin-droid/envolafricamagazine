import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: supplier } = await supabase
    .from("marketplace_suppliers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!supplier) {
    return NextResponse.json({ quickReplies: [] });
  }

  const { data: quickReplies, error } = await supabase
    .from("marketplace_quick_replies")
    .select("*")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Impossible de charger les réponses rapides." }, { status: 502 });

  return NextResponse.json({ quickReplies: quickReplies || [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: supplier } = await supabase
    .from("marketplace_suppliers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: "Seuls les vendeurs peuvent créer des réponses rapides." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { title?: string; content?: string } | null;
  if (!body?.title?.trim() || !body?.content?.trim()) {
    return NextResponse.json({ error: "Titre et contenu requis." }, { status: 400 });
  }

  const { data: quickReply, error } = await supabase
    .from("marketplace_quick_replies")
    .insert({
      supplier_id: supplier.id,
      title: body.title.trim().slice(0, 100),
      content: body.content.trim().slice(0, 2000),
    })
    .select("*")
    .single();

  if (error || !quickReply) {
    return NextResponse.json({ error: "Impossible d'enregistrer la réponse rapide." }, { status: 502 });
  }

  return NextResponse.json({ quickReply }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: supplier } = await supabase
    .from("marketplace_suppliers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!supplier) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { error } = await supabase
    .from("marketplace_quick_replies")
    .delete()
    .eq("id", id)
    .eq("supplier_id", supplier.id);

  if (error) return NextResponse.json({ error: "Impossible de supprimer la réponse rapide." }, { status: 502 });

  return NextResponse.json({ success: true });
}
