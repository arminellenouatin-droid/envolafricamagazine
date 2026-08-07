"use client";
import { useEffect, useState } from "react";

export default function AchatsPage(){
  const [orders,setOrders]=useState<any[]>([]);
  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      if (d.user) fetch(`/api/orders?userId=${d.user.id}`).then(r=>r.json()).then(o=>setOrders(o.orders||[]));
    });
  },[]);
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Mes achats & téléchargements</h1>
      <div className="bg-white rounded-[20px] border border-zinc-100 p-6">
        {orders.length===0 ? <div className="text-center py-12 text-zinc-500 text-sm">Aucun achat • Votre historique apparaîtra ici</div> : (
          <div className="space-y-3">
            {orders.map((o:any)=>(
              <div key={o.id} className="rounded-[14px] bg-zinc-50 border border-zinc-100 p-4 flex justify-between">
                <div><div className="font-bold text-[13px]">{o.items.map((i:any)=>i.title||i.type).join(', ')}</div><div className="text-[11px] text-zinc-500 mt-1">{new Date(o.createdAt).toLocaleDateString('fr-FR')} • {o.total.toLocaleString()} {o.currency} • {o.status}</div></div>
                <div className="flex gap-2"><button disabled={o.status!=="paid"} className="h-8 px-3 rounded-full bg-[#0A1931] text-white text-[11px] font-bold disabled:opacity-40">Télécharger</button><button className="h-8 px-3 rounded-full border text-[11px]">Facture</button></div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 rounded-[12px] bg-amber-50 border border-amber-100 p-4 text-[12px] text-amber-900">🔒 Liens sécurisés expirant en 24h • Si votre lien a expiré, générez un nouveau lien depuis cette page.</div>
      </div>
    </div>
  );
}
