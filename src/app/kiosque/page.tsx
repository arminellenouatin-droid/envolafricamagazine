"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function KiosquePage() {
  const [magazines, setMagazines] = useState<any[]>([]);
  const [filterYear, setFilterYear] = useState("all");
  const [filterFormat, setFilterFormat] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(()=>{ fetch("/api/magazines").then(r=>r.json()).then(d=>setMagazines(d.magazines||[])); },[]);

  const years = [...new Set(magazines.map((m:any)=>m.year))].sort((a,b)=>b-a);
  const featured = magazines.find((m:any)=>m.featured) || magazines[0];

  const filtered = magazines.filter((m:any)=>{
    if (filterYear!=="all" && m.year.toString()!==filterYear) return false;
    if (filterFormat!=="all" && !m.formats.includes(filterFormat)) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-[#fcf9f8]">
      <main className="pt-0">
        {/* Featured Magazine Hero - surface-container-low */}
        {featured && (
          <section className="w-full bg-[#f6f3f2] py-[80px]">
            <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 flex justify-center lg:justify-start">
                  <div className="relative group">
                    <div className="w-[340px] h-[460px] md:w-[420px] md:h-[560px] bg-white rounded-lg shadow-2xl overflow-hidden relative transition-transform duration-500 group-hover:-rotate-1" style={{ boxShadow: "inset 12px 0 15px -10px rgba(0,0,0,0.5)" }}>
                      <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/5"></div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div>
                    <span className="text-[12px] bg-[#ffdad8] text-[#9e001f] px-3 py-1 rounded-full uppercase tracking-widest font-bold mb-4 inline-block">À LA UNE — {new Date(featured.date).toLocaleDateString('fr-FR',{month:'long', year:'numeric'}).toUpperCase()}</span>
                    <h1 className="text-[40px] md:text-[48px] leading-[1.1] font-bold text-[#1b1c1c] mb-4" style={{ fontFamily: "Montserrat" }}>L'Émergence des <span className="text-[#9e001f]">Licornes Africaines</span><br/><span className="text-[28px]">{featured.title}</span></h1>
                    <p className="text-[18px] text-[#5c403f] max-w-[640px] leading-[1.6]" style={{ fontFamily: "Source Serif 4" }}>{featured.description} Dossier exclusif 48 pages sur les champions de demain.</p>
                  </div>
                  <div className="bg-[#f0eded] p-6 rounded-xl border border-[#e5bdbb] max-w-[580px]">
                    <h3 className="text-[14px] font-bold uppercase tracking-wider mb-4">AU SOMMAIRE :</h3>
                    <ul className="grid grid-cols-2 gap-3 text-[#5c403f] text-[14px]">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#9e001f]"></span> Dossier Spécial Fintech</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#9e001f]"></span> Interview : Patrice Motsepe</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#9e001f]"></span> Bourse : Le rallye de la BRVM</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#9e001f]"></span> Énergie : L'hydrogène vert</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link href={`/kiosque/${featured.id}`} className="bg-[#9e001f] text-white px-10 py-4 rounded-lg text-[14px] uppercase tracking-widest font-bold hover:opacity-90 shadow-md flex items-center gap-2"><span className="material-symbols-outlined">shopping_bag</span> ACHETER CE NUMÉRO (15€)</Link>
                    <button onClick={()=>alert("Feuilletage : 5 pages gratuites - aperçu limité, abonnement requis pour suite")} className="border-2 border-[#1b1c1c] text-[#1b1c1c] px-10 py-4 rounded-lg text-[14px] uppercase tracking-widest font-bold hover:bg-[#1b1c1c] hover:text-white flex items-center gap-2"><span className="material-symbols-outlined">import_contacts</span> FEUILLETER</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Archive Section */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-[#e5bdbb] pb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[140px]">
                <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="w-full bg-white border border-[#906f6e] px-4 py-2.5 rounded-lg text-[14px] focus:ring-2 focus:ring-[#9e001f] outline-none appearance-none cursor-pointer">
                  <option value="all">Toutes les années</option>
                  {years.map((y:any)=><option key={y} value={y.toString()}>{y}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-[#5c403f]">expand_more</span>
              </div>
              <div className="relative min-w-[160px]">
                <select value={filterFormat} onChange={e=>setFilterFormat(e.target.value)} className="w-full bg-white border border-[#906f6e] px-4 py-2.5 rounded-lg text-[14px] focus:ring-2 focus:ring-[#9e001f] outline-none appearance-none cursor-pointer">
                  <option value="all">Tous les formats</option>
                  <option value="numerique">Numérique</option>
                  <option value="papier">Papier</option>
                  <option value="cd_audio">CD Audio</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-[#5c403f]">expand_more</span>
              </div>
            </div>
            <div className="relative w-full md:w-[320px]">
              <span className="material-symbols-outlined absolute left-4 top-2.5 text-[#5c403f]">search</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} className="w-full bg-white border border-[#906f6e] pl-11 pr-4 py-2.5 rounded-lg text-[14px] focus:ring-2 focus:ring-[#9e001f] outline-none" placeholder="Rechercher un numéro..." type="text" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
            {filtered.map((m:any)=>(
              <Link key={m.id} href={`/kiosque/${m.id}`} className="flex flex-col group cursor-pointer">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#eae7e7] relative mb-4 shadow-sm group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2" style={{ boxShadow: "inset 12px 0 15px -10px rgba(0,0,0,0.5)" }}>
                  <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                </div>
                <span className="text-[12px] text-[#9e001f] uppercase tracking-wider mb-1 font-medium">{new Date(m.date).toLocaleDateString('fr-FR',{month:'long', year:'numeric'})}</span>
                <h4 className="text-[14px] text-[#1b1c1c] group-hover:text-[#9e001f] transition-colors leading-tight font-semibold">N°{m.numero} - {m.title.slice(0,50)}</h4>
              </Link>
            ))}
          </div>

          <div className="mt-[80px] flex justify-center">
            <nav className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#906f6e] hover:bg-[#f0eded] transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[#9e001f] text-white">1</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#906f6e] hover:bg-[#f0eded]">2</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#906f6e] hover:bg-[#f0eded]">3</button>
              <span className="px-2">...</span>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#906f6e] hover:bg-[#f0eded]">12</button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full border border-[#906f6e] hover:bg-[#f0eded]"><span className="material-symbols-outlined">chevron_right</span></button>
            </nav>
          </div>
        </section>

        <section className="bg-[#303030] text-white py-20 overflow-hidden relative">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] relative z-10">
            <div className="max-w-[720px]">
              <h2 className="text-[32px] font-bold mb-4" style={{ fontFamily: "Montserrat" }}>Ne manquez aucun numéro</h2>
              <p className="text-[#e4e2e1] mb-8">Inscrivez-vous à notre newsletter pour être alerté dès la sortie du prochain Envol Africa et recevoir nos analyses exclusives chaque semaine.</p>
              <form className="flex flex-col sm:flex-row gap-4" onSubmit={e=>{e.preventDefault(); alert("Inscription newsletter OK - merci !");}}>
                <input className="flex-grow bg-white/10 border border-white/20 rounded-lg px-6 py-4 focus:ring-2 focus:ring-[#9e001f] outline-none text-white placeholder-white/50" placeholder="votre@email.com" type="email" required />
                <button className="bg-[#9e001f] text-white px-10 py-4 rounded-lg font-bold uppercase tracking-widest hover:opacity-90">S'INSCRIRE</button>
              </form>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 opacity-10"><span className="material-symbols-outlined text-[400px] select-none">news</span></div>
        </section>
      </main>
    </div>
  );
}
