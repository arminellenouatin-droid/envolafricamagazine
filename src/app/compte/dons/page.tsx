"use client";
import { useEffect, useState } from "react";
export default function DonsPage(){
  const [dons,setDons]=useState<any[]>([]);
  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      if (d.user) fetch(`/api/dons?userId=${d.user.id}`).then(r=>r.json()).then(j=>setDons(j.donations||[]));
    });
  },[]);
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Mes dons</h1>
      <div className="bg-white rounded-[20px] border p-6">
        {dons.length===0 ? <div className="text-center py-12 text-sm text-zinc-500">Aucun don enregistré • Merci de soutenir le journalisme indépendant ❤️</div> : (
          <div className="space-y-2">{dons.map((d:any)=><div key={d.id} className="p-3 rounded-[12px] bg-zinc-50 border flex justify-between"><span className="text-[13px]">{new Date(d.createdAt).toLocaleDateString('fr-FR')} • {d.amount.toLocaleString()} {d.currency}</span><span className="font-bold text-green-700">Payé</span></div>)}</div>
        )}
      </div>
    </div>
  );
}
