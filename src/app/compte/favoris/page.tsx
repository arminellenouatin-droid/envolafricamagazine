"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FavorisPage(){
  const [favs, setFavs] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    fetch("/api/favorites").then(r=>r.json()).then(d=>{
      const ids = d.favorites||[];
      setFavs(ids);
      if (ids.length>0) {
        fetch("/api/articles").then(r=>r.json()).then(a=>{
          const filtered = (a.articles||[]).filter((art:any)=>ids.includes(art.id));
          setArticles(filtered);
          setLoading(false);
        });
      } else setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const removeFav = async (id:string) => {
    await fetch(`/api/favorites?articleId=${id}`, { method:"DELETE" });
    setFavs(favs.filter(f=>f!==id));
    setArticles(articles.filter(a=>a.id!==id));
  };

  if (loading) return <div className="space-y-6"><h1 className="font-serif font-black text-[24px] text-[#0A1931]">Mes favoris</h1><div className="bg-white rounded-[20px] border p-10 text-center text-zinc-500">Chargement...</div></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Mes favoris • {favs.length}</h1>
      {favs.length===0 ? (
        <div className="bg-white rounded-[20px] border p-10 text-center"><div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-xl">❤️</div><div className="font-bold mt-4">Aucun favori</div><p className="text-[13px] text-zinc-500 mt-1 max-w-[320px] mx-auto">Cliquez sur ♡ ou 🔖 sur un article pour l'ajouter ici. Retrouvez vos lectures sauvegardées.</p><Link href="/" className="mt-4 inline-block h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold leading-[40px]">Découvrir les articles</Link></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {articles.map((a:any)=>(
            <div key={a.id} className="bg-white rounded-[16px] border p-4 flex gap-3">
              <img src={a.image} alt={a.title} className="w-20 h-20 rounded-[12px] object-cover" />
              <div className="flex-1"><Link href={`/article/${a.slug}`} className="font-bold text-[13px] leading-tight hover:text-[#0A1931]">{a.title}</Link><div className="text-[11px] text-zinc-500 mt-1">{a.category} • {a.readingTime} min</div><button onClick={()=>removeFav(a.id)} className="mt-2 text-[11px] font-bold text-red-600 hover:underline">Retirer</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
