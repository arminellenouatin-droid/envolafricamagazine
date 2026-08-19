"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MarketplaceBoutiquePage() {
  const [videoActive, setVideoActive] = useState(false);
  const [remaining, setRemaining] = useState(10);
  const [productId, setProductId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/marketplace/video-subscription", { cache: "no-store" }).then((response) => response.json()).then((data) => { setVideoActive(Boolean(data.active)); setRemaining(Number(data.remaining ?? 10)); }).catch(() => undefined); }, []);

  const activateVideo = async () => {
    setBusy(true); setError("");
    try { const response = await fetch("/api/marketplace/video-subscription", { method: "POST" }); const data = await response.json(); if (response.status === 401) { window.location.assign("/auth/login?next=/marketplace/boutique"); return; } if (!response.ok || !data.checkout_url) throw new Error(data.error || "Paiement indisponible."); window.location.assign(data.checkout_url); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d’activer l’option vidéo."); } finally { setBusy(false); }
  };

  const uploadVideo = async () => {
    if (!productId || !file) { setError("Sélectionnez un produit et une vidéo."); return; }
    if (file.size > 3 * 1024 * 1024) { setError("La vidéo doit peser au maximum 3 Mo."); return; }
    setBusy(true); setError(""); setMessage("");
    try { const form = new FormData(); form.append("productId", productId); form.append("file", file); const response = await fetch("/api/marketplace/products/video/upload", { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Upload impossible."); setMessage(`Vidéo associée au produit. Il vous reste ${data.remaining} publication(s) vidéo.`); setRemaining(Number(data.remaining)); setFile(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload impossible."); } finally { setBusy(false); }
  };

  return <main className="min-h-screen bg-[#fcf9f8] px-5 py-12 text-[#2a211a] md:px-10 lg:px-16"><div className="mx-auto max-w-5xl"><Link href="/marketplace" className="text-xs font-bold text-[#9e001f]">← Retour au Marketplace</Link><div className="mt-8 rounded-[28px] bg-[#2a211a] p-8 text-white md:p-12"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffca63]">Espace fournisseur</p><h1 className="mt-3 font-display text-4xl font-black">Développez votre boutique africaine</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/70">Publiez vos produits, activez le paiement échelonné et présentez vos offres avec une vidéo produit courte et contrôlée.</p></div>
    <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Option vidéo vendeur</p><h2 className="mt-1 font-display text-2xl font-black">5 000 XOF / mois</h2><p className="mt-2 text-sm leading-6 text-[#725f4d]">Jusqu’à 10 produits avec vidéo active. Chaque vidéo doit peser au maximum 3 Mo.</p></div>{videoActive ? <span className="rounded-full bg-[#e9f7f5] px-4 py-2 text-xs font-black text-[#087e8b]">Option active · {remaining} emplacement(s)</span> : <button type="button" onClick={() => void activateVideo()} disabled={busy} className="rounded-full bg-[#9e001f] px-5 py-3 text-xs font-black text-white disabled:opacity-60">{busy ? "Préparation…" : "Activer l’option vidéo"}</button>}</div></section>
    <section className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Fiche produit</p><h2 className="mt-1 font-display text-2xl font-black">Ajouter une animation vidéo</h2><p className="mt-2 text-sm leading-6 text-[#725f4d]">Saisissez l’identifiant du produit à modifier, puis choisissez une vidéo MP4, WebM ou MOV. La vidéo remplacera l’image principale sur la fiche client.</p><div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="text-xs font-bold text-[#5d4a39]">Identifiant du produit<input value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="UUID du produit" className="mt-2 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-sm outline-none" /></label><label className="text-xs font-bold text-[#5d4a39]">Vidéo (3 Mo max)<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs" /></label><button type="button" onClick={() => void uploadVideo()} disabled={!videoActive || busy || remaining <= 0} className="h-11 rounded-full bg-[#087e8b] px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Envoi…" : "Associer la vidéo"}</button></div>{message && <p className="mt-4 rounded-xl bg-[#e9f7f5] p-3 text-xs font-semibold text-[#087e8b]">{message}</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}</section>
    <div className="mt-6 grid gap-4 md:grid-cols-3"><div className="rounded-[22px] border border-[#eadfce] bg-white p-6"><span className="material-symbols-outlined text-3xl text-[#087e8b]">verified</span><h2 className="mt-4 font-display text-lg font-black">Certification</h2><p className="mt-2 text-sm leading-6 text-[#725f4d]">Profil contrôlé, badge de confiance et meilleure visibilité.</p></div><div className="rounded-[22px] border border-[#eadfce] bg-white p-6"><span className="material-symbols-outlined text-3xl text-[#a36300]">campaign</span><h2 className="mt-4 font-display text-lg font-black">Boost</h2><p className="mt-2 text-sm leading-6 text-[#725f4d]">Demande de promotion et diffusion dans le réseau WAB après validation.</p></div><div className="rounded-[22px] border border-[#eadfce] bg-white p-6"><span className="material-symbols-outlined text-3xl text-[#9e001f]">inventory_2</span><h2 className="mt-4 font-display text-lg font-black">Catalogue</h2><p className="mt-2 text-sm leading-6 text-[#725f4d]">Chaque publication passe par la revue des médias et du contenu.</p></div></div></div></main>;
}
