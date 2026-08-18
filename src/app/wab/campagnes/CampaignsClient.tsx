"use client";
import { useEffect, useState } from "react";

type Campaign = { id: string; budgetXof: number; durationDays: number; audienceType?: "community" | "public"; targetCountries: string[]; targetIndustries: string[]; status: string; startsAt?: string; endsAt?: string; post: { id?: string; content: string; views: number; likes: number; comments: number } | null };

async function readJson(response: Response) { const raw = await response.text(); if (!raw.trim()) return {} as Record<string, unknown>; try { return JSON.parse(raw) as Record<string, unknown>; } catch { return { error: "Réponse serveur invalide." }; } }

export default function CampaignsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState("");
  const [postId, setPostId] = useState("");
  const [budget, setBudget] = useState(1000);
  const [days, setDays] = useState(7);
  const [audienceType, setAudienceType] = useState<"community" | "public">("public");
  const [countries, setCountries] = useState("");
  const [industries, setIndustries] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const selectedPostId = new URLSearchParams(window.location.search).get("postId") || "";
    setPostId(selectedPostId);
    fetch("/api/wab/boosts").then(async (response) => { const data = await readJson(response); if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab/campagnes")}`); return null; } if (!response.ok) throw new Error(String(data.error || "Impossible de charger vos campagnes.")); return data; }).then((data) => data && setCampaigns(Array.isArray(data.campaigns) ? data.campaigns as Campaign[] : [])).catch((cause) => setError(cause instanceof Error ? cause.message : "Impossible de charger vos campagnes."));
  }, []);

  async function startBoost(event: React.FormEvent) {
    event.preventDefault(); if (!postId) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/wab/boosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, budgetXof: budget, durationDays: days, audienceType, targetCountries: countries.split(",").map((value) => value.trim()).filter(Boolean), targetIndustries: industries.split(",").map((value) => value.trim()).filter(Boolean) }) });
      const data = await readJson(response);
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
      if (!response.ok) throw new Error(String(data.error || "Impossible de créer la campagne."));
      if (typeof data.checkoutUrl === "string") window.location.assign(data.checkoutUrl);
      else window.location.assign("/wab/campagnes");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de créer la campagne."); setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f4f7f8] py-10"><div className="mx-auto max-w-5xl px-5"><p className="text-xs font-bold uppercase tracking-widest text-[#087e8b]">World Africa Business</p><h1 className="mt-2 font-display text-3xl font-extrabold text-[#082843]">Mes campagnes sponsorisées</h1><p className="mt-3 text-slate-600">Suivez la diffusion et les interactions de vos publications promues.</p>{postId && <form onSubmit={startBoost} className="mt-7 rounded-3xl border border-[#8ee0c0] bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold text-[#082843]">Booster cette publication</h2><p className="mt-2 text-sm text-slate-600">Définissez le budget, la durée et votre audience cible avant de passer au paiement.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700">Budget XOF<input min="1" type="number" value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label><label className="text-sm font-bold text-slate-700">Durée en jours<input min="1" max="90" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label><label className="text-sm font-bold text-slate-700">Portée<select value={audienceType} onChange={(event) => setAudienceType(event.target.value as "community" | "public")} className="mt-1 w-full rounded-xl border border-slate-300 p-3"><option value="public">Toute l’audience WAB</option><option value="community">Ma communauté uniquement</option></select></label><label className="text-sm font-bold text-slate-700">Pays ciblés<input value={countries} onChange={(event) => setCountries(event.target.value)} placeholder="Bénin, Sénégal, Kenya" className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label><label className="text-sm font-bold text-slate-700">Secteurs ciblés<input value={industries} onChange={(event) => setIndustries(event.target.value)} placeholder="Finance, Tech, Agro" className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label></div><button type="submit" disabled={busy} className="mt-5 rounded-xl bg-[#a36300] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Ouverture du paiement…" : "Continuer vers le paiement"}</button></form>}{error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}<div className="mt-7 space-y-4">{campaigns.map((campaign) => <article key={campaign.id} className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-[#fff1c9] px-3 py-1 text-xs font-bold text-[#875600]">{campaign.status}</span><p className="mt-4 line-clamp-2 font-semibold text-slate-800">{campaign.post?.content ?? "Publication indisponible"}</p></div><strong className="text-[#087e8b]">{campaign.budgetXof.toLocaleString("fr-FR")} XOF</strong></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-500">Vues</span><strong className="block text-xl">{campaign.post?.views ?? 0}</strong></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-500">Interactions</span><strong className="block text-xl">{(campaign.post?.likes ?? 0) + (campaign.post?.comments ?? 0)}</strong></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-xs text-slate-500">Durée</span><strong className="block text-xl">{campaign.durationDays} j</strong></div></div><p className="mt-4 text-xs text-slate-500">Portée : {campaign.audienceType === "community" ? "Communauté" : "Toute l’audience"} · Pays : {campaign.targetCountries.length ? campaign.targetCountries.join(", ") : "Tous"} · Secteurs : {campaign.targetIndustries.length ? campaign.targetIndustries.join(", ") : "Tous"}</p></article>)}{!campaigns.length && !postId && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">Vous n’avez pas encore de campagne WAB.</p>}</div></div></main>;
}
