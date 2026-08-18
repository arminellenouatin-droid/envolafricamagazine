import type { Article } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getWabProfileByUserId, upsertWabProfile } from "@/lib/wab-supabase";

export async function publishArticleToWab(article: Article, authorUserId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, published: false as const, reason: "supabase_not_configured" as const };

  let profile = (await getWabProfileByUserId(authorUserId)).profile;
  if (!profile) {
    const created = await upsertWabProfile(authorUserId, {
      headline: article.author || "Rédaction Envol Africa Magazine",
      about: "Articles, analyses et opportunités publiés par Envol Africa Magazine.",
      companyName: "Envol Africa Magazine",
      countryCode: "BJ",
      avatarUrl: undefined,
    });
    profile = created.profile;
  }
  if (!profile) return { configured: true as const, published: false as const, reason: "profile_not_found" as const };

  const sourceUrl = `/article/${article.slug}`;
  const sourceTitle = article.title;
  const payload = {
    author_id: profile.id,
    content: `${sourceTitle}\n\n${article.summary || article.content.slice(0, 280)}\n\nLire l’article complet :\n${sourceUrl}`,
    content_type: "document",
    media: article.image ? [{ path: article.image, mimeType: "image/*", name: sourceTitle }] : [],
    moderation_status: "published",
    is_boosted: false,
    source_type: "magazine_article",
    source_id: article.id,
    source_url: sourceUrl,
    source_title: sourceTitle,
  };

  const { data: existing } = await supabase.from("wab_posts").select("id").eq("source_type", "magazine_article").eq("source_id", article.id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("wab_posts").update(payload).eq("id", existing.id);
    return { configured: true as const, published: !error, postId: existing.id, updated: true as const };
  }
  const { data: created, error } = await supabase.from("wab_posts").insert(payload).select("id").single();
  return { configured: true as const, published: !error, postId: created?.id, updated: false as const };
}
