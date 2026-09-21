import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { findArticleBySlug, findEditorialAuthorById, listPublishedArticles, stripArticleContent } from "@/lib/core-db";
import ArticleActions from "@/components/ArticleActions";
import LocalizedArticleExperience from "@/components/LocalizedArticleExperience";
import ArticleRecommendations from "@/components/ArticleRecommendations";
import SameCategoryCarousel from "@/components/article/SameCategoryCarousel";
import SameAuthorArticles from "@/components/article/SameAuthorArticles";
import { getNewsArticleSchema, getBreadcrumbSchema } from "@/lib/schema-org";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticleBySlug(slug);
  if (!article) {
    return {
      title: "Article introuvable",
      description: "L'article demandé n'existe pas ou a été déplacé.",
    };
  }

  const cleanDescription = (article.summary || article.content || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|\u00a0/g, " ")
    .slice(0, 180)
    .trim() || "Article publié sur Envol Africa Magazine.";

  const image = article.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800";

  return {
    title: article.title,
    description: cleanDescription,
    alternates: {
      canonical: `/article/${encodeURIComponent(article.slug)}`,
    },
    openGraph: {
      title: article.title,
      description: cleanDescription,
      url: `/article/${encodeURIComponent(article.slug)}`,
      type: "article",
      publishedTime: article.publishedAt || article.createdAt,
      authors: [article.author || "Envol Africa"],
      images: [
        {
          url: image,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: cleanDescription,
      images: [image],
    },
  };
}

async function getIsSubscribed() {
  try {
    const user = await getCurrentUserFromCookie();
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
  if (!article) return notFound();
  const [editorialAuthor, isSubscriber, preferredLanguage] = await Promise.all([findEditorialAuthorById(article.authorProfileId), getIsSubscribed(), (async () => { const user = await getCurrentUserFromCookie(); return user?.lang || "fr"; })()]);

  // Normalisation pour un matching infaillible (minuscules, sans accents, sans espaces superflus)
  const normalize = (val?: string | null) =>
    (val || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const currentArticleCategories = (article.categories?.length ? article.categories : [article.category])
    .filter(Boolean)
    .map(normalize);

  const currentArticleCategoryIds = new Set(
    [
      ...(article.categoryIds || []),
      article.categoryId,
    ].filter(Boolean) as string[]
  );

  const matchesCategory = (a: typeof article) => {
    if (a.id === article.id) return false;
    const aCategories = (a.categories?.length ? a.categories : [a.category]).filter(Boolean).map(normalize);
    const hasCategoryNameMatch = aCategories.some((cat) => currentArticleCategories.includes(cat));
    if (hasCategoryNameMatch) return true;
    const aCategoryIds = [...(a.categoryIds || []), a.categoryId].filter(Boolean) as string[];
    const hasCategoryIdMatch = aCategoryIds.some((id) => currentArticleCategoryIds.has(id));
    return hasCategoryIdMatch;
  };

  const related = articles
    .filter((a) => matchesCategory(a))
    .slice(0, 3)
    .map(stripArticleContent);
  const mostRead = [...articles]
    .filter((a) => a.id !== article.id)
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .map(stripArticleContent);

  // Bloc 1 : Articles STRICTEMENT de la même catégorie pour le carrousel automatique
  // AUCUN article d'une autre catégorie ne doit s'y afficher
  const sameCategoryArticles = articles
    .filter((a) => matchesCategory(a))
    .map(stripArticleContent);

  // Bloc 2 : Articles STRICTEMENT du même auteur
  // AUCUN article d'un autre auteur ne doit s'y afficher
  const currentAuthorName = normalize(editorialAuthor?.name || article.author);
  const sameAuthorArticles = articles
    .filter((a) => {
      if (a.id === article.id) return false;
      if (article.authorProfileId && a.authorProfileId && a.authorProfileId === article.authorProfileId) return true;
      if (article.authorId && a.authorId && a.authorId === article.authorId) return true;
      if (currentAuthorName && normalize(a.author) === currentAuthorName) return true;
      return false;
    })
    .map(stripArticleContent);

  const authorInfo = {
    id: editorialAuthor?.id || article.authorProfileId || "author",
    name: editorialAuthor?.name || article.author || "Rédaction Envol Africa",
    photoUrl: editorialAuthor?.photoUrl || article.authorProfilePhoto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600",
    roleLabel: editorialAuthor?.roleLabel || "Journaliste & Rédacteur",
    bio: editorialAuthor?.bio || "Membre de la rédaction d'Envol Africa Magazine, dédié aux analyses économiques et aux perspectives de développement panafricain.",
  };

  const canReadFullContent = !article.isEncrypted || isSubscriber;
  const cleanSummary = (article.summary || "").replace(/&nbsp;|\u00a0/g, " ").trim();
  const readerArticle = canReadFullContent ? { ...article, summary: cleanSummary } : {
    ...article,
    summary: cleanSummary,
    content: "",
    translations: Object.fromEntries(Object.entries(article.translations || {}).map(([language, translation]) => [language, { ...translation, summary: (translation.summary || "").replace(/&nbsp;|\u00a0/g, " ").trim(), content: "" }]))
  };

  const articleSchema = getNewsArticleSchema({
    title: article.title,
    slug: article.slug,
    summary: cleanSummary,
    content: canReadFullContent ? article.content : undefined,
    image: article.image,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: (article as any).updatedAt || article.publishedAt || article.createdAt,
    author: article.author,
    category: article.category,
    isAccessibleForFree: !article.isEncrypted,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: article.category || "Économie", url: "/#articles" },
    { name: article.title, url: `/article/${encodeURIComponent(article.slug)}` },
  ]);

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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

        {/* Bloc 1 : Carrousel automatique « Dans la même catégorie » (strictement de la même catégorie) */}
        {sameCategoryArticles.length > 0 && (
          <SameCategoryCarousel
            articles={sameCategoryArticles}
            categoryName={article.category}
          />
        )}

        {/* Bloc 2 : Carrousel automatique « Du même auteur » avec miniature à gauche (strictement du même auteur) */}
        {sameAuthorArticles.length > 0 && (
          <SameAuthorArticles
            author={authorInfo}
            articles={sameAuthorArticles}
          />
        )}

        {/* Bloc 3 : Pour poursuivre la lecture / Nos articles les plus lus (conservé intact) */}
        <ArticleRecommendations mostRead={mostRead} sameSubject={related} />
      </main>
    </div>
  );
}
