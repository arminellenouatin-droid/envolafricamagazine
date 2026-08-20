import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { findArticleBySlug, findEditorialAuthorById, listPublishedArticles } from "@/lib/core-db";
import ArticleActions from "@/components/ArticleActions";
import LocalizedArticleExperience from "@/components/LocalizedArticleExperience";

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
  if (!article) return notFound();
  const [editorialAuthor, isSubscriber, preferredLanguage] = await Promise.all([findEditorialAuthorById(article.authorProfileId), getIsSubscribed(), (async () => { const user = await getCurrentUserFromCookie(); return user?.lang || "fr"; })()]);

  const articleCategorySet = new Set(article.categories?.length ? article.categories : [article.category]);
  const related = articles.filter((a) => a.id !== article.id && (a.categories || [a.category]).some((category) => articleCategorySet.has(category))).slice(0, 3);

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
            <LocalizedArticleExperience article={article} isSubscriber={isSubscriber} preferredLanguage={preferredLanguage} />
            <div className="mb-6 flex items-center gap-3 lg:hidden"><img src={editorialAuthor?.photoUrl || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"} alt={editorialAuthor?.name || article.author} className="h-9 w-9 rounded-full object-cover"/><div><p className="text-[12px] font-bold text-[#1b1c1c]">{editorialAuthor?.name || article.author}</p><p className="text-[10px] text-[#9e001f]">{editorialAuthor?.roleLabel || "Rédacteur"}</p></div></div>
            <div className="mb-6 flex items-center justify-between py-4 border-y border-[#e5bdbb]"><div className="hidden text-[12px] text-[#5f5e5e] sm:block">Par {editorialAuthor?.name || article.author}</div><div className="ml-auto text-right"><p className="text-[11px] uppercase text-[#5c403f]">{new Date(article.publishedAt!).toLocaleDateString('fr-FR',{day:'numeric', month:'short', year:'numeric'})}</p><p className="flex items-center justify-end gap-1 text-[11px] text-[#5f5e5e]"><span className="material-symbols-outlined text-[14px]">schedule</span> {article.readingTime} min</p></div></div>

            <div className="flex items-center gap-6 py-4"><button className="flex items-center gap-2 text-[12px] hover:text-[#9e001f]"><span className="material-symbols-outlined text-[20px]">share</span> Partager</button><button className="flex items-center gap-2 text-[12px] hover:text-[#9e001f]"><span className="material-symbols-outlined text-[20px]">favorite</span> {article.likes}</button><button className="flex items-center gap-2 text-[12px] hover:text-[#9e001f]"><span className="material-symbols-outlined text-[20px]">chat_bubble</span> 12</button></div>
          </header>

          <figure className="mb-12">
            <img src={article.image} alt={article.title} className="w-full aspect-video object-cover rounded-xl shadow-lg" />
            <figcaption className="mt-4 text-[12px] text-[#5f5e5e] italic text-center">{article.title} - {article.category} • {article.views.toLocaleString()} vues • © Envol Africa</figcaption>
          </figure>



          <ArticleActions articleId={article.id} initialLikes={article.likes} />
          </div>
        </article>

        <section className="mt-[80px] pt-[80px] border-t border-[#e5bdbb]">
          <h2 className="text-[28px] font-bold text-center md:text-left mb-12" style={{ fontFamily: "Montserrat" }}>À lire également</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((r:any)=>(
              <Link key={r.id} href={`/article/${r.slug}`} className="group cursor-pointer">
                <div className="aspect-video rounded-lg overflow-hidden mb-4 shadow-sm group-hover:shadow-lg transition-shadow"><img src={r.image} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                <span className="text-[12px] text-[#9e001f] uppercase font-bold tracking-wider">{r.category}</span>
                <h3 className="text-[18px] font-bold mt-2 group-hover:text-[#9e001f] transition-colors line-clamp-2 leading-tight" style={{ fontFamily: "Montserrat" }}>{r.title}</h3>
                <div className="mt-3 flex items-center justify-between text-[#5f5e5e] text-[11px]"><span>{r.author}</span><span>{r.readingTime} min</span></div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
