"use client";
import Link from "next/link";

export function SentinellesSection({ articles }: { articles: any[] }) {
  const items = articles.filter(a=>a.isSentinelle).slice(0,3);
  if (items.length===0) return null;
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-8 md:py-10">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-serif font-black text-[28px] md:text-[36px] tracking-tight text-[#0A1931]">Sentinelles</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-zinc-200 to-transparent"></span>
        <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-zinc-500 border border-zinc-200 rounded-full px-3 py-1">Les veilleurs</span>
      </div>
      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {items.map((a, i)=>(
          <Link key={a.id} href={`/article/${a.slug}`} className={`group relative overflow-hidden rounded-[22px] bg-white border border-zinc-100 ${i===0 ? "md:row-span-2 md:col-span-1 h-[360px] md:h-full min-h-[420px]" : "h-[260px]"}`}>
            <img src={a.image} alt={a.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-[#D4AF37] text-[#0A1931] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{a.category}</span>
                <span className="text-white/80 text-[11px]">{a.readingTime} min</span>
              </div>
              <h3 className="font-serif font-bold text-white text-[20px] md:text-[22px] leading-[1.15] line-clamp-3 group-hover:text-[#F0D878] transition-colors">{a.title}</h3>
              <div className="mt-3 flex items-center gap-2 text-white/70 text-[12px]">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{a.author[0]}</span>
                <span>{a.author}</span><span>•</span><span>{new Date(a.publishedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EssorOmbreSection({ articles }: { articles: any[] }) {
  const essor = articles.filter(a=>a.isEssor).slice(0,3);
  const ombre = articles.filter(a=>a.isOmbreDouce).slice(0,3);
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-4 grid lg:grid-cols-2 gap-6 md:gap-8">
      <div className="rounded-[24px] bg-white border border-zinc-100 p-6 md:p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-black text-2xl text-[#0A1931]">Essor</h2>
          <span className="text-[11px] uppercase tracking-widest font-bold text-white bg-[#0A1931] rounded-full px-3 py-1">Dynamiques</span>
        </div>
        <div className="space-y-5">
          {essor.map(a=>(
            <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-4 group">
              <img src={a.image} className="w-[96px] h-[96px] rounded-[14px] object-cover group-hover:scale-[1.02] transition-transform" alt="" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-wide font-semibold"><span className="text-[#D4AF37]">●</span>{a.category}</div>
                <h4 className="font-serif font-bold text-[16px] leading-[1.25] text-zinc-900 group-hover:text-[#0A1931] line-clamp-2 mt-1">{a.title}</h4>
                <div className="text-[12px] text-zinc-500 mt-1.5 line-clamp-2">{a.summary}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] bg-[#0A1931] p-6 md:p-7 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[80px]"></div>
        <div className="relative flex items-center justify-between mb-6">
          <h2 className="font-serif font-black text-2xl">Ombre Douce</h2>
          <span className="text-[11px] uppercase tracking-widest font-bold text-[#0A1931] bg-[#D4AF37] rounded-full px-3 py-1">Coulisses</span>
        </div>
        <div className="relative space-y-5">
          {ombre.map(a=>(
            <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-4 group">
              <img src={a.image} className="w-[96px] h-[96px] rounded-[14px] object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-[#D4AF37] uppercase tracking-wide font-semibold"><span>◆</span>{a.category}</div>
                <h4 className="font-serif font-bold text-[16px] leading-[1.25] text-white group-hover:text-[#F0D878] line-clamp-2 mt-1">{a.title}</h4>
                <div className="text-[12px] text-zinc-400 mt-1.5 line-clamp-2">{a.summary}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MagazineCarousel({ magazines }: { magazines: any[] }) {
  return (
    <section className="bg-white border-y border-zinc-100 py-8 md:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-black text-[22px] md:text-[26px] text-[#0A1931]">Le Kiosque • Dernières éditions</h2>
          <Link href="/kiosque" className="text-[13px] font-semibold text-zinc-600 hover:text-[#0A1931] flex items-center gap-1">Voir tout <span>→</span></Link>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {magazines.slice(0,8).map(m=>(
            <Link key={m.id} href={`/kiosque/${m.id}`} aria-label={`Voir la fiche produit de ${m.title}`} className="shrink-0 group cursor-pointer">
              <div className="w-[160px] md:w-[190px] aspect-[3/4] rounded-[16px] overflow-hidden magazine-shadow bg-zinc-100 relative">
                <img src={m.cover} alt={m.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full">N°{m.numero}</div>
                {m.featured && <div className="absolute bottom-2 left-2 right-2 bg-[#0A1931] text-white text-[10px] font-bold px-2 py-1 rounded-full text-center">À LA UNE</div>}
              </div>
              <div className="mt-3 w-[160px] md:w-[190px]">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">{new Date(m.date).toLocaleDateString('fr-FR',{month:'long', year:'numeric'})}</div>
                <div className="font-serif font-bold text-[13px] leading-tight line-clamp-2 mt-0.5 group-hover:text-[#0A1931]">{m.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FilInfoManager({ articles }: { articles: any[] }) {
  const recent = articles.slice(0,6);
  const manager = {
    name: "Fatou Ndiaye",
    role: "CEO, Wave Côte d'Ivoire",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    quote: "L'inclusion financière n'est pas une option, c'est le socle de la croissance africaine.",
  };
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-8 md:py-10 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-[24px] bg-white border border-zinc-100 p-6 md:p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <h2 className="font-serif font-black text-xl text-[#0A1931]">Fil d'Info • En direct</h2>
          <span className="ml-auto text-[11px] bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-bold">LIVE</span>
        </div>
        <div className="space-y-4">
          {recent.map((a, idx)=>(
            <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-4 py-3 border-b last:border-0 border-zinc-100 group">
              <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{new Date(a.publishedAt).toLocaleTimeString('fr-FR',{hour:'2-digit', minute:'2-digit'})}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white uppercase tracking-wider">{a.category}</span>
                  {idx===0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white uppercase">Breaking</span>}
                </div>
                <h4 className="font-medium text-[14px] leading-[1.35] mt-1.5 group-hover:text-[#0A1931]">{a.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="rounded-[24px] bg-gradient-to-br from-[#0A1931] to-[#1a365d] p-6 md:p-7 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0A1931] font-bold text-sm">M</span>
            <div>
              <div className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#D4AF37]">Manager du Mois</div>
              <div className="text-[13px] font-semibold -mt-0.5">Sélection de la rédaction</div>
            </div>
          </div>
          <img src={manager.image} alt={manager.name} className="w-24 h-24 rounded-[18px] object-cover border-2 border-white/20" />
          <h3 className="font-serif font-bold text-[20px] mt-4 leading-tight">{manager.name}</h3>
          <div className="text-[#D4AF37] text-[12px] font-semibold uppercase tracking-wide mt-1">{manager.role}</div>
          <p className="text-[13px] leading-6 text-zinc-300 mt-4 italic">"{manager.quote}"</p>
          <Link href="#" className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide bg-white text-[#0A1931] px-4 py-2 rounded-full hover:bg-zinc-100">Lire l'interview →</Link>
        </div>
      </div>
    </section>
  );
}

export function MostReadFormations({ articles }: { articles: any[] }) {
  const mostRead = [...articles].sort((a,b)=>b.views-a.views).slice(0,5);
  const formations = [
    { title: "Executive MBA - Finance Africaine", org: "Envol Academy x HEC", duration: "12 mois", price: "3,5M F CFA", badge: "Certifié" },
    { title: "Fintech & Mobile Money Mastery", org: "Envol Academy", duration: "8 semaines", price: "450k F CFA", badge: "Nouveau" },
    { title: "Leadership Féminin - Cohort 7", org: "Envol Women", duration: "6 mois", price: "1,2M F CFA", badge: "Bourse 50%" },
  ];
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-4 grid lg:grid-cols-3 gap-6">
      <div className="rounded-[24px] bg-white border border-zinc-100 p-6 md:p-7">
        <h2 className="font-serif font-black text-xl text-[#0A1931] flex items-center gap-2"><span>🔥</span> Les plus lus</h2>
        <div className="mt-6 space-y-4">
          {mostRead.map((a, i)=>(
            <Link key={a.id} href={`/article/${a.slug}`} className="flex gap-3 group">
              <span className="font-serif font-black text-[28px] leading-none text-zinc-200 group-hover:text-[#D4AF37] transition-colors">0{i+1}</span>
              <div>
                <h4 className="text-[13px] font-medium leading-[1.35] group-hover:text-[#0A1931] line-clamp-2">{a.title}</h4>
                <div className="text-[11px] text-zinc-500 mt-1">{a.views.toLocaleString()} lectures • {a.likes} j'aime</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 rounded-[24px] bg-[#FFFCF5] border border-amber-100 p-6 md:p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-black text-xl text-[#0A1931]">Formations certifiées</h2>
          <span className="text-[11px] font-bold uppercase tracking-widest bg-[#0A1931] text-white px-3 py-1 rounded-full">Par Envol Africa</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {formations.map(f=>(
            <div key={f.title} className="rounded-[18px] bg-white border border-zinc-100 p-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-900 uppercase">{f.badge}</span>
                <span className="text-[11px] text-zinc-500">{f.duration}</span>
              </div>
              <h4 className="font-bold text-[14px] leading-tight">{f.title}</h4>
              <div className="text-[12px] text-zinc-500 mt-1">{f.org}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-bold text-[13px] text-[#0A1931]">{f.price}</span>
                <span className="text-[11px] font-bold uppercase tracking-wide border border-zinc-200 rounded-full px-2.5 py-1">S'inscrire</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TabsSection() {
  const tabs = [
    { id: "financement", label: "Financement", count: "24 opportunités" },
    { id: "formation", label: "Formation", count: "12 programmes" },
    { id: "concours", label: "Concours", count: "8 concours" },
  ];
  const items = [
    { title: "Levée de fonds Série A - AgriTech Sénégal", amount: "500M F CFA recherchés", time: "Il reste 12 jours", tag: "Agro" },
    { title: "Bourse d'excellence Envol - 100% financée", amount: "Master 2 Finance", time: "Clôture dans 5 jours", tag: "Éducation" },
    { title: "Prix de l'Innovation Africaine 2026", amount: "Prix : 10M F CFA", time: "Candidatures ouvertes", tag: "Innovation" },
  ];
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-6">
      <div className="rounded-[24px] bg-white border border-zinc-100 overflow-hidden">
        <div className="flex border-b border-zinc-100">
          {tabs.map(t=>(
            <button key={t.id} className={`flex-1 py-4 text-[13px] font-semibold border-b-2 ${t.id==="financement" ? "border-[#0A1931] text-[#0A1931] bg-zinc-50/50" : "border-transparent text-zinc-500 hover:text-zinc-800"}`}>
              {t.label} <span className="hidden md:inline text-[11px] font-normal text-zinc-500 ml-1">• {t.count}</span>
            </button>
          ))}
        </div>
        <div className="p-6 md:p-7 grid md:grid-cols-3 gap-4">
          {items.map(it=>(
            <div key={it.title} className="rounded-[16px] bg-zinc-50 border border-zinc-100 p-4">
              <div className="flex items-center gap-2 mb-2"><span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white border border-zinc-200 uppercase">{it.tag}</span><span className="text-[11px] text-zinc-500">{it.time}</span></div>
              <h4 className="font-semibold text-[14px] leading-tight">{it.title}</h4>
              <div className="text-[12px] text-zinc-600 mt-1">{it.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VideoProchainEcosystem({ articles, magazines }: { articles:any[], magazines:any[] }) {
  const nextMag = magazines[0];
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-6 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-[24px] bg-[#0A1931] p-6 md:p-7 text-white relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-serif font-black text-xl flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">▶</span> EAM TV • Vidéos</h2>
          <span className="text-[11px] bg-white/10 border border-white/10 rounded-full px-3 py-1">12 nouvelles vidéos</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4 relative z-10">
          {articles.slice(0,2).map(a=>(
            <div key={a.id} className="group cursor-pointer">
              <div className="aspect-video rounded-[14px] overflow-hidden bg-zinc-800 relative">
                <img src={a.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-white/90 text-[#0A1931] flex items-center justify-center text-lg">▶</div></div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full">12:34</div>
              </div>
              <h4 className="font-semibold text-[14px] mt-2.5 leading-tight line-clamp-2">{a.title}</h4>
              <div className="text-[11px] text-zinc-400 mt-1">{a.views.toLocaleString()} vues • il y a 2h</div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {nextMag && (
          <div className="rounded-[24px] bg-white border border-zinc-100 p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Prochain numéro</div>
            <div className="flex gap-4">
              <img src={nextMag.cover} alt={nextMag.title} className="w-20 h-28 rounded-[10px] object-cover magazine-shadow" />
              <div>
                <div className="font-serif font-bold text-[15px] leading-tight">{nextMag.title}</div>
                <div className="text-[12px] text-zinc-500 mt-1 line-clamp-3">{nextMag.description}</div>
                <div className="mt-2 text-[11px] font-bold bg-[#0A1931] text-white rounded-full px-3 py-1 inline-block">Sortie le {new Date(nextMag.date).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-[24px] bg-gradient-to-br from-[#D4AF37] to-[#F0D878] p-5 relative overflow-hidden">
          <h3 className="font-serif font-black text-[#0A1931] text-[18px] leading-tight relative z-10">L'écosystème Envol Africa</h3>
          <p className="text-[12px] text-[#0A1931]/70 mt-1 relative z-10">Un compte unique pour 6 services</p>
          <div className="mt-4 grid grid-cols-3 gap-2 relative z-10">
            {[
              { icon: "💼", name: "Emploi" },
              { icon: "🛒", name: "Market" },
              { icon: "💰", name: "Finance" },
              { icon: "🏆", name: "Awards" },
              { icon: "🎤", name: "Salons" },
              { icon: "🌍", name: "WAB" },
            ].map(e=>(
              <Link key={e.name} href={`/${e.name.toLowerCase()}`} className="bg-white/90 backdrop-blur rounded-[12px] p-2.5 text-center hover:bg-white transition-colors">
                <div className="text-lg">{e.icon}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-[#0A1931] mt-1">{e.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
