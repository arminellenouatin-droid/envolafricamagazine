"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ComptePage() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{
      if (d.user) {
        setUser(d.user);
        fetch(`/api/orders?userId=${d.user.id}`).then(r=>r.json()).then(o=>setOrders(o.orders||[]));
        fetch(`/api/affiliate?userId=${d.user.id}`).then(r=>r.json()).then(e=>setEarnings(e.earnings||[]));
      }
    });
  },[]);

  const totalGains = earnings.reduce((s,e)=>s+e.commission,0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif font-black text-[26px] text-[#0A1931]">Bonjour {user?.prenom} 👋</h1>
        <p className="text-[14px] text-zinc-600 mt-1">Bienvenue dans votre espace personnel Envol Africa Magazine.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border border-zinc-100 p-5"><div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Abonnement</div><div className="font-bold text-[16px] mt-2 text-[#0A1931]">{user?.subscription?.status==="active" ? `${user.subscription.planId} • Actif` : "Aucun abonnement"}</div><Link href="/abonnement" className="mt-3 inline-block text-[12px] font-bold bg-[#0A1931] text-white px-3 py-1.5 rounded-full">{user?.subscription?.status==="active" ? "Gérer" : "S'abonner →"}</Link></div>
        <div className="rounded-[18px] bg-white border border-zinc-100 p-5"><div className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Commandes</div><div className="font-bold text-[16px] mt-2 text-[#0A1931]">{orders.length} achats</div><div className="text-[12px] text-zinc-500 mt-1">{orders.filter(o=>o.status==="paid").length} payées • {orders.filter(o=>o.status==="pending").length} en attente</div></div>
        <div className="rounded-[18px] bg-[#D4AF37] p-5"><div className="text-[11px] font-bold uppercase tracking-wide text-[#0A1931]/70">Gains parrainage</div><div className="font-black text-[22px] mt-2 text-[#0A1931]">{totalGains.toLocaleString()} F CFA</div><Link href="/compte/parrainage" className="mt-2 inline-block text-[12px] font-bold bg-[#0A1931] text-white px-3 py-1.5 rounded-full">Voir détails →</Link></div>
      </div>

      <div className="bg-white rounded-[20px] border border-zinc-100 p-6">
        <div className="flex items-center justify-between"><h3 className="font-bold text-[16px] text-[#0A1931]">Dernières lectures</h3><Link href="/" className="text-[12px] font-medium">Voir tout</Link></div>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {[1,2].map(i=>(
            <div key={i} className="rounded-[14px] bg-zinc-50 border border-zinc-100 p-4 flex gap-3"><img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200`} alt="" className="w-16 h-16 rounded-[10px] object-cover" /><div><div className="font-bold text-[13px] leading-tight">ZLECAf : le grand tournant</div><div className="text-[11px] text-zinc-500 mt-1">Lu il y a 2h • 5 min</div></div></div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[18px] bg-[#0A1931] p-6 text-white">
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#D4AF37]">Votre lien de parrainage</div>
          <div className="mt-3 h-11 rounded-full bg-white/10 border border-white/10 px-4 flex items-center text-[12px] font-mono truncate">{user ? `${typeof window!=='undefined' ? window.location.origin : ''}?ref=${user.affiliateCode}` : "..."}</div>
          <div className="text-[11px] text-zinc-400 mt-2">10% si non abonné, 25% si abonné • Retrait dès 150k F CFA</div>
        </div>
        <div className="rounded-[18px] bg-white border border-zinc-100 p-6">
          <div className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">Préférences</div>
          <div className="mt-3 flex gap-2"><span className="px-3 py-1.5 rounded-full bg-zinc-900 text-white text-[12px]">Langue: {user?.lang?.toUpperCase() || "FR"}</span><span className="px-3 py-1.5 rounded-full border border-zinc-200 text-[12px]">Devise: {user?.currency || "XOF"}</span></div>
          <div className="mt-3 text-[12px] text-zinc-600">Votre compte est sécurisé et vérifié. Double authentification disponible pour l'équipe éditoriale.</div>
        </div>
      </div>
    </div>
  );
}
