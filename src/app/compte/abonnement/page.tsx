"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AbonnementComptePage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user)); }, []);
  const sub = user?.subscription;
  const plan = sub ? SUBSCRIPTION_PLANS.find((p) => p.id === sub.planId) : null;
  const active = sub?.status === "active" && sub.endDate && new Date(sub.endDate) > new Date();
  return <div className="space-y-6"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">Compte magazine</p><h1 className="mt-2 font-serif text-3xl font-black text-[#0A1931]">Mes abonnements</h1><p className="mt-2 text-sm text-zinc-600">Retrouvez vos formules, leur statut et leur date d’expiration.</p></div>{sub ? <section className="rounded-[22px] border border-zinc-100 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-wider text-zinc-400">Formule</p><h2 className="mt-1 text-2xl font-black text-[#0A1931]">{plan?.name || sub.planId}</h2><p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{active ? "Abonnement en cours" : "Abonnement expiré"}</p></div><div className="rounded-xl bg-zinc-50 p-4 text-right"><p className="text-[11px] uppercase font-bold text-zinc-500">Date d’expiration</p><p className="mt-1 text-lg font-black text-[#0A1931]">{sub.endDate ? new Date(sub.endDate).toLocaleDateString("fr-FR") : "Non définie"}</p></div></div><div className="mt-6 grid gap-3 border-t border-zinc-100 pt-5 text-sm text-zinc-600 sm:grid-cols-2"><p>Date de début : <strong className="text-[#0A1931]">{sub.startDate ? new Date(sub.startDate).toLocaleDateString("fr-FR") : "—"}</strong></p><p>Statut : <strong className="text-[#0A1931]">{sub.status}</strong></p></div><Link href="/abonnement" className="mt-6 inline-flex rounded-full bg-[#0A1931] px-5 py-3 text-sm font-bold text-white">{active ? "Gérer mon abonnement" : "Renouveler mon abonnement"}</Link></section> : <section className="rounded-[22px] border border-zinc-100 bg-white p-10 text-center shadow-sm"><h2 className="text-xl font-black text-[#0A1931]">Aucun abonnement actif</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">Vous pouvez continuer à acheter des magazines à l’unité ou choisir une formule pour profiter de vos avantages.</p><Link href="/abonnement" className="mt-6 inline-flex rounded-full bg-[#0A1931] px-5 py-3 text-sm font-bold text-white">Voir les formules</Link></section>}</div>;
}
