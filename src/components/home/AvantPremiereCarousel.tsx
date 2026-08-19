"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AvantPremiereCarousel({ articles }: { articles: any[] }) {
  const avantPremiere = articles.filter((article: any) => {
    const categories = [...(article.categories || []), article.category, ...(article.tags || [])].filter(Boolean).map((value: string) => value.toLowerCase().trim());
    return categories.includes("avant première") || categories.includes("avant premiere") || categories.includes("avant-premiere");
  });

  const source = avantPremiere.length > 0 ? avantPremiere : articles.slice(0, 5).map((article: any) => ({ ...article, categories: [...new Set([...(article.categories || []), "Avant-première"])] }));
  const displayArticles = Array.from(new Map(source.map((article: any) => [article.id, article])).values());
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (displayArticles.length <= 1) return;
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % displayArticles.length), 4000);
    return () => clearInterval(interval);
  }, [displayArticles.length]);

  if (!displayArticles.length) return null;

  return <div className="magazine-mobile-hero-carousel col-span-12 group relative aspect-square w-full max-w-[1000px] overflow-hidden rounded-lg">
    <div className="relative h-full w-full overflow-hidden">
      {displayArticles.map((article: any, index: number) => {
        const categories = Array.from(new Set([...(article.categories || []), article.category].filter(Boolean))).slice(0, 2);
        return <Link key={article.id} href={`/article/${article.slug}`} className={`absolute inset-0 h-full w-full transition-all duration-700 ease-in-out ${index === current ? "z-10 translate-x-0 opacity-100" : index < current ? "-translate-x-full opacity-0" : "translate-x-full opacity-0"}`}>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <img src={article.image} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="magazine-mobile-overlay-copy absolute bottom-0 z-20 w-full p-6 text-white md:p-8">
            <div className="magazine-mobile-overlay-categories mb-3 flex flex-wrap gap-2">{categories.map((category: string) => <span key={category} className="inline-block rounded-full bg-[#9e001f] px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{category}</span>)}</div>
            <h2 className="magazine-mobile-overlay-title mb-2 line-clamp-2 text-[22px] font-bold leading-tight md:text-[28px]" style={{ fontFamily: "Montserrat" }}>{article.title}</h2>
            <p className="magazine-mobile-overlay-summary mb-3 hidden line-clamp-2 text-[14px] opacity-90 md:block" style={{ fontFamily: "Source Serif 4" }}>{article.summary}</p>
            <div className="magazine-mobile-overlay-author flex items-center gap-2 text-[11px] opacity-80"><img src={article.authorProfilePhoto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"} alt="" className="h-6 w-6 rounded-full object-cover"/><span>{article.author}</span><span>•</span><span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("fr-FR") : "À la une"}</span></div>
          </div>
        </Link>;
      })}
    </div>
    <div className="absolute left-3 top-3 z-30 rounded-full bg-[#9e001f] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Avant-première</div>
    <div className="absolute bottom-3 right-3 z-30 flex gap-1.5">{displayArticles.map((article: any, index: number) => <button key={article.id} aria-label={`Afficher ${article.title}`} onClick={() => setCurrent(index)} className={`h-2 rounded-full transition-all ${index === current ? "w-6 bg-white" : "w-2 bg-white/50"}`} />)}</div>
    <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20"><div className="h-full bg-[#9e001f] transition-all duration-100" style={{ width: `${((current + 1) / displayArticles.length) * 100}%` }} /></div>
    <button aria-label="Article précédent" onClick={() => setCurrent((prev) => (prev - 1 + displayArticles.length) % displayArticles.length)} className="absolute left-3 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">‹</button>
    <button aria-label="Article suivant" onClick={() => setCurrent((prev) => (prev + 1) % displayArticles.length)} className="absolute right-3 top-1/2 z-30 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60">›</button>
  </div>;
}
