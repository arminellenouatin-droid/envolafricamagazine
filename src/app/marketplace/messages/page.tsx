"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MarketplaceMessagesPage() {
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { setProductId(new URLSearchParams(window.location.search).get("product") || ""); }, []);
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    setSending(true); setStatus("");
    try {
      const response = await fetch("/api/marketplace/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, message, warningAcknowledged: acknowledged }) });
      const data = await response.json();
      setStatus(data.error || data.notice || "Message transmis.");
      if (response.ok) setMessage("");
    } catch { setStatus("La messagerie est temporairement indisponible."); }
    finally { setSending(false); }
  }

  return <main className="min-h-screen bg-[#fcf9f8] px-5 py-12 text-[#2a211a] md:px-10 lg:px-16"><div className="mx-auto max-w-3xl"><Link href="/marketplace" className="text-xs font-bold text-[#9e001f]">← Retour au Marketplace</Link><h1 className="mt-6 font-display text-4xl font-black">Messagerie protégée</h1><p className="mt-3 text-sm leading-6 text-[#725f4d]">Échangez avec un fournisseur sans quitter EAM. Chaque message et chaque média peuvent être contrôlés avant transmission.</p><div className="mt-8 rounded-[22px] border border-[#efc7c3] bg-[#fff5f3] p-5 text-sm leading-6 text-[#6f2722]"><strong>Attention :</strong> ne communiquez aucun e-mail, numéro de téléphone, lien, identifiant social ou moyen de contact externe. Les échanges et paiements réalisés hors plateforme ne sont pas couverts par la protection EAM.</div><form onSubmit={sendMessage} className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm"><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" required /><span>Je comprends que mon message reste dans la plateforme et sera soumis à la modération technique.</span></label><textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={1} maxLength={4000} placeholder="Écrivez votre demande au fournisseur…" className="mt-5 min-h-36 w-full rounded-xl border border-[#eadfce] bg-[#fcf9f8] p-4 text-sm outline-none focus:border-[#9e001f]" /><div className="mt-4 flex items-center justify-between gap-4"><span className="text-xs text-[#806c58]">Les coordonnées et liens externes sont automatiquement bloqués.</span><button disabled={sending} className="rounded-full bg-[#9e001f] px-6 py-3 text-xs font-black text-white disabled:opacity-50">{sending ? "Analyse…" : "Envoyer pour contrôle"}</button></div>{status && <p role="status" className="mt-4 rounded-lg bg-[#f5eee4] p-3 text-sm text-[#5d4a39]">{status}</p>}</form></div></main>;
}
