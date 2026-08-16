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
        fetch("/api/orders?userId=" + encodeURIComponent(d.user.id)).then(r=>r.ok ? r.json() : { orders: [] }).then(o=>setOrders(o.orders||[])).catch(()=>{});
        fetch("/api/affiliate").then(r=>r.ok ? r.json() : { earnings: [] }).then(e=>setEarnings(e.earnings||[])).catch(()=>{});
      }
    });
  },[]);

  const totalGains = earnings.reduce((s,e)=>s+e.commission,0);
  const isStaff = user && ["redacteur","redacteur_chef","gerant","admin"].includes(user.role);

  return (
    <div className="space-y-6">
      {isStaff && (
        <div className="rounded-[20px] bg-[#9e001f] p-6 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white text-[#9e001f] flex items-center justify-center font-black text-lg">⚙</div>
              <div>
                <div className="font-bold text-[16px]">Accès Administration</div>
                <div className="text-[13px] text-[#ffdad8] mt-1">Connecté en tant que <strong>{user.role}</strong> • {user.prenom} {user.nom} • Gestion complète du site</div>
                <div className="text-[11px] text-white/70 mt-1">Articles, magazines, KPIs, abonnements, commentaires, utilisateurs, commandes, affiliation, service, réglages & sécurité</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin" className="h-11 px-6 rounded-full bg-white text-[#9e001f] font-bold text-[13px] flex items-center gap-2 hover:bg-[#ffdad8] transition-colors shadow-lg">→ Administration complète</Link>
              <Link href="/2fa" className="h-11 px-4 rounded-full bg-white/10 border border-white/20 text-white text-[12px] font-medium hover:bg-white/20">2FA {user.twoFactorEnabled?"✓":"⚠"}</Link>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-bold text-[26px] text-[#1b1c1c]" style={{ fontFamily: "Montserrat" }}>Bonjour {user?.prenom} 👋</h1>
        <p className="text-[14px] text-[#5c403f] mt-1">Bienvenue dans votre espace personnel Envol Africa Magazine.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[18px] bg-white border border-[#e5bdbb] p-5"><div className="text-[11px] font-bold uppercase tracking-wide text-[#5c403f]">Abonnement</div><div className="font-bold text-[16px] mt-2 text-[#1b1c1c]">{user?.subscription?.status==="active" ? `${user.subscription.planId} • Actif` : "Aucun abonnement"}</div><Link href="/abonnement" className="mt-3 inline-block text-[12px] font-bold bg-[#303030] text-white px-3 py-1.5 rounded-full">{user?.subscription?.status==="active" ? "Gérer" : "S'abonner →"}</Link></div>
        <div className="rounded-[18px] bg-white border border-[#e5bdbb] p-5"><div className="text-[11px] font-bold uppercase tracking-wide text-[#5c403f]">Commandes</div><div className="font-bold text-[16px] mt-2 text-[#1b1c1c]">{orders.length} achats</div><div className="text-[12px] text-[#5c403f] mt-1">{orders.filter(o=>o.status==="paid").length} payées • {orders.filter(o=>o.status==="pending").length} en attente</div></div>
        <div className="rounded-[18px] bg-[#ffdad8] border border-[#e5bdbb] p-5"><div className="text-[11px] font-bold uppercase tracking-wide text-[#5c403f]">Gains parrainage</div><div className="font-black text-[22px] mt-2 text-[#1b1c1c]">{totalGains.toLocaleString()} F CFA</div><Link href="/compte/parrainage" className="mt-2 inline-block text-[12px] font-bold bg-[#1b1c1c] text-white px-3 py-1.5 rounded-full">Voir détails →</Link></div>
      </div>

      <div className="bg-white rounded-[20px] border border-[#e5bdbb] p-6">
        <div className="flex items-center justify-between"><h3 className="font-bold text-[16px] text-[#1b1c1c]" style={{ fontFamily: "Montserrat" }}>Dernières lectures</h3><Link href="/" className="text-[12px] font-medium text-[#9e001f]">Voir tout</Link></div>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {[1,2].map(i=>(
            <div key={i} className="rounded-[14px] bg-[#f6f3f2] border border-[#e5bdbb] p-4 flex gap-3"><img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200`} alt="" className="w-16 h-16 rounded-[10px] object-cover" /><div><div className="font-bold text-[13px] leading-tight">ZLECAf : le grand tournant</div><div className="text-[11px] text-[#5c403f] mt-1">Lu il y a 2h • 5 min</div></div></div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[18px] bg-[#303030] p-6 text-white">
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#ffdad8]">Votre lien de parrainage</div>
          <div className="mt-3 h-11 rounded-full bg-white/10 border border-white/10 px-4 flex items-center text-[12px] font-mono truncate">{user ? `${typeof window!=='undefined' ? window.location.origin : ''}?ref=${user.affiliateCode}` : "..."}</div>
          <div className="text-[11px] text-white/60 mt-2">10% si non abonné, 25% si abonné • Retrait dès 150k F CFA</div>
        </div>
        <div className="rounded-[18px] bg-white border border-[#e5bdbb] p-6">
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#5c403f]">Préférences & Sécurité</div>
          <div className="mt-3 flex gap-2"><span className="px-3 py-1.5 rounded-full bg-[#303030] text-white text-[12px]">Langue: {user?.lang?.toUpperCase() || "FR"}</span><span className="px-3 py-1.5 rounded-full border border-[#e5bdbb] text-[12px]">Devise: {user?.currency || "XOF"}</span></div>
          <div className="mt-3 text-[12px] text-[#5c403f]">Compte sécurisé. 2FA {user?.twoFactorEnabled?"activée ✓":"à activer pour équipe"}.</div>
          {isStaff && <Link href="/admin" className="mt-3 inline-block text-[12px] font-bold bg-[#9e001f] text-white px-4 py-2 rounded-full">→ Accès administration complète du site</Link>}
        </div>
      </div>
    </div>
  );
}
