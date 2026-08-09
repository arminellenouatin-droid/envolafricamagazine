"use client";
import { useState } from "react";
import Link from "next/link";

export default function SearchAwards() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({ competitions:[], candidates:[] });
  const [filters, setFilters] = useState({ status:"all", category:"all" });

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const res = await fetch(`/api/awards/competitions`);
    const data = await res.json();
    const comps = (data.competitions||[]).filter((c:any)=>!query || c.title.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()));
    setResults({ competitions: comps, candidates: [] });
  };

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Recherche - Filtres combinables</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Recherche fonctionnelle sur compétitions, candidats, organisateurs, catégories, pays, avec résultats pertinents et rapides (&lt;500ms perçu) - Filtres combinables statut/catégorie/popularité - En V1 Postgres tsvector/pg_trgm, V2 Meilisearch/Algolia</p>

        <form onSubmit={search} className="mt-8 flex gap-2">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher compétitions, candidats, organisateurs, pays..." className="flex-1 h-12 rounded-full bg-[#16161D] border border-white/10 px-6 text-[14px]" />
          <button type="submit" className="h-12 px-8 rounded-full bg-[#D4AF37] text-black font-bold text-[13px]">Rechercher</button>
        </form>

        <div className="mt-6 flex gap-2 overflow-x-auto">
          {[
            { label:"Statut", options:["all","live","voting_open","published"] },
            { label:"Catégorie", options:["all","Awards","Miss","Startup"] },
            { label:"Popularité", options:["all","plus votés","plus soutenus","plus populaires"] },
          ].map(f=>(
            <select key={f.label} className="h-9 rounded-full bg-[#16161D] border border-white/10 px-4 text-[12px]">
              <option>{f.label}</option>
              {f.options.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="font-bold">Résultats • {results.competitions?.length||0} compétitions</h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {(results.competitions||[]).map((c:any)=>(
              <Link key={c.id} href={`/africa-awards/competitions/${c.slug}`} className="bg-[#16161D] border border-white/10 rounded-xl p-4 hover:border-[#D4AF37]/30">
                <div className="font-bold">{c.title}</div>
                <div className="text-[11px] text-[#A8A6A0] mt-1">{c.category} • {c.status}</div>
              </Link>
            ))}
          </div>
          {results.competitions?.length===0 && query && <div className="text-center py-10 text-[#A8A6A0]">Aucun résultat pour "{query}" - Essayez un autre terme</div>}
        </div>
      </div>
    </div>
  );
}
