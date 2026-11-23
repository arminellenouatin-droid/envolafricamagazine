import { NextRequest, NextResponse } from "next/server";
import { authenticateAgentRequest } from "@/lib/agent-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB, type Article } from "@/lib/db";
import { sanitizeRichText } from "@/lib/rich-text";
import { publishArticleToWab } from "@/lib/article-republication";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "articles:read");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search")?.toLowerCase();
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));
  const status = searchParams.get("status") || "all";

  const client = getSupabaseAdmin();
  if (client) {
    let query = client.from("articles").select("*").order("created_at", { ascending: false }).limit(limit);
    if (category) query = query.eq("category", category);
    if (status === "published") query = query.eq("is_published", true);
    if (status === "draft") query = query.eq("is_published", false);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) {
      console.error("[agent/articles] Erreur Supabase:", error);
      return NextResponse.json({ error: "Impossible de charger les articles" }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: data?.length || 0, articles: data || [] });
  }

  // Fallback local DB
  const db = readDB();
  let articles = db.articles || [];
  if (category) articles = articles.filter((a) => a.category?.toLowerCase() === category.toLowerCase());
  if (status === "published") articles = articles.filter((a) => a.isPublished);
  if (status === "draft") articles = articles.filter((a) => !a.isPublished);
  if (search) articles = articles.filter((a) => a.title.toLowerCase().includes(search) || a.summary.toLowerCase().includes(search));

  return NextResponse.json({
    success: true,
    count: articles.slice(0, limit).length,
    articles: articles.slice(0, limit),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateAgentRequest(req, "articles:write");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      summary,
      content,
      category = "Economie",
      tags = ["Afrique", "Economie"],
      author = "Rédaction Envol Africa",
      authorProfileId,
      image = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
      isPublished = false,
      isFeatured = false,
      publishToWab = false,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({ error: "Le titre de l'article est requis (minimum 3 caractères)." }, { status: 400 });
    }
    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json({ error: "Le contenu de l'article est requis (minimum 10 caractères)." }, { status: 400 });
    }

    const cleanSummary = (summary || content.slice(0, 200)).trim();
    const sanitizedContent = sanitizeRichText(content);
    const now = new Date().toISOString();
    const id = uuidv4();
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${id.slice(0, 4)}`;

    const newArticle: Article = {
      id,
      slug,
      title: title.trim(),
      summary: cleanSummary,
      content: sanitizedContent,
      previewLines: 12,
      category: category.trim(),
      tags: Array.isArray(tags) ? tags.map(String) : [String(tags)],
      author: author.trim(),
      authorId: auth.agentId || "agent-eam",
      authorProfileId,
      image,
      isPublished: Boolean(isPublished),
      isFeatured: Boolean(isFeatured),
      views: 0,
      likes: 0,
      createdAt: now,
      publishedAt: isPublished ? now : undefined,
      language: "fr",
      hasAudio: false,
      readingTime: Math.max(2, Math.ceil(content.split(/\s+/).length / 200)),
    };

    const client = getSupabaseAdmin();
    if (client) {
      const { data, error } = await client.from("articles").insert({
        id: newArticle.id,
        slug: newArticle.slug,
        title: newArticle.title,
        summary: newArticle.summary,
        content: newArticle.content,
        preview_lines: newArticle.previewLines,
        category: newArticle.category,
        tags: newArticle.tags,
        author: newArticle.author,
        author_id: newArticle.authorId,
        author_profile_id: newArticle.authorProfileId,
        image: newArticle.image,
        is_published: newArticle.isPublished,
        is_featured: newArticle.isFeatured,
        views: 0,
        likes: 0,
        created_at: newArticle.createdAt,
        published_at: newArticle.publishedAt,
        language: newArticle.language,
        has_audio: newArticle.hasAudio,
        reading_time: newArticle.readingTime,
      }).select("*").single();

      if (error) {
        console.error("[agent/articles] Erreur insertion Supabase:", error);
        return NextResponse.json({ error: "Échec de l'enregistrement en base" }, { status: 500 });
      }

      let wabResult = null;
      if (publishToWab && newArticle.isPublished) {
        try {
          wabResult = await publishArticleToWab(newArticle, auth.agentId || "admin");
        } catch (e) {
          console.warn("[agent/articles] Publication WAB non effectuée:", e);
        }
      }

      return NextResponse.json({
        success: true,
        message: newArticle.isPublished ? "Article publié avec succès !" : "Brouillon d'article créé avec succès.",
        article: data,
        wabPublished: Boolean(wabResult?.published),
      }, { status: 201 });
    }

    // Fallback DB locale
    const db = readDB();
    db.articles.unshift(newArticle);
    writeDB(db);

    return NextResponse.json({
      success: true,
      message: newArticle.isPublished ? "Article publié avec succès !" : "Brouillon d'article créé avec succès.",
      article: newArticle,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[agent/articles] Erreur interne:", err);
    return NextResponse.json({ error: "Erreur interne lors de la création de l'article" }, { status: 500 });
  }
}
