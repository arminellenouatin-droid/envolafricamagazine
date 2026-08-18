import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { user, db, error, status } = await getCurrentUserForAdmin('redacteur');
  if (error) return NextResponse.json({ error }, { status });
  const client = getSupabaseAdmin();
  if (client) {
    const { data, error: queryError } = await client.from("articles").select("*").order("created_at", { ascending: false });
    if (queryError) return NextResponse.json({ error: "Impossible de charger les articles." }, { status: 503 });
    return NextResponse.json({ articles: data ?? [] });
  }
  return NextResponse.json({ articles: db!.articles.sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
}

export async function POST(req: NextRequest) {
  const { user, db, error, status } = await getCurrentUserForAdmin('redacteur');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { title, summary, content, category, author, image, isPublished, isFeatured, isSentinelle, isEssor, isOmbreDouce, tags } = body;
    if (!title || !content) return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') + "-" + Date.now().toString().slice(-4);
    const client = getSupabaseAdmin();
    const newArticle = {
      id: uuidv4(),
      slug,
      title,
      summary: summary || content.substring(0,180)+"...",
      content,
      previewLines: 12,
      category: category || "Economie",
      tags: tags || [category],
      author: author || `${user!.prenom} ${user!.nom}`,
      authorId: user!.id,
      image: image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      isPublished: isPublished ?? false,
      isFeatured: isFeatured ?? false,
      isSentinelle: isSentinelle ?? false,
      isEssor: isEssor ?? false,
      isOmbreDouce: isOmbreDouce ?? false,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      publishedAt: isPublished ? new Date().toISOString() : undefined,
      language: "fr",
      hasAudio: true,
      audioUrl: "/audio/sample.mp3",
      readingTime: Math.ceil(content.split(' ').length / 200),
    };
    if (client) {
      const { data: article, error: insertError } = await client.from("articles").insert({ id: newArticle.id, slug: newArticle.slug, title: newArticle.title, summary: newArticle.summary, content: newArticle.content, preview_lines: newArticle.previewLines, category: newArticle.category, tags: newArticle.tags, author: newArticle.author, author_id: newArticle.authorId, image: newArticle.image, is_published: newArticle.isPublished, is_featured: newArticle.isFeatured, is_sentinelle: newArticle.isSentinelle, is_essor: newArticle.isEssor, is_ombre_douce: newArticle.isOmbreDouce, views: 0, likes: 0, created_at: newArticle.createdAt, published_at: newArticle.publishedAt ?? null, language: newArticle.language, has_audio: newArticle.hasAudio, audio_url: newArticle.audioUrl, reading_time: newArticle.readingTime }).select("*").single();
      if (insertError) return NextResponse.json({ error: "Impossible d’enregistrer l’article dans Supabase." }, { status: 503 });
      return NextResponse.json({ success: true, article });
    }
    db!.articles.push(newArticle as any); writeDB(db!);
    return NextResponse.json({ success: true, article: newArticle });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, db, error, status } = await getCurrentUserForAdmin('redacteur');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const article = db!.articles.find(a=>a.id===id);
    if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    // Seul redacteur_chef peut publier, redacteur peut éditer ses brouillons
    if (updates.isPublished && !['redacteur_chef','gerant','admin'].includes(user!.role) && article.authorId !== user!.id) {
      return NextResponse.json({ error: "Seul rédacteur-chef peut publier" }, { status: 403 });
    }
    Object.assign(article, updates);
    if (updates.isPublished && !article.publishedAt) article.publishedAt = new Date().toISOString();
    writeDB(db!);
    return NextResponse.json({ success: true, article });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, db, error, status } = await getCurrentUserForAdmin('redacteur_chef');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const idx = db!.articles.findIndex(a=>a.id===id);
    if (idx===-1) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    db!.articles.splice(idx,1);
    writeDB(db!);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
