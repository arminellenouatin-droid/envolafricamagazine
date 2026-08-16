"use client";
import { useEffect, useState } from "react";

export default function ParrainageCompte(){
  const [earnings,setEarnings]=useState<any[]>([]);
  const [user,setUser]=useState<any>(null);
  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      setUser(d.user);
      if (d.user) fetch("/api/affiliate").then(r=>r.ok ? r.json() : { earnings: [] }).then(e=>setEarnings(e.earnings||[]));
    });
  },[]);
  const total=earnings.reduce((s,e)=>s+e.commission,0);
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Parrainage & gains</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-[#0A1931] p-5 text-white"><div className="text-[11px] uppercase font-bold text-[#D4AF37]">Gains totaux</div><div className="font-black text-[24px] mt-1">{total.toLocaleString()} F CFA</div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Disponible</div><div className="font-black text-[20px] mt-1 text-[#0A1931]">{earnings.filter(e=>e.status==="available").reduce((s,e)=>s+e.commission,0).toLocaleString()} F</div></div>
        <div className="rounded-[18px] bg-white border p-5"><div className="text-[11px] uppercase font-bold text-zinc-500">Taux actuel</div><div className="font-black text-[20px] mt-1 text-[#0A1931]">{user?.subscription?.status==="active" ? "25%" : "10%"}</div><div className="text-[11px] text-zinc-500 mt-1">{user?.subscription?.status==="active" ? "Boost abonné actif" : "Devenez abonné pour 25%"}</div></div>
      </div>
      <div className="bg-white rounded-[20px] border p-6">
        <h3 className="font-bold">Mes commissions</h3>
        <div className="mt-4 space-y-2">{earnings.length===0 ? <div className="text-sm text-zinc-500 py-8 text-center">Aucune commission • Partagez votre lien: {user ? `${typeof window!=='undefined'?window.location.origin:''}?ref=${user.affiliateCode}` : ''}</div> : earnings.map((e:any)=>(<div key={e.id} className="flex justify-between p-3 rounded-[12px] bg-zinc-50 border"><span className="text-[13px]">Commande {e.orderId.slice(0,8)} • {e.amount.toLocaleString()} F • {e.rate*100}%</span><span className="font-bold text-green-700">+{e.commission.toLocaleString()} F</span></div>))}</div>
      </div>
      <div className="bg-[#D4AF37] rounded-[18px] p-5 flex justify-between items-center"><div><div className="font-bold text-[#0A1931] text-[14px]">Retrait dès 150 000 F CFA</div><div className="text-[12px] text-[#0A1931]/70 mt-1">Mobile Money (MTN, Orange, Moov, Wave) ou virement bancaire. Délai 24h.</div></div><button disabled={total<150000} className="h-11 px-6 rounded-full bg-[#0A1931] text-white font-bold text-[13px] disabled:opacity-40">Retirer mes gains</button></div>
    </div>
  );
}
