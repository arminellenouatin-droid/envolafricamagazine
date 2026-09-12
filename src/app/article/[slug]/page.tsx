import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { findArticleBySlug, findEditorialAuthorById, listPublishedArticles } from "@/lib/core-db";
import ArticleActions from "@/components/ArticleActions";
import LocalizedArticleExperience from "@/components/LocalizedArticleExperience";
import ArticleRecommendations from "@/components/ArticleRecommendations";
import { absoluteSiteUrl, metadataText } from "@/lib/site-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticleBySlug(slug).catch(() => null);
  if (!article?.isPublished) return { title: "Article introuvable | Envol Africa", robots: { index: false, follow: false } };

  const title = `${article.title} | Envol Africa Magazine`;
  const description = metadataText(article.summary || article.content);
  const image = absoluteSiteUrl(article.image);
  const canonical = `/article/${encodeURIComponent(article.slug)}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      siteName: "Envol Africa Magazine",
      publishedTime: article.publishedAt,
      authors: article.author ? [article.author] : undefined,
      images: [{ url: image, alt: article.title }],
      ...(article.isVideo && article.videoUrl ? { videos: [{ url: absoluteSiteUrl(article.videoUrl), type: "video/mp4" }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

async function getIsSubscribed() {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return false;
    if (!user) return false;
    if (user.role==="admin" || user.role==="gerant" || user.role==="redacteur_chef") return true;
    if (user.subscription?.status==="active") {
      const end = new Date(user.subscription.endDate);
      if (end > new Date()) return true;
    }
    return false;
  } catch { return false; }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [article, articles] = await Promise.all([findArticleBySlug(slug), listPublishedArticles()]);
  if (!article?.isPublished) return notFound();
  const [editorialAuthor, isSubscriber, preferredLanguage] = await Promise.all([findEditorialAuthorById(article.authorProfileId), getIsSubscribed(), (async () => { const user = await getCurrentUserFromCookie(); return user?.lang || "fr"; })()]);

  const articleCategorySet = new Set(article.categories?.length ? article.categories : [article.category]);
  const related = articles.filter((a) => a.id !== article.id && (a.categories || [a.category]).some((category) => articleCategorySet.has(category))).slice(0, 3);
  const mostRead = [...articles].filter((a) => a.id !== article.id).sort((a, b) => b.views - a.views).slice(0, 6);
  const canReadFullContent = !article.isEncrypted || isSubscriber;
  const readerArticle = canReadFullContent ? article : {
    ...article,
    content: "",
    translations: Object.fromEntries(Object.entries(article.translations || {}).map(([language, translation]) => [language, { ...translation, content: "" }]))
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <main className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-12">
        <article className="mx-auto grid max-w-[980px] items-start gap-8 lg:grid-cols-[190px_minmax(0,720px)] lg:gap-10">
          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <div className="border-t-4 border-[#9e001f] pt-4">
              <img src={editorialAuthor?.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=320"} alt={editorialAuthor?.name || article.author} className="aspect-[3/4] w-full rounded-xl object-cover shadow-md" />
              <p className="mt-4 text-[15px] font-bold leading-tight text-[#1b1c1c]">{editorialAuthor?.name || article.author}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#9e001f]">{editorialAuthor?.roleLabel || "Rédacteur"}</p>
              <p className="mt-3 text-[12px] leading-5 text-[#5f5e5e]">{editorialAuthor?.bio || "Rédacteur de la rédaction Envol Africa."}</p>
            </div>
          </aside>
          <div className="min-w-0">
          <header className="mb-8">
            <div className="flex gap-2 mb-4">
              {(article.categories?.length ? article.categories : [article.category]).map((category) => <span key={category} className="bg-[#9e001f]/10 text-[#9e001f] px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">{category}</span>)}
              <span className="bg-[#5f5e5e]/10 text-[#5f5e5e] px-3 py-1 rounded-full text-[11px] uppercase tracking-wider">Exclusif</span>
            </div>
            <figure className="mb-8">
              <img src={article.image} alt={article.title} className="w-full aspect-video object-cover rounded-xl shadow-lg" />
              <figcaption className="mt-4 text-[12px] text-[#5f5e5e] italic text-center">{article.title} - {article.category} • {article.views.toLocaleString()} vues • © Envol Africa</figcaption>
            </figure>
            <LocalizedArticleExperience article={readerArticle} isSubscriber={isSubscriber} preferredLanguage={preferredLanguage} />
            <div className="mb-6 flex items-center gap-3 lg:hidden"><img src={editorialAuthor?.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"} alt={editorialAuthor?.name || article.author} className="h-9 w-9 rounded-full object-cover"/><div><p className="text-[12px] font-bold text-[#1b1c1c]">{editorialAuthor?.name || article.author}</p><p className="text-[10px] text-[#9e001f]">{editorialAuthor?.roleLabel || "Rédacteur"}</p></div></div>
            <div className="mb-6 flex items-center justify-between py-4 border-y border-[#e5bdbb]"><div className="hidden text-[12px] text-[#5f5e5e] sm:block">Par {editorialAuthor?.name || article.author}</div><div className="ml-auto text-right"><p className="text-[11px] uppercase text-[#5c403f]">{new Date(article.publishedAt!).toLocaleDateString('fr-FR',{day:'numeric', month:'short', year:'numeric'})}</p><p className="flex items-center justify-end gap-1 text-[11px] text-[#5f5e5e]"><span className="material-symbols-outlined text-[14px]">schedule</span> {article.readingTime} min</p></div></div>

          </header>

          <ArticleActions articleId={article.id} slug={article.slug} initialLikes={article.likes} initialViews={article.views} />
          </div>
        </article>

        <ArticleRecommendations mostRead={mostRead} sameSubject={related} />
      </main>
    </div>
  );
}
