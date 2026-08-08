"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrganizerRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  useEffect(()=>{ fetch("/api/awards/requests").then(r=>r.json()).then(d=>setRequests(d.requests||[])); },[]);
  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Mes demandes de compétition</h1>
            <p className="text-[#A8A6A0] text-[13px] mt-2">Historique de toutes vos demandes - Statut visible Demande soumise, non modifiable - Notification changement statut validée/refusée + motif</p>
          </div>
          <Link href="/africa-awards/organizer/dashboard/requests/new" className="h-11 px-6 rounded-full bg-[#D4AF37] text-black font-bold text-[13px] flex items-center gap-2">+ Nouvelle demande</Link>
        </div>
        <div className="mt-8 space-y-4">
          {requests.map((r:any)=>(
            <div key={r.id} className="bg-[#16161D] border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between"><div className="font-bold">{r.title} • {r.category}</div><span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${r.status==="validated"?"bg-green-600/20 text-green-400":r.status==="rejected"?"bg-red-600/20 text-red-400":"bg-[#D4AF37]/20 text-[#D4AF37]"}`}>{r.status}</span></div>
              <p className="text-[12px] text-[#A8A6A0] mt-2 line-clamp-2">{r.description}</p>
              <div className="text-[11px] text-[#A8A6A0] mt-3">{new Date(r.created_at).toLocaleDateString()} {r.rejection_reason && `• Motif refus: ${r.rejection_reason}`}</div>
            </div>
          ))}
          {requests.length===0 && <div className="text-center py-20 text-[#A8A6A0]">Aucune demande - Soumettez votre première compétition via le bouton ci-dessus<br/>Test critique: tentative accès direct création compétition → 403 (aucune route n'existe côté organisateur)</div>}
        </div>
      </div>
    </div>
  );
}
