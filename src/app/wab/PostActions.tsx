"use client";

import { useState } from "react";

async function readJson(response: Response): Promise<Record<string, any>> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try { return JSON.parse(raw) as Record<string, any>; } catch { return { error: `Réponse serveur invalide (HTTP ${response.status}).` }; }
}

function formatCount(value: number) {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.max(0, Number(value) || 0));
}

export default function PostActions({ postId, initialLikes, initialComments, initialShares, views, onComment }: { postId: string; initialLikes: number; initialComments: number; initialShares: number; views: number; onComment?: () => void }) {
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [shares, setShares] = useState(initialShares);
  const [liked, setLiked] = useState(false);
  const [notice, setNotice] = useState("");
  const [showBoost, setShowBoost] = useState(false);
  const [budget, setBudget] = useState(1000);
  const [days, setDays] = useState(7);
  const [countries, setCountries] = useState("");
  const [industries, setIndustries] = useState("");
  const [boosting, setBoosting] = useState(false);

  async function react() {
    const response = await fetch(`/api/wab/posts/${postId}/reaction`, { method: "POST" });
    const data = await readJson(response);
    if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
    if (response.ok) { setLiked(Boolean(data.liked)); setLikes(Number(data.likes ?? likes)); }
  }

  async function share() {
    const url = `${window.location.origin}/wab#post-${postId}`;
    const response = await fetch(`/api/wab/posts/${postId}/share`, { method: "POST" });
    const data = await readJson(response);
    if (!response.ok) { setNotice(data.error || "Partage impossible."); return; }
    setShares(Number(data.shares ?? shares));
    try { await navigator.clipboard.writeText(url); setNotice("Lien copié."); }
    catch { window.prompt("Copiez le lien de la publication", url); }
  }

  async function boost() {
    setBoosting(true); setNotice("");
    const response = await fetch("/api/wab/boosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, budgetXof: budget, durationDays: days, targetCountries: countries.split(",").map((value) => value.trim()).filter(Boolean), targetIndustries: industries.split(",").map((value) => value.trim()).filter(Boolean) }) });
    const data = await readJson(response);
    if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
    if (!response.ok) { setNotice(data.error || "Promotion impossible."); setBoosting(false); return; }
    if (data.checkoutUrl) window.location.assign(data.checkoutUrl);
  }

  return <>
    <div className="flex items-center gap-1 border-t border-[#001325]/10 pt-3" aria-label="Actions de la publication">
      <button type="button" onClick={react} aria-label={`${liked ? "Retirer le j’aime" : "Aimer"}. ${formatCount(likes)} j’aime`} aria-pressed={liked} className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874] hover:bg-[#eefcfa] ${liked ? "text-[#006874]" : "text-[#43474d]"}`}><span className="material-symbols-outlined text-[20px]" aria-hidden="true">{liked ? "favorite" : "favorite_border"}</span><span>{formatCount(likes)}</span></button>
      <button type="button" onClick={onComment} aria-label={`Commenter. ${formatCount(comments)} commentaires`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-[#43474d] transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874] hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat_bubble</span><span>{formatCount(comments)}</span></button>
      <button type="button" onClick={share} aria-label={`Partager. ${formatCount(shares)} partages`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-[#43474d] transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874] hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">share</span><span>{formatCount(shares)}</span></button>
      <span aria-label={`${formatCount(views)} vues`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#43474d]"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">visibility</span><span>{formatCount(views)}</span></span>
      <button type="button" onClick={() => window.location.assign(`/wab/campagnes?postId=${encodeURIComponent(postId)}`)} aria-expanded={false} className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#a36300] px-3 py-2 text-xs font-bold text-white transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a36300] hover:bg-[#875600]"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">campaign</span><span>Boost</span></button>
    </div>
    {showBoost && <div className="grid gap-2 rounded-xl bg-[#fff3dc] p-3 sm:grid-cols-[1fr_120px_auto]"><label className="text-xs font-bold text-slate-600">Budget XOF<input min="1" type="number" value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">Durée (jours)<input min="1" max="90" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><button type="button" disabled={boosting} onClick={boost} className="self-end rounded-lg bg-[#a36300] px-3 py-2 text-xs font-bold text-white">{boosting ? "…" : "Payer et promouvoir"}</button><label className="sm:col-span-3 text-xs font-bold text-slate-600">Pays ciblés<input value={countries} onChange={(event) => setCountries(event.target.value)} placeholder="Bénin, Sénégal, Kenya" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><label className="sm:col-span-3 text-xs font-bold text-slate-600">Secteurs ciblés<input value={industries} onChange={(event) => setIndustries(event.target.value)} placeholder="Finance, Tech, Agro" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label></div>}
    {notice && <p className="text-xs font-semibold text-[#006874]" role="status">{notice}</p>}
  </>;
}
