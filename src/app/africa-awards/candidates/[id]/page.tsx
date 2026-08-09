import { readAwardsDB } from "@/lib/awards-db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CandidateProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readAwardsDB();
  const candidate = db.candidates.find(c=>c.id===id);
  if (!candidate) return notFound();
  const comp = db.competitions.find(c=>c.id===candidate.competition_id);

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#A8A6A0]"><Link href="/africa-awards" className="hover:text-[#D4AF37]">Awards</Link><span>›</span><Link href="/africa-awards/competitions" className="hover:text-[#D4AF37]">Compétitions</Link><span>›</span><span className="text-white">{candidate.display_name}</span></div>
        
        <div className="mt-8 grid lg:grid-cols-[320px_1fr] gap-8">
          <div className="bg-[#16161D] border border-white/10 rounded-[20px] overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden"><img src={candidate.photo_url} alt="" className="w-full h-full object-cover" /></div>
            <div className="p-6">
              <h1 className="text-[24px] font-black" style={{ fontFamily: "Fraunces" }}>{candidate.display_name}</h1>
              <p className="text-[#D4AF37] text-[12px] font-bold mt-1">{candidate.country} • {comp?.category}</p>
              <p className="text-[#A8A6A0] text-[13px] mt-3 leading-6">{candidate.bio}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#0B0B0F] rounded-xl p-3"><div className="text-[20px] font-black text-[#D4AF37]">{candidate.votes}</div><div className="text-[10px] uppercase tracking-wider text-[#A8A6A0]">Votes</div></div>
                <div className="bg-[#0B0B0F] rounded-xl p-3"><div className="text-[20px] font-black text-white">{candidate.gifts}</div><div className="text-[10px] uppercase tracking-wider text-[#A8A6A0]">Cadeaux</div></div>
                <div className="bg-[#0B0B0F] rounded-xl p-3"><div className="text-[20px] font-black text-white">{(candidate.donations/100).toLocaleString()} F</div><div className="text-[10px] uppercase tracking-wider text-[#A8A6A0]">Dons</div></div>
              </div>
              <Link href={`/africa-awards/vote/${candidate.id}`} className="mt-6 w-full h-12 rounded-full bg-[#D4AF37] text-black font-bold text-[14px] flex items-center justify-center hover:bg-[#F4D976]">Voter pour {candidate.display_name.split(' ')[0]} →</Link>
              <div className="mt-3 text-[11px] text-[#A8A6A0] text-center">Nombre exact votes jamais affiché publiquement que classement relatif - Anti-fraude</div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#16161D] border border-white/10 rounded-[16px] p-6">
              <h3 className="font-bold text-[16px]">Projet</h3>
              <p className="text-[#A8A6A0] text-[14px] leading-6 mt-3">{candidate.project_description}</p>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-[16px] p-6">
              <h3 className="font-bold text-[14px]">Compétition</h3>
              {comp && <Link href={`/africa-awards/competitions/${comp.slug}`} className="mt-3 block rounded-xl bg-[#0B0B0F] border border-white/10 p-4 hover:border-[#D4AF37]/30">
                <div className="font-bold">{comp.title}</div>
                <div className="text-[12px] text-[#A8A6A0] mt-1">{comp.category} • {comp.status} • {comp.candidates_count} candidats</div>
              </Link>}
            </div>

            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-[16px] p-5">
              <h4 className="font-bold text-[13px] text-[#D4AF37]">Statistiques publiques (sans nombre exact votes)</h4>
              <p className="text-[12px] text-[#A8A6A0] mt-2">Classement relatif • Évolution • Visiteurs page • Revenus générés - Graphiques temporels Recharts à venir Phase 3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
