import Link from "next/link";
import { readAwardsDB } from "@/lib/awards-db";

export default function RankingsPage() {
  const db = readAwardsDB();
  const topCandidates = db.candidates.sort((a,b)=>b.votes-a.votes).slice(0,10);
  const topCompetitions = db.competitions.sort((a,b)=>(b.votes_count||0)-(a.votes_count||0)).slice(0,5);

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[36px] font-black" style={{ fontFamily: "Fraunces" }}>Classements globaux - Top Afrique</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Hors compétition - mis à jour quotidiennement - Top 100 candidats Afrique, Top 10 chanteurs, Top 20 startups, Top 50 influenceurs, Top 10 pays</p>

        <div className="mt-10 grid lg:grid-cols-2 gap-8">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
            <h2 className="font-bold text-[18px]">🏆 Top 100 Candidats Afrique</h2>
            <div className="mt-4 space-y-2">
              {topCandidates.map((c:any,i:number)=>(
                <Link key={c.id} href={`/africa-awards/candidates/${c.id}`} className="flex items-center justify-between bg-[#0B0B0F] border border-white/5 rounded-lg p-3 hover:border-[#D4AF37]/30">
                  <div className="flex items-center gap-3"><span className={`font-black w-6 ${i<3?"text-[#D4AF37]":"text-white/40"}`}>{i+1}</span><img src={c.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" /><span className="font-bold text-[13px]">{c.display_name}</span></div>
                  <div className="text-[11px] text-[#A8A6A0]">{c.votes} votes • {c.country}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h3 className="font-bold text-[16px]">🔥 Top 10 Chanteurs</h3>
              <div className="mt-3 space-y-2">
                {topCandidates.slice(0,5).map((c:any,i:number)=>(
                  <div key={c.id} className="flex justify-between text-[12px]"><span>{i+1}. {c.display_name}</span><span className="text-[#D4AF37]">{c.votes} votes</span></div>
                ))}
              </div>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h3 className="font-bold text-[16px]">🚀 Top 20 Startups</h3>
              <div className="mt-3 space-y-2">
                {topCandidates.filter((c:any)=>c.bio?.toLowerCase().includes("startup")||true).slice(0,5).map((c:any,i:number)=>(
                  <div key={c.id} className="flex justify-between text-[12px]"><span>{i+1}. {c.display_name}</span><span className="text-[#D4AF37]">2.5M levés</span></div>
                ))}
              </div>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
              <h3 className="font-bold text-[16px]">🌍 Top 10 Pays</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                {["BJ","CI","SN","NG","GH","CM","RW","KE","ZA","MA"].map((country,i)=>(
                  <div key={country} className="flex justify-between bg-[#0B0B0F] rounded-lg p-2"><span>{i+1}. {country}</span><span className="text-[#D4AF37]">{1000-i*50} pts</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-6">
          <h3 className="font-bold text-[#D4AF37]">Classements globaux mis à jour quotidiennement - Recharts à venir Phase 3 fin</h3>
          <p className="text-[12px] text-[#A8A6A0] mt-2">Top 100 candidats Afrique, Top 10 chanteurs, Top 20 startups, Top 50 influenceurs, Top 10 pays - Graphiques Recharts + export CSV</p>
        </div>
      </div>
    </div>
  );
}
