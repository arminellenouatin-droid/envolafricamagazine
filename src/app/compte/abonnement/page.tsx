"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AbonnementComptePage() {
  const [user, setUser] = useState<any>(null);
  useEffect(()=>{ fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user)); },[]);
  const sub = user?.subscription;
  const plan = sub ? SUBSCRIPTION_PLANS.find(p=>p.id===sub.planId) : null;
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Mon abonnement</h1>
      {sub ? (
        <div className="bg-white rounded-[20px] border border-zinc-100 p-6">
          <div className="flex items-center justify-between">
            <div><div className="font-bold text-[18px] text-[#0A1931]">{plan?.name || sub.planId}</div><div className="text-[13px] text-zinc-600 mt-1">Statut: <span className="font-bold text-green-700">{sub.status}</span> • Début: {new Date(sub.startDate).toLocaleDateString('fr-FR')} • Fin: {new Date(sub.endDate).toLocaleDateString('fr-FR')}</div></div>
            <div className="text-right"><div className="text-[11px] uppercase font-bold text-zinc-500">Renouvellement auto</div><div className="text-[13px] font-bold mt-1">Activé</div></div>
          </div>
          <div className="mt-6 grid md:grid-cols-2 gap-3">
            <button className="h-11 rounded-full bg-zinc-900 text-white text-[13px] font-bold">Changer de formule</button>
            <button className="h-11 rounded-full border border-zinc-200 text-[13px] font-medium">Annuler (fin de période)</button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-zinc-100 p-10 text-center">
          <div className="font-bold text-[18px] text-[#0A1931]">Vous n'avez pas d'abonnement actif</div>
          <p className="text-[14px] text-zinc-600 mt-2">Abonnez-vous pour lire tous les articles en entier, écouter en audio et recevoir 1 magazine offert chaque mois.</p>
          <Link href="/abonnement" className="mt-6 inline-block h-11 px-6 rounded-full bg-[#0A1931] text-white font-bold text-[14px] leading-[44px]">Voir les offres →</Link>
        </div>
      )}
    </div>
  );
}
