import { readDB } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import ArticlePaywall from "@/components/ArticlePaywall";
import ArticleActions from "@/components/ArticleActions";

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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = readDB();
  const article = db.articles.find(a=>a.slug===slug);
  if (!article) return notFound();
  const isSubscriber = await getIsSubscribed();

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
          {article.hasAudio && <><span>•</span><span className="text-[#D4AF37]">🔊 Audio {isSubscriber?"disponible":"réservé abonné"}</span></>}
        </div>

        <h1 className="font-serif font-black text-[30px] md:text-[44px] leading-[0.95] tracking-tight text-[#0A1931] mt-5">{article.title}</h1>
        <p className="text-[17px] md:text-[19px] leading-7 text-zinc-600 mt-5 font-serif">{article.summary}</p>

        <div className="flex items-center justify-between mt-8 pb-8 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0A1931] text-white flex items-center justify-center font-bold text-sm">{article.author[0]}</div>
            <div>
              <div className="text-[14px] font-semibold text-[#0A1931]">{article.author}</div>
              <div className="text-[12px] text-zinc-500">{new Date(article.publishedAt!).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })} • {article.views.toLocaleString()} vues • {article.language.toUpperCase()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSubscriber && article.hasAudio && (
              <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-full bg-green-50 border border-green-100 text-[11px] font-bold text-green-700">
                <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">▶</span> Écouter l'article • 12 langues
              </div>
            )}
          </div>
        </div>

        <img src={article.image} alt={article.title} className="w-full aspect-[16/9] object-cover rounded-[20px] mt-8" />

        {isSubscriber && article.hasAudio && (
          <div className="mt-6 rounded-[16px] bg-[#0A1931] p-4 flex items-center gap-4 text-white">
            <button className="w-12 h-12 rounded-full bg-[#D4AF37] text-[#0A1931] flex items-center justify-center text-lg font-bold">▶</button>
            <div className="flex-1">
              <div className="text-[12px] font-bold uppercase tracking-wide text-[#D4AF37]">Audio • 12 langues disponibles</div>
              <div className="text-[13px] mt-1">Écoutez cet article en {article.language === "fr" ? "Français" : article.language} • Fongbé, Wolof, Swahili, Mina...</div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full w-[23%] bg-[#D4AF37]"></div></div>
            </div>
            <select className="h-9 rounded-full bg-white/10 border border-white/10 px-3 text-[11px]">
              <option>FR</option><option>EN</option><option>ES</option><option>SW</option><option>YO</option><option>FON</option>
            </select>
          </div>
        )}

        <ArticlePaywall
          preview={preview}
          blur={blur}
          rest={isSubscriber ? rest : ""}
          isSubscriber={isSubscriber}
          fullContent={isSubscriber ? article.content : ""}
          articleId={article.id}
        />

        <ArticleActions articleId={article.id} initialLikes={article.likes} />

        <div className="mt-14">
          <h3 className="font-serif font-bold text-xl text-[#0A1931]">À lire aussi - {article.category}</h3>
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
