import { readDB } from "@/lib/db";
import Link from "next/link";

export default function KiosquePage() {
  const db = readDB();
  const magazines = db.magazines.sort((a,b)=>b.numero-a.numero);
  const featured = magazines.find(m=>m.featured) || magazines[0];
  const years = [...new Set(magazines.map(m=>m.year))].sort((a,b)=>b-a);

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
              <p className="text-[15px] leading-6 text-zinc-300 mt-4 max-w-[560px]">{featured.description} Disponible en 3 langues papier/numérique et 12 langues audio.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { id:"numerique", label:"Numérique", price:"10 000 F CFA" },
                  { id:"papier", label:"Papier", price:"16 000 F CFA" },
                  { id:"audio_pdf", label:"Audio + PDF", price:"12 000 F CFA" },
                ].map(f=>(
                  <div key={f.id} className="bg-white/10 border border-white/10 rounded-full px-4 py-2 text-[13px]"><span className="font-bold">{f.label}</span> • {f.price}</div>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <Link href={`/kiosque/${featured.id}`} className="h-12 px-7 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-[14px] flex items-center gap-2 hover:bg-[#F0D878]">Acheter ce numéro →</Link>
                <button className="h-12 px-7 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[14px]">Feuilleter l'aperçu</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-serif font-black text-[24px] text-[#0A1931]">Tous les numéros • {magazines.length} éditions</h2>
          <div className="flex items-center gap-2">
            <select className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-[13px]">
              <option>Toutes les années</option>
              {years.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <select className="h-10 rounded-full border border-zinc-200 bg-white px-4 text-[13px]">
              <option>Tous les formats</option>
              <option>Numérique</option>
              <option>Papier</option>
              <option>Audio</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {magazines.map(m=>(
            <Link key={m.id} href={`/kiosque/${m.id}`} className="group">
              <div className="aspect-[3/4] rounded-[16px] overflow-hidden bg-white border border-zinc-100 magazine-shadow relative">
                <img src={m.cover} alt={m.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full">N°{m.numero}</div>
              </div>
              <div className="mt-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{m.year} • {new Date(m.date).toLocaleDateString('fr-FR',{month:'long'})}</div>
                <div className="font-serif font-bold text-[14px] leading-tight mt-1 line-clamp-2 group-hover:text-[#0A1931]">{m.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
