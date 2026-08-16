/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function DecryptClient({ offerId, offerTitle }: { offerId: string; offerTitle: string }) {
  const [status, setStatus] = useState<"ready" | "loading" | "success" | "pending" | "error">("ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unlock = new URLSearchParams(window.location.search).get("unlock");
    if (!unlock) return;
    setStatus("loading");
    fetch(`/api/jobs/unlocks/${unlock}/verify`, { method: "POST" }).then((response) => response.json()).then((data) => {
      if (data.unlocked) { setStatus("success"); setMessage("Paiement confirmé. Les coordonnées de l’employeur sont maintenant décryptées."); }
      else { setStatus("pending"); setMessage("Votre paiement est en cours de confirmation. Actualisez cette page dans quelques instants."); }
    }).catch(() => { setStatus("error"); setMessage("Impossible de vérifier le paiement pour le moment."); });
  }, []);

  async function unlockOffer() {
    setStatus("loading"); setMessage("");
    try {
      const response = await fetch("/api/jobs/unlocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId }) });
      const data = await response.json();
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent(`/emploi/offres/${offerId}/decrypter`)}`); return; }
      if (!response.ok) throw new Error(data.error || "Paiement indisponible");
      if (data.unlocked) { setStatus("success"); setMessage("Cette offre est déjà décryptée dans votre compte."); return; }
      window.location.assign(data.checkoutUrl);
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Une erreur est survenue."); }
  }

  return <main className="min-h-screen bg-[#f7f8fa] py-12"><div className="mx-auto max-w-xl px-5"><Link className="text-sm font-bold text-[#087e8b]" href={`/emploi/offres/${offerId}`}>← Retour à l’offre</Link><section className="mt-5 rounded-3xl bg-white p-7 shadow-sm sm:p-10"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f7f5] text-2xl">🔐</div><p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#087e8b]">Décryptage sécurisé</p><h1 className="mt-2 font-display text-3xl font-extrabold text-[#071b36]">Postulez à cette opportunité</h1><p className="mt-4 text-slate-600">Vous allez déverrouiller les informations de contact et le moyen de candidature pour <strong>{offerTitle}</strong>.</p><div className="mt-7 rounded-2xl bg-slate-50 p-5"><div className="flex items-center justify-between"><span className="font-semibold text-slate-600">Décryptage d’une offre</span><strong className="text-2xl text-[#071b36]">200 XOF</strong></div><p className="mt-2 text-xs leading-5 text-slate-500">Paiement unique. Les coordonnées sont ensuite accessibles depuis votre espace Jobs.</p></div>{message && <p className={`mt-5 rounded-xl p-4 text-sm ${status === "success" ? "bg-emerald-50 text-emerald-800" : status === "error" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{message}</p>}{status !== "success" && <button onClick={unlockOffer} disabled={status === "loading"} className="mt-6 w-full rounded-xl bg-[#c91f3b] py-4 font-bold text-white disabled:opacity-60">{status === "loading" ? "Préparation du paiement…" : "Payer 200 XOF et décrypter"}</button>}{status === "success" && <Link href={`/emploi/offres/${offerId}`} className="mt-6 block w-full rounded-xl bg-[#087e8b] py-4 text-center font-bold text-white">Accéder à l’offre décryptée</Link>}<Link href="/emploi/abonnements" className="mt-5 block text-center text-sm font-bold text-[#087e8b]">Ou voir les abonnements candidat</Link></section></div></main>;
}
