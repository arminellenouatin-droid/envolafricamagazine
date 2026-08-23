"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Recommendation = {
  id: string;
  slug: string;
  title: string;
  image?: string;
  category?: string;
  author?: string;
  readingTime?: number;
  views?: number;
};

export default function ArticleRecommendations({ mostRead, sameSubject }: { mostRead: Recommendation[]; sameSubject: Recommendation[] }) {
  const [mode, setMode] = useState<"mostRead" | "sameSubject">("mostRead");
  const items = mode === "mostRead" ? mostRead : sameSubject;
  const heading = mode === "mostRead" ? "Nos articles les plus lus" : "Dans le même sujet";
  const fallbackItems = useMemo(() => (items.length ? items : mode === "sameSubject" ? mostRead : sameSubject), [items, mode, mostRead, sameSubject]);

  return (
    <section className="mt-[80px] border-t border-[#e5bdbb] pt-12" aria-labelledby="article-recommendations-title">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">Pour poursuivre la lecture</p>
          <h2 id="article-recommendations-title" className="mt-2 text-[28px] font-bold text-[#1b1c1c]" style={{ fontFamily: "Montserrat" }}>{heading}</h2>
        </div>
        <div className="inline-flex w-fit rounded-full border border-[#e5bdbb] bg-white p-1 text-[11px] font-bold shadow-sm" role="group" aria-label="Choisir les recommandations">
          <button type="button" onClick={() => setMode("mostRead")} className={`rounded-full px-4 py-2 transition ${mode === "mostRead" ? "bg-[#9e001f] text-white" : "text-[#6c5b59] hover:bg-[#fff1f0]"}`}>Les plus lus</button>
          <button type="button" onClick={() => setMode("sameSubject")} className={`rounded-full px-4 py-2 transition ${mode === "sameSubject" ? "bg-[#9e001f] text-white" : "text-[#6c5b59] hover:bg-[#fff1f0]"}`}>Même sujet</button>
        </div>
      </div>
      {fallbackItems.length ? (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {fallbackItems.slice(0, 3).map((item) => (
            <Link key={item.id} href={`/article/${item.slug}`} className="group block">
              <div className="aspect-video overflow-hidden rounded-xl bg-[#eee4e2] shadow-sm"><img src={item.image || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <span className="mt-4 block text-[10px] font-black uppercase tracking-wider text-[#9e001f]">{item.category || "Magazine"}</span>
              <h3 className="mt-2 line-clamp-2 text-[18px] font-bold leading-tight text-[#242020] transition group-hover:text-[#9e001f]" style={{ fontFamily: "Montserrat" }}>{item.title}</h3>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#746665]"><span>{item.author || "Rédaction Envol Africa"}</span><span>{item.readingTime || 5} min</span></div>
            </Link>
          ))}
        </div>
      ) : <p className="mt-8 rounded-xl bg-white p-6 text-center text-sm text-[#746665]">Aucune recommandation disponible pour le moment.</p>}
    </section>
  );
}
