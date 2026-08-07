import { readDB } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import ArticlePaywall from "@/components/ArticlePaywall";

async function getIsSubscribed() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    const decoded = verifyToken(token);
    if (!decoded) return false;
    const db = readDB();
    const user = db.users.find(u=>u.id===decoded.id);
    if (!user) return false;
    if (user.role==="admin" || user.role==="gerant" || user.role==="redacteur_chef") return true;
    if (user.subscription?.status==="active") {
      const end = new Date(user.subscription.endDate);
      if (end > new Date()) return true;
    }
    return false;
  } catch { return false; }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const db = readDB();
  const article = db.articles.find(a=>a.slug===params.slug);
  if (!article) return notFound();
  const isSubscriber = await getIsSubscribed();

  // server-side paywall: compute preview only if not subscriber
  const words = article.content.split(/\s+/);
  const preview = words.slice(0, 12*14).join(' ');
  const blur = words.slice(12*14, 15*14).join(' ');
  const rest = words.slice(15*14).join(' ');

  const related = db.articles.filter(a=>a.category===article.category && a.id!==article.id).slice(0,3);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500">
          <Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><span className="text-[#0A1931]">{article.category}</span><span>•</span><span>{article.readingTime} min de lecture</span>
        </div>

        <h1 className="font-serif font-black text-[30px] md:text-[44px] leading-[0.95] tracking-tight text-[#0A1931] mt-5">{article.title}</h1>
        <p className="text-[17px] md:text-[19px] leading-7 text-zinc-600 mt-5 font-serif">{article.summary}</p>

        <div className="flex items-center justify-between mt-8 pb-8 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold text-sm">{article.author[0]}</div>
            <div>
              <div className="text-[14px] font-semibold text-[#0A1931]">{article.author}</div>
              <div className="text-[12px] text-zinc-500">{new Date(article.publishedAt!).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })} • {article.views.toLocaleString()} vues</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">♡</button>
            <button className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">↗</button>
            <button className="w-9 h-9 rounded-full border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">🔊</button>
          </div>
        </div>

        <img src={article.image} alt={article.title} className="w-full aspect-[16/9] object-cover rounded-[20px] mt-8" />

        <ArticlePaywall
          preview={preview}
          blur={blur}
          rest={isSubscriber ? rest : ""}
          isSubscriber={isSubscriber}
          fullContent={isSubscriber ? article.content : ""}
          articleId={article.id}
        />

        {/* Actions under article */}
        <div className="mt-10 flex flex-wrap gap-2">
          <button className="h-10 px-4 rounded-full bg-zinc-900 text-white text-[13px] font-semibold flex items-center gap-2">❤️ {article.likes} J'aime</button>
          <button className="h-10 px-4 rounded-full border border-zinc-200 text-[13px] font-medium">💬 Commenter</button>
          <button className="h-10 px-4 rounded-full border border-zinc-200 text-[13px] font-medium">🔖 Sauvegarder</button>
          <div className="ml-auto flex items-center gap-2 text-[12px] text-zinc-500"><span>Partager:</span><span className="flex gap-1"><span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">𝕏</span><span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">f</span><span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center">in</span></span></div>
        </div>

        {/* Related */}
        <div className="mt-14">
          <h3 className="font-serif font-bold text-xl text-[#0A1931]">À lire aussi</h3>
          <div className="grid md:grid-cols-3 gap-4 mt-5">
            {related.map(r=>(
              <Link key={r.id} href={`/article/${r.slug}`} className="group">
                <img src={r.image} alt={r.title} className="w-full aspect-[4/3] object-cover rounded-[14px] group-hover:scale-[1.01] transition-transform" />
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37] mt-2.5">{r.category}</div>
                <div className="font-serif font-bold text-[14px] leading-tight mt-1 group-hover:text-[#0A1931] line-clamp-2">{r.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
