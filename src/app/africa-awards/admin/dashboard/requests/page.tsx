"use client";
import { useEffect, useState } from "react";

export default function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(()=>{ fetch("/api/awards/requests").then(r=>r.json()).then(d=>setRequests(d.requests||[])); },[]);

  const updateStatus = async (id:string, status:string, reason?:string) => {
    const res = await fetch("/api/awards/requests", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ id, status, rejection_reason: reason }) });
    if (res.ok) {
      const data = await res.json();
      setRequests(requests.map(r=>r.id===id?data.request:r));
    } else {
      const d = await res.json();
      alert(d.error);
    }
  };

  const filtered = filter==="all" ? requests : requests.filter(r=>r.status===filter);

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Admin - Validation des demandes de compétition</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Seul administrateur peut valider/refuser une demande. Organisateur ne peut que soumettre. Test Playwright: tentative accès création compétition par organizer → 403.</p>

        <div className="mt-6 flex gap-2 overflow-x-auto">
          {["all","submitted","under_review","validated","rejected"].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${filter===s?"bg-[#D4AF37] text-black":"bg-white/10 border border-white/10 text-white"}`}>{s} ({s==="all"?requests.length:requests.filter(r=>r.status===s).length})</button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {filtered.map((r:any)=>(
            <div key={r.id} className="bg-[#16161D] border border-white/10 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div><div className="font-bold text-[16px]">{r.title} • {r.category}</div><div className="text-[12px] text-[#A8A6A0] mt-1">{r.description?.slice(0,100)}...</div><div className="text-[11px] text-[#A8A6A0] mt-2">Soumise par {r.submitted_by.slice(0,8)} • {new Date(r.created_at).toLocaleDateString()} • Statut: <span className={`font-bold ${r.status==="validated"?"text-green-400":r.status==="rejected"?"text-red-400":"text-[#D4AF37]"}`}>{r.status}</span></div></div>
                <div className="flex flex-col gap-2">
                  <button onClick={()=>updateStatus(r.id, "under_review")} className="h-8 px-3 rounded-full bg-white/10 text-white text-[11px]">En étude</button>
                  <button onClick={()=>updateStatus(r.id, "validated")} className="h-8 px-3 rounded-full bg-green-600 text-white text-[11px]">Valider</button>
                  <button onClick={()=>{ const reason=prompt("Motif refus:"); if(reason) updateStatus(r.id, "rejected", reason); }} className="h-8 px-3 rounded-full bg-red-600 text-white text-[11px]">Refuser</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="text-center py-20 text-[#A8A6A0]">Aucune demande - Les organisateurs soumettent via /organizer/dashboard/requests/new</div>}
        </div>
      </div>
    </div>
  );
}
