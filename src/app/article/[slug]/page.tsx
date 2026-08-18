import { findArticleBySlug, listPublishedArticles } from "@/lib/core-db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserFromCookie } from "@/lib/auth";
import ArticlePaywall from "@/components/ArticlePaywall";
import ArticleActions from "@/components/ArticleActions";

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
  const isSubscriber = await getIsSubscribed();

  const words = article.content.split(/\s+/);
  const preview = words.slice(0, 12*14).join(' ');
  const blur = words.slice(12*14, 15*14).join(' ');
  const rest = words.slice(15*14).join(' ');

  const related = articles.filter(a=>a.category===article.category && a.id!==article.id).slice(0,3);

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <main className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-12">
        <article className="max-w-[720px] mx-auto">
          <header className="mb-8">
            <div className="flex gap-2 mb-4">
              <span className="bg-[#9e001f]/10 text-[#9e001f] px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold">{article.category}</span>
              <span className="bg-[#5f5e5e]/10 text-[#5f5e5e] px-3 py-1 rounded-full text-[11px] uppercase tracking-wider">Exclusif</span>
            </div>
            <h1 className="text-[32px] md:text-[40px] leading-tight font-bold text-[#1b1c1c] mb-6" style={{ fontFamily: "Montserrat" }}>{article.title}</h1>
            <p className="text-[18px] text-[#5c403f] mb-8 italic leading-[1.6]" style={{ fontFamily: "Source Serif 4" }}>{article.summary}</p>

            <div className="flex items-center justify-between py-6 border-y border-[#e5bdbb]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100')` }}></div>
                <div>
                  <p className="text-[14px] font-bold text-[#1b1c1c]">{article.author}</p>
                  <p className="text-[12px] text-[#5f5e5e]">Éditorialiste Économique</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#5c403f] uppercase">{new Date(article.publishedAt!).toLocaleDateString('fr-FR',{day:'numeric', month:'short', year:'numeric'})}</p>
                <p className="text-[11px] text-[#5f5e5e] flex items-center justify-end gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {article.readingTime} min • {article.language.toUpperCase()} {article.hasAudio&&"• 🔊"}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 py-4">
              <button className="flex items-center gap-2 hover:text-[#9e001f] group text-[12px]"><span className="material-symbols-outlined text-[20px]">share</span> Partager</button>
              <button className="flex items-center gap-2 hover:text-[#9e001f] group text-[12px]"><span className="material-symbols-outlined text-[20px]">favorite</span> {article.likes}</button>
              <button className="flex items-center gap-2 hover:text-[#9e001f] text-[12px]"><span className="material-symbols-outlined text-[20px]">chat_bubble</span> 12</button>
              <div className="flex-grow"></div>
              {isSubscriber && article.hasAudio ? (
                <div className="flex items-center gap-2 bg-[#e2dfde] text-[#1c1b1b] px-4 py-2 rounded-lg text-[11px] font-bold"><span className="material-symbols-outlined">headphones</span> Écouter (12 langues)</div>
              ) : (
                <div className="flex items-center gap-2 bg-[#f0eded] text-[#5c403f] px-4 py-2 rounded-lg text-[11px]">🔒 Audio réservé abonnés</div>
              )}
            </div>
          </header>

          <figure className="mb-12">
            <img src={article.image} alt={article.title} className="w-full aspect-video object-cover rounded-xl shadow-lg" />
            <figcaption className="mt-4 text-[12px] text-[#5f5e5e] italic text-center">{article.title} - {article.category} • {article.views.toLocaleString()} vues • © Envol Africa</figcaption>
          </figure>

          {isSubscriber && article.hasAudio && (
            <div className="mb-8 rounded-xl bg-[#303030] p-4 flex items-center gap-4 text-white">
              <button className="w-12 h-12 rounded-full bg-[#9e001f] flex items-center justify-center"><span className="material-symbols-outlined">play_arrow</span></button>
              <div className="flex-1"><div className="text-[11px] font-bold uppercase tracking-wider text-[#ffdad8]">Audio • 12 langues</div><div className="text-[13px] mt-1">Écoutez en {article.language.toUpperCase()} • Fongbé, Wolof, Swahili, Mina...</div><div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full w-[23%] bg-[#9e001f]"></div></div></div>
              <select className="h-9 rounded-full bg-white/10 border border-white/10 px-3 text-[11px]"><option>FR</option><option>EN</option><option>ES</option><option>SW</option><option>FON</option></select>
            </div>
          )}

          <ArticlePaywall preview={preview} blur={blur} rest={isSubscriber ? rest : ""} isSubscriber={isSubscriber} isEncrypted={article.isEncrypted !== false} fullContent={article.isEncrypted === false || isSubscriber ? article.content : ""} articleId={article.id} />

          <ArticleActions articleId={article.id} initialLikes={article.likes} />
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
