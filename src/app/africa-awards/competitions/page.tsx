import Link from "next/link";
import { readAwardsDB } from "@/lib/awards-db";

export default function CompetitionsPage() {
  const db = readAwardsDB();
  const comps = db.competitions.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const live = comps.filter(c=>c.status==="live_running");
  const voting = comps.filter(c=>c.status==="voting_open");
  const upcoming = comps.filter(c=>["published","registrations_open","live_scheduled"].includes(c.status));
  const finished = comps.filter(c=>["finished","archived"].includes(c.status));

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#A8A6A0]"><Link href="/africa-awards" className="hover:text-[#D4AF37]">Africa Awards</Link><span>›</span><span className="text-white">Compétitions</span></div>
        <h1 className="text-[36px] md:text-[48px] font-black leading-[0.9] mt-4" style={{ fontFamily: "Fraunces, serif" }}>Toutes les compétitions</h1>
        <p className="text-[#A8A6A0] mt-3 max-w-[640px]">Découvrez les compétitions en direct, à venir et terminées. Filtrez par catégorie et statut.</p>

        <div className="mt-8 flex gap-2 overflow-x-auto">
          {["Toutes","En direct","Votes ouverts","À venir","Terminées"].map(t=>(
            <button key={t} className={`px-5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap ${t==="Toutes"?"bg-[#D4AF37] text-black":"bg-white/10 border border-white/10 text-white hover:bg-white/15"}`}>{t}</button>
          ))}
        </div>

        {live.length>0 && (
          <div className="mt-10">
            <h2 className="text-[20px] font-bold flex items-center gap-2"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> En direct maintenant • {live.length}</h2>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {live.map((c:any)=>(
                <Link key={c.id} href={`/africa-awards/competitions/${c.slug}`} className="rounded-[16px] overflow-hidden bg-[#16161D] border border-white/10 hover:border-[#D4AF37]/30 p-0 group">
                  <div className="aspect-video bg-[#1B2A6B]/30 relative"><div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div><div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] px-2 py-1 rounded-full">{c.votes_count} votes • Cagnotte {(c.pot_amount_cents/100).toLocaleString()} F</div></div>
                  <div className="p-4"><div className="text-[11px] uppercase tracking-wider text-[#D4AF37] font-bold">{c.category}</div><div className="font-bold text-[16px] mt-1 leading-tight group-hover:text-[#D4AF37]">{c.title}</div></div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-[20px] font-bold">Toutes les compétitions • {comps.length}</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {comps.map((c:any)=>(
              <Link key={c.id} href={`/africa-awards/competitions/${c.slug}`} className="rounded-[16px] bg-[#16161D] border border-white/10 p-5 hover:border-[#D4AF37]/30 transition-colors group">
                <div className="flex items-center justify-between"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.status==="live_running"?"bg-red-600 text-white":c.status==="voting_open"?"bg-[#D4AF37] text-black":"bg-white/10 text-white"}`}>{c.status}</span><span className="text-[11px] text-[#A8A6A0]">{c.candidates_count} candidats</span></div>
                <div className="mt-3 font-bold text-[16px] leading-tight group-hover:text-[#D4AF37] line-clamp-2">{c.title}</div>
                <div className="text-[12px] text-[#A8A6A0] mt-2 line-clamp-2">{c.description}</div>
                <div className="mt-3 text-[11px] text-[#A8A6A0]">{c.category} • {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
