import Link from "next/link";
import { notFound } from "next/navigation";
import { readAwardsDB } from "@/lib/awards-db";
import { getSupabaseCandidates, getSupabaseCompetitions } from "@/lib/awards-supabase";
import VisitorPrice from "@/components/VisitorPrice";

export default async function CompetitionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const remote = await getSupabaseCompetitions({ slug });
  const comp = remote.configured ? remote.competitions[0] : readAwardsDB().competitions.find((item) => item.slug === slug);
  if (!comp) return notFound();
  const candidateData = await getSupabaseCandidates(comp.id);
  const candidates = candidateData.configured ? candidateData.candidates : readAwardsDB().candidates.filter((candidate) => candidate.competition_id === comp.id);

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent z-10"></div>
        <img src={comp.cover_image} alt={comp.title} className="w-full h-[420px] object-cover" />
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest"><Link href="/africa-awards" className="text-[#D4AF37]">Africa Awards</Link><span className="text-white/50">›</span><span className="text-white/80">{comp.category}</span></div>
          <h1 className="text-[32px] md:text-[48px] font-black leading-tight mt-3 max-w-[800px]" style={{ fontFamily: "Fraunces" }}>{comp.title}</h1>
          <div className="flex items-center gap-3 mt-4"><span className={`px-3 py-1 rounded-full text-[11px] font-bold ${comp.status === "live_running" ? "bg-red-600 text-white" : "bg-[#D4AF37] text-black"}`}>{comp.status}</span><span className="text-[12px] text-white/70">{comp.candidates_count ?? candidates.length} candidats • {comp.votes_count ?? 0} votes • Cagnotte <VisitorPrice amountInXof={(comp.pot_amount_cents ?? 0) / 100} /></span></div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10 grid lg:grid-cols-[2fr_1fr] gap-8">
        <div>
          <p className="text-[16px] leading-7 text-[#A8A6A0]">{comp.description}</p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-4"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Vote</div><div className="font-bold mt-1"><VisitorPrice amountInXof={comp.vote_price_cents || 0} /> / vote • {comp.points_per_vote} pts</div></div>
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-4"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Pondération</div><div className="font-bold mt-1">Public {comp.public_vote_weight}% / Jury {comp.jury_weight}%</div></div>
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-4"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Calendrier</div><div className="font-bold mt-1 text-[12px]">{comp.starts_at ? new Date(comp.starts_at).toLocaleDateString() : "À définir"} → {comp.ends_at ? new Date(comp.ends_at).toLocaleDateString() : "À définir"}</div></div>
          </div>

          <h2 className="text-[22px] font-bold mt-10 mb-4">Candidats • {candidates.length}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {candidates.map((candidate: any) => (
              <Link key={candidate.id} href={`/africa-awards/candidates/${candidate.id}`} className="bg-[#16161D] border border-white/10 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 group">
                <div className="aspect-[4/3] overflow-hidden"><img src={candidate.photo_url} alt={candidate.display_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                <div className="p-4"><div className="font-bold text-[14px]">{candidate.display_name}</div><div className="text-[11px] text-[#A8A6A0] mt-1">{candidate.country} • {candidate.votes} votes • {candidate.gifts} cadeaux</div><div className={`mt-2 text-[10px] px-2 py-1 rounded-full inline-block ${candidate.status === "accepted" ? "bg-green-600/20 text-green-400" : "bg-amber-600/20 text-amber-400"}`}>{candidate.status}</div></div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5">
            <h3 className="font-bold">Voter pour cette compétition</h3>
            <p className="text-[12px] text-[#A8A6A0] mt-2">Les votes sont indépendants du live et restent ouverts pendant la période active de la compétition. Choisissez un candidat pour poursuivre via Moneroo.</p>
            {candidates.filter((candidate: any) => candidate.status === "accepted").slice(0, 1).map((candidate: any) => <Link key={candidate.id} href={`/africa-awards/vote/${candidate.id}`} className="mt-4 w-full h-11 rounded-full bg-[#D4AF37] text-black font-bold text-[13px] flex items-center justify-center">Voter maintenant →</Link>)}
            <Link href={`/africa-awards/competitions/${comp.slug}/live`} className="mt-2 w-full h-11 rounded-full border border-white/15 text-white font-medium text-[13px] flex items-center justify-center">Regarder le live →</Link>
            <Link href={`/africa-awards/apply/${comp.slug}`} className="mt-2 w-full h-11 rounded-full border border-white/15 text-white font-medium text-[13px] flex items-center justify-center">Devenir candidat</Link>
          </div>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">Règlement</div>
            <p className="text-[12px] text-[#A8A6A0] mt-2">Vote public {comp.public_vote_weight}% / Jury {comp.jury_weight}% • Les votes restent indépendants du live • Anti-fraude rate limiting + CAPTCHA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
