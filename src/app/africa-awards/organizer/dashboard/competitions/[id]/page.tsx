"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function OrganizerCompetitionDetail() {
  const params = useParams();
  const id = params.id as string;
  const [comp, setComp] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(()=>{
    fetch(`/api/awards/competitions`).then(r=>r.json()).then(d=>{
      const c = (d.competitions||[]).find((x:any)=>x.id===id || x.slug===id);
      setComp(c);
      if (c) {
        fetch(`/api/awards/candidates?competition_id=${c.id}`).then(r=>r.json()).then(cd=>setCandidates(cd.candidates||[]));
      }
    });
  },[id]);

  if (!comp) return <div className="bg-[#0B0B0F] text-white min-h-screen p-10">Chargement compétition...</div>;

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#A8A6A0]"><Link href="/africa-awards/organizer/dashboard/requests" className="hover:text-[#D4AF37]">Mes demandes</Link><span>›</span><span className="text-white">Gestion opérationnelle</span></div>
        <h1 className="text-[24px] font-black mt-4" style={{ fontFamily: "Fraunces" }}>{comp.title} - Gestion opérationnelle (Organisateur - accès limité)</h1>
        <p className="text-[#A8A6A0] text-[12px] mt-2">Vous avez été attribué à cette compétition après validation admin. Vous pouvez gérer candidats (validation selon règles admin), proposer animateurs/jury (soumis à validation admin), suivre paiements/stats, proposer résultats (publication finale toujours soumise à validation admin).</p>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#16161D] border border-white/10 rounded-xl p-5">
              <h3 className="font-bold">Candidats - Validation selon règles admin</h3>
              <div className="mt-4 space-y-3">
                {candidates.map((c:any)=>(
                  <div key={c.id} className="flex items-center justify-between bg-[#0B0B0F] border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-3"><img src={c.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" /><div><div className="font-bold text-[13px]">{c.display_name}</div><div className="text-[11px] text-[#A8A6A0]">{c.country} • {c.status} • {c.votes} votes</div></div></div>
                    <div className="flex gap-2"><button className="h-7 px-3 rounded-full bg-green-600/20 text-green-400 text-[11px]">Accepter</button><button className="h-7 px-3 rounded-full bg-red-600/20 text-red-400 text-[11px]">Refuser</button></div>
                  </div>
                ))}
                {candidates.length===0 && <div className="text-center py-10 text-[#A8A6A0] text-[13px]">Aucun candidat - Les candidatures arrivent via /apply/{comp.slug}</div>}
              </div>
            </div>

            <div className="bg-[#16161D] border border-white/10 rounded-xl p-5">
              <h3 className="font-bold text-[14px]">Proposer animateurs et jury (soumis à validation admin)</h3>
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="bg-[#0B0B0F] border border-white/10 rounded-lg p-4"><div className="text-[11px] font-bold uppercase">Animateurs proposés</div><div className="text-[12px] text-[#A8A6A0] mt-2">Aucun - Proposez un animateur, admin validera</div><button className="mt-3 h-8 px-3 rounded-full bg-white/10 text-white text-[11px]">+ Proposer animateur</button></div>
                <div className="bg-[#0B0B0F] border border-white/10 rounded-lg p-4"><div className="text-[11px] font-bold uppercase">Jury proposé</div><div className="text-[12px] text-[#A8A6A0] mt-2">Aucun - Proposez un jury, admin validera</div><button className="mt-3 h-8 px-3 rounded-full bg-white/10 text-white text-[11px]">+ Proposer jury</button></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-5">
              <h4 className="font-bold text-[13px] text-[#D4AF37]">Statistiques - Paiements - Proposition résultats</h4>
              <div className="mt-3 space-y-2 text-[12px] text-[#A8A6A0]">
                <div className="flex justify-between"><span>Revenus</span><span className="text-white font-bold">{((comp.pot_amount_cents||0)/100).toLocaleString()} F</span></div>
                <div className="flex justify-between"><span>Participants</span><span className="text-white">{comp.candidates_count}</span></div>
                <div className="flex justify-between"><span>Vues</span><span className="text-white">{(comp.votes_count||0)*10}</span></div>
                <div className="flex justify-between"><span>Taux participation</span><span className="text-white">67%</span></div>
              </div>
              <button className="mt-4 w-full h-10 rounded-full bg-white/10 border border-white/10 text-white text-[12px]">Proposer résultats finaux (soumis à validation admin)</button>
              <p className="text-[11px] text-[#A8A6A0] mt-2">Publication finale toujours soumise à validation administrateur - jamais publiée directement par organisateur</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
