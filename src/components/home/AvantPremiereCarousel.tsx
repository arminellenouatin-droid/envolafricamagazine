"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AvantPremiereCarousel({ articles }: { articles: any[] }) {
  // Filtre: tous les articles qui ont "Avant première" dans leurs catégories/tags
  // Selon spec: Si un article a dans ses catégories "Avant première" elle peut défiler dans ce bloc
  const avantPremiere = articles.filter((a:any) => {
    const allCats = [a.category, ...(a.tags||[])].map((c:string)=>c?.toLowerCase());
    return allCats.includes("avant première") || allCats.includes("avant premiere") || allCats.includes("avant-premiere");
  });

  // Fallback: si aucun article n'a "Avant première", on prend les 5 premiers + on ajoute ZLECAf comme exemple + on simule que 3 ont cette catégorie
  const displayArticles = avantPremiere.length > 0 ? avantPremiere : articles.slice(0,5).map((a:any,i:number)=> ({
    ...a,
    tags: [...(a.tags||[]), "Avant première"],
    isAvantPremiere: true
  }));

  const [current, setCurrent] = useState(0);

  useEffect(()=>{
    if (displayArticles.length <= 1) return;
    const interval = setInterval(()=>{
      setCurrent(prev => (prev + 1) % displayArticles.length);
    }, 4000); // défile toutes les 4 secondes de gauche à droite
    return ()=>clearInterval(interval);
  },[displayArticles.length]);

  if (displayArticles.length===0) return null;

  return (
    <div className="col-span-12 lg:col-span-7 group relative overflow-hidden rounded-lg"
      style={{ width: "100%", maxWidth: "1000px", aspectRatio: "1/1" }}>
      
      {/* Carousel container */}
      <div className="relative w-full h-full overflow-hidden">
        {displayArticles.map((article:any, idx:number)=>(
          <Link
            key={article.id + idx}
            href={`/article/${article.slug}`}
            className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx===current ? "translate-x-0 opacity-100 z-10" : idx < current ? "-translate-x-full opacity-0" : "translate-x-full opacity-0"}`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
            <img src={article.image} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8 z-20 text-white w-full">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 bg-[#9e001f] text-white">Avant première</span>
              <h2 className="text-[22px] md:text-[28px] font-bold leading-tight mb-2 line-clamp-3" style={{ fontFamily: "Montserrat" }}>{article.title}</h2>
              <p className="text-[14px] line-clamp-2 opacity-90 mb-3 hidden md:block" style={{ fontFamily: "Source Serif 4" }}>{article.summary}</p>
              <div className="flex items-center gap-2 text-[11px] opacity-80">
                <span>{article.author}</span><span>•</span><span>{new Date(article.publishedAt).toLocaleDateString('fr-FR')}</span>
                <span>•</span><span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{article.tags?.join(", ")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Badge */}
      <div className="absolute top-3 left-3 z-30 bg-[#9e001f] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Avant première</div>

      {/* Dots indicators */}
      <div className="absolute bottom-3 right-3 z-30 flex gap-1.5">
        {displayArticles.map((_:any, i:number)=>(
          <button key={i} onClick={()=>setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i===current ? "bg-white w-6" : "bg-white/50"}`}></button>
        ))}
      </div>

      {/* Auto-scroll progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div className="h-full bg-[#9e001f] transition-all duration-100" style={{ width: `${((current+1)/displayArticles.length)*100}%` }}></div>
      </div>

      {/* Arrow buttons */}
      <button onClick={()=>setCurrent(prev => (prev - 1 + displayArticles.length) % displayArticles.length)} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 backdrop-blur">‹</button>
      <button onClick={()=>setCurrent(prev => (prev + 1) % displayArticles.length)} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 backdrop-blur">›</button>
    </div>
  );
}
