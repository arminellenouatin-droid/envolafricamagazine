"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CrowdFundingPage() {
  const [projets, setProjets] = useState<any[]>([]);
  const [filtreSecteur, setFiltreSecteur] = useState("all");
  const [filtreType, setFiltreType] = useState("all");
  const [filtrePays, setFiltrePays] = useState("all");

  useEffect(()=>{
    fetch("/api/crowdfunding/projects").then(r=>r.json()).then(d=>setProjets(d.projets||[]));
  },[]);

  const filtered = projets.filter(p=>{
    if (filtreSecteur!=="all" && p.secteur!==filtreSecteur) return false;
    if (filtreType!=="all" && !p.typesFinancement.includes(filtreType)) return false;
    if (filtrePays!=="all" && p.pays!==filtrePays) return false;
    return true;
  });

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      {/* Hero */}
      <div className="bg-[#303030] text-white py-16 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#9e001f]/20 rounded-full blur-[80px]"></div>
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase">AfricaCrowdFunding • Simple • Sûr • Temps réel</div>
          <h1 className="text-[36px] md:text-[52px] font-black leading-[0.9] mt-6 max-w-[800px]" style={{ fontFamily: "Montserrat" }}>Financez l'Afrique qui <span className="text-[#ffdad8]">entreprend</span></h1>
          <p className="text-[#e4e2e1] mt-4 max-w-[640px] leading-7">Porteurs de projets présentent leurs idées, investisseurs les aident via 3 façons : <strong className="text-white">Don</strong> (sans retour), <strong className="text-white">Prise de part</strong> (devient propriétaire petite partie), <strong className="text-white">Prêt</strong> (remboursé avec intérêt). Suivi temps réel de chaque collecte.</p>
          
          <div className="mt-8 grid md:grid-cols-3 gap-4 max-w-[800px]">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="w-10 h-10 rounded-full bg-[#ffdad8] text-[#9e001f] flex items-center justify-center font-bold">❤️</div><div className="font-bold mt-3">Don</div><div className="text-[12px] text-[#e4e2e1] mt-1">Montant libre, badge Soutien sur profil, aucun retour financier</div></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="w-10 h-10 rounded-full bg-[#ffdad8] text-[#9e001f] flex items-center justify-center font-bold">%</div><div className="font-bold mt-3">Prise de part</div><div className="text-[12px] text-[#e4e2e1] mt-1">Devient propriétaire petite partie, valorisation auto montant collecté / % vendu, contrat PDF auto</div></div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="w-10 h-10 rounded-full bg-[#ffdad8] text-[#9e001f] flex items-center justify-center font-bold">↗</div><div className="font-bold mt-3">Prêt</div><div className="text-[12px] text-[#e4e2e1] mt-1">Prête avec taux intérêt fixé porteur, calendrier remboursement auto (mensuel capital+intérêts)</div></div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/financement/creer" className="h-12 px-8 rounded-full bg-[#9e001f] text-white font-bold text-[14px] flex items-center gap-2">Déposer mon projet →</Link>
            <Link href="#projets" className="h-12 px-8 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[14px] flex items-center gap-2">Parcourir les projets</Link>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-6 border-b border-[#e5bdbb]/30">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5c403f]">Filtres :</span>
          <select value={filtreSecteur} onChange={e=>setFiltreSecteur(e.target.value)} className="h-10 rounded-full border border-[#e5bdbb] bg-white px-4 text-[13px]"><option value="all">Tous secteurs</option><option>Agroalimentaire</option><option>Tech</option><option>Énergie</option><option>Éducation</option><option>Santé</option></select>
          <select value={filtreType} onChange={e=>setFiltreType(e.target.value)} className="h-10 rounded-full border border-[#e5bdbb] bg-white px-4 text-[13px]"><option value="all">Tous types</option><option value="don">Don</option><option value="prise_part">Prise de part</option><option value="pret">Prêt</option></select>
          <select value={filtrePays} onChange={e=>setFiltrePays(e.target.value)} className="h-10 rounded-full border border-[#e5bdbb] bg-white px-4 text-[13px]"><option value="all">Tous pays</option><option value="BJ">Bénin</option><option value="CI">Côte d'Ivoire</option><option value="SN">Sénégal</option><option value="NG">Nigeria</option></select>
          <span className="text-[12px] text-[#5c403f] ml-auto">{filtered.length} projets • Suivi temps réel</span>
        </div>
      </div>

      {/* Projets */}
      <div id="projets" className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="grid md:grid-cols-3 gap-6">
          {filtered.map((p:any)=> {
            const pct = Math.round((p.montantCollecte / p.montantRecherche)*100);
            const reste = Math.ceil((new Date(p.dateFin).getTime() - Date.now())/86400000);
            return (
              <Link key={p.id} href={`/financement/projets/${p.id}`} className="group bg-white rounded-[16px] border border-[#e5bdbb] overflow-hidden hover:shadow-xl transition-all">
                <div className="aspect-[16/9] relative overflow-hidden bg-[#eae7e7]"><img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /><div className="absolute top-3 left-3 flex gap-2"><span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${p.statut==="en_cours"?"bg-green-600 text-white":p.statut==="objectif_atteint"?"bg-[#9e001f] text-white":"bg-amber-600 text-white"}`}>{p.statut.replace(/_/g," ")}</span><span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">{p.secteur}</span></div><div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full">{p.niveauRisque} risque</div></div>
                <div className="p-5">
                  <h3 className="font-bold text-[16px] leading-tight line-clamp-2 group-hover:text-[#9e001f]">{p.nom}</h3>
                  <p className="text-[12px] text-[#5c403f] mt-2 line-clamp-2">{p.description}</p>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] mb-1"><span className="text-[#5c403f]">Progression</span><span className="font-bold">{pct}%</span></div>
                    <div className="h-2 bg-[#f0eded] rounded-full overflow-hidden"><div className="h-full bg-[#9e001f]" style={{ width: `${Math.min(100,pct)}%` }}></div></div>
                    <div className="flex justify-between text-[11px] mt-2"><span className="text-[#5c403f]">{p.montantCollecte.toLocaleString()} / {p.montantRecherche.toLocaleString()} F CFA</span><span className="font-bold">{p.investisseurs} investisseurs</span></div>
                  </div>

                  <div className="mt-3 flex gap-1">
                    {p.typesFinancement.map((t:string)=><span key={t} className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-[#f6f3f2] border">{t.replace("_"," ")}</span>)}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-[#5c403f] border-t border-[#e5bdbb]/30 pt-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{reste>0?`${reste}j restants`:"Clôturé"}</span>
                    <span>{p.pays} • {p.vues} vues</span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-[#f6f3f2] rounded-lg p-2 text-center"><div className="font-bold">{p.repartition.dons}%</div><div className="text-[#5c403f]">Dons</div></div>
                    <div className="bg-[#f6f3f2] rounded-lg p-2 text-center"><div className="font-bold">{p.repartition.prise_part}%</div><div className="text-[#5c403f]">Parts</div></div>
                    <div className="bg-[#f6f3f2] rounded-lg p-2 text-center"><div className="font-bold">{p.repartition.pret}%</div><div className="text-[#5c403f]">Prêts</div></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length===0 && <div className="text-center py-20 text-[#5c403f]">Aucun projet pour ces filtres - Essayez un autre filtre ou <Link href="/financement/creer" className="text-[#9e001f] font-bold">déposez votre projet</Link></div>}
      </div>

      {/* Cagnottes */}
      <section className="bg-[#f0eded] py-12 border-y border-[#e5bdbb]/30">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <h2 className="text-[20px] font-bold">Cagnottes pour soutenir un projet, une personne...</h2>
          <p className="text-[13px] text-[#5c403f] mt-2">Lancez une cagnotte solidaire pour soutenir un projet, une personne, une cause</p>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[1,2,3].map(i=>(
              <div key={i} className="bg-white rounded-xl border p-5">
                <div className="w-12 h-12 rounded-full bg-[#ffdad8] flex items-center justify-center text-[#9e001f] font-bold">❤️</div>
                <div className="font-bold mt-3">Cagnotte solidaire {i}</div>
                <div className="text-[12px] text-[#5c403f] mt-1">Soutenir l'éducation des filles au Bénin - Objectif 1M F CFA</div>
                <div className="mt-3 h-2 bg-[#f0eded] rounded-full overflow-hidden"><div className="h-full bg-[#9e001f] w-[45%]"></div></div>
                <div className="mt-2 text-[11px] flex justify-between"><span>450k / 1M F</span><span>23 donateurs</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
