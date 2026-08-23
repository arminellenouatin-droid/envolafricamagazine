import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readDB, writeDB } from "@/lib/db";
import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = await request.json().catch(() => ({}));
  const kind = body?.kind === "like" ? "like" : body?.kind === "view" ? "view" : null;
  if (!kind) return NextResponse.json({ error: "Engagement invalide." }, { status: 400 });

  if (kind === "like" && !(await getCurrentUserFromCookie())) {
    return NextResponse.json({ error: "Connectez-vous pour aimer cet article." }, { status: 401 });
  }

  const client = getSupabaseAdmin();
  if (client) {
    const { data: article, error: readError } = await client.from("articles").select("id,views,likes").eq("slug", slug).maybeSingle();
    if (readError) return NextResponse.json({ error: "Engagement indisponible." }, { status: 503 });
    if (!article) return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
    const field = kind === "like" ? "likes" : "views";
    const nextValue = Number(article[field] ?? 0) + 1;
    const { data: updated, error: updateError } = await client.from("articles").update({ [field]: nextValue }).eq("id", article.id).select("views,likes").single();
    if (updateError) return NextResponse.json({ error: "Impossible d’enregistrer l’engagement." }, { status: 503 });
    return NextResponse.json({ views: Number(updated.views ?? 0), likes: Number(updated.likes ?? 0) });
  }

  if (isProductionRuntime()) return NextResponse.json({ error: "Base de production non configurée." }, { status: 503 });
  const db = readDB();
  const article = db.articles.find((item) => item.slug === slug);
  if (!article) return NextResponse.json({ error: "Article introuvable." }, { status: 404 });
  if (kind === "like") article.likes = Number(article.likes ?? 0) + 1;
  else article.views = Number(article.views ?? 0) + 1;
  writeDB(db);
  return NextResponse.json({ views: article.views, likes: article.likes });
}
