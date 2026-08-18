import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB, type Article } from "@/lib/db";
import { publishArticleToWab } from "@/lib/article-republication";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyPushSubscribers } from "@/lib/ecosystem-inbox";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin("redacteur");
  if (error) return NextResponse.json({ error }, { status });
  const client = getSupabaseAdmin();
  if (client) {
    const { data, error: queryError } = await client.from("articles").select("*, article_categories(category_id, categories(id,label)), editorial_authors!articles_author_profile_id_fkey(id,name,photo_url,bio,role_label)").order("created_at", { ascending: false });
    if (queryError) return NextResponse.json({ error: "Impossible de charger les articles." }, { status: 503 });
    const articles = (data ?? []).map((row: any) => ({ ...row, categories: Array.isArray(row.article_categories) ? row.article_categories.map((item: any) => item.categories?.label).filter(Boolean) : [row.category].filter(Boolean), categoryIds: Array.isArray(row.article_categories) ? row.article_categories.map((item: any) => item.category_id).filter(Boolean) : [], isPublished: Boolean(row.is_published), isEncrypted: Boolean(row.is_encrypted ?? true), isFeatured: Boolean(row.is_featured), isSentinelle: Boolean(row.is_sentinelle), isEssor: Boolean(row.is_essor), isOmbreDouce: Boolean(row.is_ombre_douce), authorId: row.author_id, authorProfileId: row.author_profile_id, authorProfile: row.editorial_authors || null, categoryId: row.category_id, publishedAt: row.published_at, createdAt: row.created_at }));
    return NextResponse.json({ articles });
  }
  return NextResponse.json({ articles: db!.articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
}

export async function POST(req: NextRequest) {
  const { user, db, error, status } = await getCurrentUserForAdmin("redacteur");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { title, summary, content, category, categoryId, categoryIds, author, authorId, authorProfileId, image, isEncrypted, isPublished, isFeatured, isSentinelle, isEssor, isOmbreDouce, tags } = body;
    if (!title || !content) return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
    const createdAt = new Date().toISOString();
    const published = Boolean(isPublished);
    const newArticle: Article = {
      id: uuidv4(), slug: `${slugify(String(title))}-${Date.now().toString().slice(-4)}`, title: String(title), summary: summary || String(content).substring(0, 180) + "...", content: String(content), previewLines: 12,
      category: category || "Economie", tags: Array.isArray(tags) ? tags.filter(Boolean) : [category || "Economie"], author: author || `${user!.prenom} ${user!.nom}`, authorId: authorId || user!.id,
      image: image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800", isPublished: published, isEncrypted: isEncrypted !== false, isFeatured: Boolean(isFeatured), isSentinelle: Boolean(isSentinelle), isEssor: Boolean(isEssor), isOmbreDouce: Boolean(isOmbreDouce),
      views: 0, likes: 0, createdAt, publishedAt: published ? createdAt : undefined, language: "fr", hasAudio: true, audioUrl: "/audio/sample.mp3", readingTime: Math.ceil(String(content).split(/\s+/).length / 200),
    };
    const client = getSupabaseAdmin();
    if (client) {
      const { data: article, error: insertError } = await client.from("articles").insert({ id: newArticle.id, slug: newArticle.slug, title: newArticle.title, summary: newArticle.summary, content: newArticle.content, preview_lines: newArticle.previewLines, category: newArticle.category, tags: newArticle.tags, author: newArticle.author, author_id: newArticle.authorId, image: newArticle.image, author_profile_id: authorProfileId || null, category_id: categoryId || null, is_published: newArticle.isPublished, is_encrypted: newArticle.isEncrypted, is_featured: newArticle.isFeatured, is_sentinelle: newArticle.isSentinelle, is_essor: newArticle.isEssor, is_ombre_douce: newArticle.isOmbreDouce, views: 0, likes: 0, created_at: newArticle.createdAt, published_at: newArticle.publishedAt ?? null, language: newArticle.language, has_audio: newArticle.hasAudio, audio_url: newArticle.audioUrl, reading_time: newArticle.readingTime }).select("*").single();
      if (insertError) return NextResponse.json({ error: `Impossible d’enregistrer l’article : ${insertError.message}` }, { status: 503 });
      const relationIds = Array.isArray(categoryIds) ? categoryIds.filter(Boolean) : (categoryId ? [categoryId] : []);
      if (relationIds.length) await client.from("article_categories").insert(relationIds.map((category_id: string, index: number) => ({ article_id: newArticle.id, category_id, is_primary: index === 0 })));
      const republication = newArticle.isPublished ? await publishArticleToWab(newArticle, user!.id) : { published: false, reason: "article_draft" };
      const notifications = newArticle.isPublished ? await notifyPushSubscribers({ platform: "magazine", type: "new_article", title: "Nouvel article Envol Africa", body: newArticle.title, link: `/article/${newArticle.slug}`, entityType: "article", entityId: newArticle.id, dedupePrefix: `article:${newArticle.id}` }) : { count: 0 };
      return NextResponse.json({ success: true, article, republication, notifications });
    }
    db!.articles.push(newArticle); writeDB(db!);
    const republication = newArticle.isPublished ? await publishArticleToWab(newArticle, user!.id) : { published: false, reason: "article_draft" };
    const notifications = newArticle.isPublished ? await notifyPushSubscribers({ platform: "magazine", type: "new_article", title: "Nouvel article Envol Africa", body: newArticle.title, link: `/article/${newArticle.slug}`, entityType: "article", entityId: newArticle.id, dedupePrefix: `article:${newArticle.id}` }) : { count: 0 };
    return NextResponse.json({ success: true, article: newArticle, republication, notifications });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur lors de la création" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, db, error, status } = await getCurrentUserForAdmin("redacteur");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const client = getSupabaseAdmin();
    let existing: any;
    if (client) {
      const result = await client.from("articles").select("id, author_id, is_published").eq("id", id).maybeSingle();
      if (result.error) return NextResponse.json({ error: `Lecture impossible : ${result.error.message}` }, { status: 503 });
      existing = result.data;
    } else {
      existing = db!.articles.find((article) => article.id === id);
    }
    if (!existing) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    const isPublishing = updates.isPublished === true && existing.is_published !== true && existing.isPublished !== true;
    if (isPublishing && !["redacteur_chef", "gerant", "admin"].includes(user!.role) && (existing.author_id || existing.authorId) !== user!.id) return NextResponse.json({ error: "Seul un rédacteur en chef peut publier cet article" }, { status: 403 });
    const publishedAt = isPublishing ? new Date().toISOString() : undefined;
    if (client) {
      const patch: Record<string, unknown> = {};
      const fields: Record<string, string> = { title: "title", summary: "summary", content: "content", category: "category", categoryId: "category_id", author: "author", authorId: "author_id", authorProfileId: "author_profile_id", image: "image", tags: "tags", isPublished: "is_published", isEncrypted: "is_encrypted", isFeatured: "is_featured", isSentinelle: "is_sentinelle", isEssor: "is_essor", isOmbreDouce: "is_ombre_douce" };
      for (const [key, column] of Object.entries(fields)) if (Object.prototype.hasOwnProperty.call(updates, key)) patch[column] = updates[key];
      if (publishedAt) patch.published_at = publishedAt;
      const result = await client.from("articles").update(patch).eq("id", id).select("*").single();
      if (result.error) return NextResponse.json({ error: `Impossible d’enregistrer l’article : ${result.error.message}` }, { status: 503 });
      if (Object.prototype.hasOwnProperty.call(updates, "categoryIds") || Object.prototype.hasOwnProperty.call(updates, "categoryId")) { await client.from("article_categories").delete().eq("article_id", id); const relationIds = Array.isArray(updates.categoryIds) ? updates.categoryIds.filter(Boolean) : (updates.categoryId ? [updates.categoryId] : []); if (relationIds.length) await client.from("article_categories").insert(relationIds.map((category_id: string, index: number) => ({ article_id: id, category_id, is_primary: index === 0 }))); }
      const article = result.data ? { ...result.data, isPublished: Boolean(result.data.is_published), isEncrypted: Boolean(result.data.is_encrypted ?? true), isFeatured: Boolean(result.data.is_featured), isSentinelle: Boolean(result.data.is_sentinelle), isEssor: Boolean(result.data.is_essor), isOmbreDouce: Boolean(result.data.is_ombre_douce), authorId: result.data.author_id, publishedAt: result.data.published_at, createdAt: result.data.created_at } : result.data;
      const notifications = isPublishing && article ? await notifyPushSubscribers({ platform: "magazine", type: "new_article", title: "Nouvel article Envol Africa", body: article.title, link: `/article/${article.slug}`, entityType: "article", entityId: article.id, dedupePrefix: `article:${article.id}` }) : { count: 0 };
      return NextResponse.json({ success: true, article, notifications });
    }
    const article = existing as Article;
    const localUpdates = { ...updates } as Partial<Article>;
    if (publishedAt) localUpdates.publishedAt = publishedAt;
    Object.assign(article, localUpdates);
    writeDB(db!);
    const notifications = isPublishing ? await notifyPushSubscribers({ platform: "magazine", type: "new_article", title: "Nouvel article Envol Africa", body: article.title, link: `/article/${article.slug}`, entityType: "article", entityId: article.id, dedupePrefix: `article:${article.id}` }) : { count: 0 };
    return NextResponse.json({ success: true, article, notifications });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur lors de la modification" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { db, error, status } = await getCurrentUserForAdmin("redacteur_chef");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const client = getSupabaseAdmin();
    if (client) {
      const result = await client.from("articles").delete().eq("id", id);
      if (result.error) return NextResponse.json({ error: `Impossible de supprimer l’article : ${result.error.message}` }, { status: 503 });
      return NextResponse.json({ success: true });
    }
    const index = db!.articles.findIndex((article) => article.id === id);
    if (index === -1) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    db!.articles.splice(index, 1); writeDB(db!);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur lors de la suppression" }, { status: 500 });
  }
}
