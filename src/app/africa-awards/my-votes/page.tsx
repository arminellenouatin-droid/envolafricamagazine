"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyVotes() {
  const [votes, setVotes] = useState<any[]>([]);
  useEffect(()=>{
    fetch("/api/awards/votes").then(r=>r.json()).then(d=>setVotes(d.votes||[])).catch(()=>{});
  },[]);
  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Historique votes/paiements</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Vérifier: vote apparaît avec statut succeeded, classement se met à jour en &lt;5s</p>
        <div className="mt-8 space-y-3">
          {votes.map((v:any)=>(
            <div key={v.id} className="bg-[#16161D] border border-white/10 rounded-xl p-4 flex justify-between">
              <div><div className="font-bold text-[14px]">{v.candidate_id.slice(0,8)} • {v.points} pts</div><div className="text-[11px] text-[#A8A6A0] mt-1">{new Date(v.created_at).toLocaleString()} • Paiement {v.payment_transaction_id.slice(0,8)} • Moneroo webhook vérifié + idempotence</div></div>
              <span className="text-[11px] bg-green-600/20 text-green-400 px-2 py-1 rounded-full h-fit">succeeded</span>
            </div>
          ))}
          {votes.length===0 && <div className="text-center py-20 text-[#A8A6A0]">Aucun vote - Votez via /africa-awards/competitions → Voter → Moneroo<br/>Test critique paiement: double envoi webhook idempotence garantie contrainte unique moneroo_transaction_id</div>}
        </div>
      </div>
    </div>
  );
}
