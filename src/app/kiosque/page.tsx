"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function KiosquePage() {
  const [magazines, setMagazines] = useState<any[]>([]);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [devise, setDevise] = useState("XOF");

  useEffect(()=>{
    fetch("/api/magazines").then(r=>r.json()).then(d=>setMagazines(d.magazines||[]));
    const savedDevise = localStorage.getItem("eam_devise") || "XOF";
    setDevise(savedDevise);
  },[]);

  const years = [...new Set(magazines.map(m=>m.year))].sort((a,b)=>b-a);
  const featured = magazines.find((m:any)=>m.featured) || magazines[0];

  const filtered = magazines.filter((m:any)=>{
    if (filterYear!=="all" && m.year.toString()!==filterYear) return false;
    if (filterFormat!=="all" && !m.formats.includes(filterFormat)) return false;
    return true;
  });

  const convertPrice = (priceXOF:number) => {
    const rates: any = { XOF:1, EUR:0.00152, USD:0.00165, NGN:2.5, GHS:0.025 };
    const rate = rates[devise] || 1;
    if (devise==="XOF") return `${priceXOF.toLocaleString()} F CFA`;
    const converted = Math.round(priceXOF*rate);
    const symbols: any = { EUR:"€", USD:"$", NGN:"₦", GHS:"₵" };
    return `${symbols[devise]||devise} ${converted.toLocaleString()} ${devise}`;
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 pt-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500"><Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><span className="text-[#0A1931]">Kiosque</span></div>

        {featured && (
          <div className="mt-8 rounded-[28px] bg-[#0A1931] p-6 md:p-10 grid lg:grid-cols-[380px_1fr] gap-8 text-white relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#D4AF37]/20 rounded-full blur-[80px]"></div>
            <img src={featured.cover} alt={featured.title} className="w-full max-w-[320px] mx-auto aspect-[3/4] object-cover rounded-[18px] magazine-shadow rotate-[-1deg] relative" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#0A1931] rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide">Dernier numéro • N°{featured.numero}</div>
              <h1 className="font-serif font-black text-[28px] md:text-[40px] leading-[0.95] mt-4">{featured.title}</h1>
              <p className="text-[15px] leading-6 text-zinc-300 mt-4 max-w-[560px]">{featured.description} Disponible en 3 langues papier/numérique et 12 langues audio. Devise: {devise}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { id:"numerique", label:"Numérique", price:10000 },
                  { id:"papier", label:"Papier", price:16000 },
                  { id:"audio_pdf", label:"Audio + PDF", price:12000 },
                ].map(f=>(
                  <div key={f.id} className="bg-white/10 border border-white/10 rounded-full px-4 py-2 text-[13px]"><span className="font-bold">{f.label}</span> • {convertPrice(f.price)}</div>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Link href={`/kiosque/${featured.id}`} className="h-12 px-7 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-[14px] flex items-center gap-2 hover:bg-[#F0D878]">Acheter ce numéro →</Link>
                <button onClick={()=>alert("Aperçu: 5 pages gratuites - N°"+featured.numero+" - Le texte est flouté après 5 pages, abonnement requis pour la suite.")} className="h-12 px-7 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[14px]">Feuilleter l'aperçu (5 pages)</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-serif font-black text-[24px] text-[#0A1931]">Tous les numéros • {filtered.length} / {magazines.length} éditions</h2>
          <div className="flex items-center gap-2">
            <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-[13px]">
              <option value="all">Toutes les années</option>
              {years.map(y=><option key={y} value={y.toString()}>{y}</option>)}
            </select>
            <select value={filterFormat} onChange={e=>setFilterFormat(e.target.value)} className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-[13px]">
              <option value="all">Tous les formats</option>
              <option value="numerique">Numérique</option>
              <option value="papier">Papier</option>
              <option value="cd_audio">CD Audio</option>
              <option value="audio_pdf">Audio+PDF</option>
              <option value="audio_papier">Audio+Papier</option>
            </select>
            <select value={devise} onChange={e=>{setDevise(e.target.value); localStorage.setItem("eam_devise", e.target.value);}} className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-[13px]">
              <option value="XOF">F CFA</option><option value="EUR">EUR €</option><option value="USD">USD $</option><option value="NGN">NGN ₦</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {filtered.map((m:any)=>(
            <Link key={m.id} href={`/kiosque/${m.id}`} className="group">
              <div className="aspect-[3/4] rounded-[16px] overflow-hidden bg-white border border-zinc-100 magazine-shadow relative">
                <img src={m.cover} alt={m.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full">N°{m.numero}</div>
                {m.featured && <div className="absolute bottom-2 left-2 right-2 bg-[#0A1931] text-white text-[9px] font-bold py-1 rounded-full text-center">À LA UNE</div>}
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{m.year} • {new Date(m.date).toLocaleDateString('fr-FR',{month:'long'})} • {m.formats.length} formats</div>
                <div className="font-serif font-bold text-[13px] leading-tight mt-1 line-clamp-2 group-hover:text-[#0A1931]">{m.title}</div>
                <div className="text-[11px] text-zinc-500 mt-1">{convertPrice(10000)} • 3 langues / 12 audio</div>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length===0 && <div className="mt-10 text-center py-12 bg-white rounded-[20px] border text-zinc-500">Aucun numéro pour ce filtre • <button onClick={()=>{setFilterYear("all"); setFilterFormat("all");}} className="font-bold text-[#0A1931] underline">Réinitialiser</button></div>}
      </div>
    </div>
  );
}
