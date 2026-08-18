"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Tab = "dashboard" | "link" | "commissions" | "payout";

export default function AffiliationPage() {
  const [user, setUser] = useState<any>(null);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((data) => {
      setUser(data.user);
      if (data.user) fetch("/api/affiliate").then((r) => r.ok ? r.json() : { earnings: [] }).then((d) => setEarnings(d.earnings || []));
    });
  }, []);

  const isAffiliate = Boolean(user?.affiliateAccepted) || ["admin", "gerant", "redacteur", "redacteur_chef"].includes(user?.role);
  const affiliateLink = typeof window !== "undefined" && user ? `${window.location.origin}?ref=${user.affiliateCode}` : "";
  const total = useMemo(() => earnings.reduce((sum, item) => sum + Number(item.commission || 0), 0), [earnings]);
  const available = useMemo(() => earnings.filter((item) => item.status === "available").reduce((sum, item) => sum + Number(item.commission || 0), 0), [earnings]);

  async function activate() {
    setActivating(true); setNotice("");
    const response = await fetch("/api/affiliate/activate", { method: "POST" });
    const data = await response.json();
    if (!response.ok) setNotice(data.error || "Impossible d’activer l’affiliation.");
    else { setUser(data.user); setNotice("Affiliation activée. Vos outils sont maintenant disponibles."); }
    setActivating(false);
  }

  async function requestPayout() {
    const response = await fetch("/api/affiliate/withdraw", { method: "POST" });
    const data = await response.json();
    setNotice(response.ok ? "Votre demande de paiement a été enregistrée." : (data.error || "Impossible d’enregistrer la demande."));
  }

  async function copyLink() {
    if (!affiliateLink) return;
    await navigator.clipboard.writeText(affiliateLink); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (user && !isAffiliate) return <main className="min-h-screen bg-[#FFFCF5] px-4 py-14"><div className="mx-auto max-w-2xl rounded-[28px] border border-zinc-100 bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#0A1931] text-2xl text-white">↗</div><h1 className="mt-5 font-serif text-3xl font-black text-[#0A1931]">Devenir affilié Envol Africa</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-600">Promouvez le site avec votre lien personnel et recevez des commissions sur les abonnements et achats réalisés grâce à vous. Vous pourrez suivre vos résultats et demander un paiement depuis votre espace.</p><button onClick={activate} disabled={activating} className="mt-7 rounded-full bg-[#0A1931] px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{activating ? "Activation..." : "Oui, je veux m’affilier"}</button>{notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}<div className="mt-5"><Link href="/" className="text-sm text-zinc-500 underline">Pas maintenant</Link></div></div></main>;

  const tabs: Array<[Tab, string]> = [["dashboard", "Dashboard"], ["link", "Lien affilié"], ["commissions", "Commissions générées"], ["payout", "Demande de paiement"]];
  return <main className="min-h-screen bg-[#FFFCF5] px-4 py-10"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">Programme partenaire</p><h1 className="mt-2 font-serif text-4xl font-black text-[#0A1931]">Votre espace affiliation</h1><p className="mt-2 text-sm text-zinc-600">Partagez votre lien, suivez vos ventes et demandez vos commissions.</p></div><Link href="/compte" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-[#0A1931]">Retour au compte</Link></div><div className="mt-8 flex gap-2 overflow-x-auto border-b border-zinc-200">{tabs.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${tab === key ? "border-[#0A1931] text-[#0A1931]" : "border-transparent text-zinc-500"}`}>{label}</button>)}</div>{notice && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

{tab === "dashboard" && <div className="mt-6 grid gap-5 md:grid-cols-3"><div className="rounded-2xl bg-[#0A1931] p-6 text-white"><p className="text-xs text-white/60">Commissions générées</p><p className="mt-2 text-3xl font-black">{total.toLocaleString("fr-FR")} F</p></div><div className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-xs text-zinc-500">Disponible au paiement</p><p className="mt-2 text-3xl font-black text-emerald-700">{available.toLocaleString("fr-FR")} F</p></div><div className="rounded-2xl bg-[#D4AF37] p-6"><p className="text-xs text-[#0A1931]/70">Taux actuel</p><p className="mt-2 text-3xl font-black text-[#0A1931]">{user?.subscription?.status === "active" ? "25%" : "10%"}</p></div></div>}
{tab === "link" && <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-[#0A1931]">Votre lien affilié</h2><p className="mt-2 text-sm text-zinc-600">Utilisez ce lien pour promouvoir Envol Africa et attribuer les achats à votre compte.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><div className="min-w-0 flex-1 rounded-full bg-zinc-50 px-5 py-3 font-mono text-sm text-zinc-700">{affiliateLink}</div><button onClick={copyLink} className="rounded-full bg-[#0A1931] px-5 py-3 text-sm font-bold text-white">{copied ? "Copié" : "Copier le lien"}</button></div><div className="mt-4 flex flex-wrap gap-2"><a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Découvrez Envol Africa : ${affiliateLink}`)}`} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Partager sur WhatsApp</a><a target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(affiliateLink)}`} className="rounded-full bg-[#0A1931] px-4 py-2 text-xs font-bold text-white">Partager sur LinkedIn</a></div></section>}
{tab === "commissions" && <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-[#0A1931]">Commissions générées</h2>{earnings.length === 0 ? <p className="mt-6 rounded-xl bg-zinc-50 p-8 text-center text-sm text-zinc-500">Aucune commission pour le moment. Partagez votre lien pour commencer.</p> : <div className="mt-5 space-y-2">{earnings.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4"><div><p className="text-sm font-bold">Commande {String(item.orderId).slice(0, 8)}</p><p className="text-xs text-zinc-500">{new Date(item.createdAt).toLocaleDateString("fr-FR")} · {item.status}</p></div><strong className="text-emerald-700">+{Number(item.commission).toLocaleString("fr-FR")} F</strong></div>)}</div>}</section>}
{tab === "payout" && <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-[#0A1931]">Demande de paiement</h2><p className="mt-2 text-sm text-zinc-600">Le retrait est disponible à partir de 150 000 F CFA de commissions disponibles. Les paiements sont traités après vérification.</p><div className="mt-6 rounded-xl bg-zinc-50 p-5"><p className="text-sm">Montant disponible : <strong>{available.toLocaleString("fr-FR")} F CFA</strong></p><button onClick={requestPayout} disabled={available < 150000} className="mt-4 rounded-full bg-[#0A1931] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{available >= 150000 ? "Demander le paiement" : "Seuil de 150 000 F non atteint"}</button></div></section>}
</div></main>;
}
