import { readAwardsDB } from "@/lib/awards-db";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function ResultsPage({ params }: { params: { slug: string } }) {
  const db = readAwardsDB();
  const comp = db.competitions.find(c=>c.slug===params.slug);
  if (!comp) return notFound();
  const candidates = db.candidates.filter(c=>c.competition_id===comp.id).sort((a,b)=>b.votes-a.votes);
  const podium = candidates.slice(0,3);

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider text-[#D4AF37] uppercase">Résultats officiels publiés par l'administrateur</div>
          <h1 className="text-[32px] md:text-[48px] font-black mt-6 leading-tight" style={{ fontFamily: "Fraunces" }}>{comp.title} - Podium</h1>
          <p className="text-[#A8A6A0] mt-3">Classement final calculé automatiquement selon pondération {comp.public_vote_weight}% public / {comp.jury_weight}% jury - Validé et publié officiellement par admin</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
          {podium.map((c:any,i:number)=>(
            <div key={c.id} className={`rounded-[20px] border p-6 text-center ${i===0?"bg-[#D4AF37] text-black border-[#D4AF37] order-1 md:order-2 md:-mt-8":"bg-[#16161D] border-white/10 order-2"}`}>
              <div className="text-[48px]">{i===0?"🥇":i===1?"🥈":"🥉"}</div>
              <img src={c.photo_url} alt="" className="w-20 h-20 rounded-full mx-auto mt-4 object-cover" />
              <div className="font-black text-[18px] mt-3">{c.display_name}</div>
              <div className="text-[12px] mt-1 opacity-80">{c.votes} votes • {c.country}</div>
              {i===0 && <div className="mt-4 text-[11px] font-bold bg-black text-[#D4AF37] px-3 py-1 rounded-full inline-block">Gagnant • Cagnotte {((comp.pot_amount_cents||0)/100).toLocaleString()} F</div>}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#16161D] border border-white/10 rounded-xl p-6 max-w-[900px] mx-auto">
          <h3 className="font-bold">Classement complet - {candidates.length} candidats</h3>
          <div className="mt-4 space-y-2">
            {candidates.map((c:any, idx:number)=>(
              <div key={c.id} className="flex items-center justify-between bg-[#0B0B0F] border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-3"><span className="font-black w-6">{idx+1}</span><img src={c.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" /><span className="font-bold text-[13px]">{c.display_name}</span></div>
                <div className="text-[12px] text-[#A8A6A0]">{c.votes} votes • {c.gifts} cadeaux • {(c.donations/100).toLocaleString()} F dons</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href={`/africa-awards/competitions/${comp.slug}/live`} className="inline-block h-11 px-6 rounded-full bg-white/10 border border-white/10 text-white text-[13px] font-bold">Voir replay + moments forts (Mux asset ready → Supabase Storage)</Link>
        </div>
      </div>
    </div>
  );
}
