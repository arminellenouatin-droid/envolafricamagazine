"use client";

import { useState } from "react";

export default function PostActions({ postId, initialLikes, comments, onComment }: { postId: string; initialLikes: number; comments: number; onComment?: () => void }) {
  const [likes, setLikes] = useState(initialLikes);
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
    const data = await response.json();
    if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
    if (response.ok) { setLiked(Boolean(data.liked)); setLikes(Number(data.likes ?? likes)); }
  }

  async function boost() {
    setBoosting(true); setNotice("");
    const response = await fetch("/api/wab/boosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, budgetXof: budget, durationDays: days, targetCountries: countries.split(",").map((value) => value.trim()).filter(Boolean), targetIndustries: industries.split(",").map((value) => value.trim()).filter(Boolean) }) });
    const data = await response.json();
    if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
    if (!response.ok) { setNotice(data.error || "Promotion impossible."); setBoosting(false); return; }
    if (data.checkoutUrl) window.location.assign(data.checkoutUrl);
  }

  async function share() {
    const url = `${window.location.origin}/wab#post-${postId}`;
    try { await navigator.clipboard.writeText(url); setNotice("Lien de la publication copié."); }
    catch { window.prompt("Copiez le lien de la publication", url); }
  }

  return <>
    <div className="flex items-center gap-1 border-t border-[#001325]/10 pt-3">
      <button type="button" onClick={react} aria-pressed={liked} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition hover:bg-[#eefcfa] ${liked ? "text-[#006874]" : "text-[#43474d]"}`}><span className="material-symbols-outlined text-[20px]">{liked ? "favorite" : "favorite_border"}</span><span>{likes > initialLikes ? likes : "Like"}</span></button>
      <button type="button" onClick={onComment} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-[#43474d] transition hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]">chat_bubble</span><span>Comment{comments ? ` · ${comments}` : ""}</span></button>
      <button type="button" onClick={share} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-[#43474d] transition hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]">share</span><span>Share</span></button>
      <button type="button" onClick={() => setShowBoost((value) => !value)} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-[#43474d] transition hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]">campaign</span><span>Promote</span></button>
    </div>
    {showBoost && <div className="grid gap-2 rounded-xl bg-[#fff3dc] p-3 sm:grid-cols-[1fr_120px_auto]"><label className="text-xs font-bold text-slate-600">Budget XOF<input min="1" type="number" value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">Durée (jours)<input min="1" max="90" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><button type="button" disabled={boosting} onClick={boost} className="self-end rounded-lg bg-[#a36300] px-3 py-2 text-xs font-bold text-white">{boosting ? "…" : "Payer et promouvoir"}</button><label className="sm:col-span-3 text-xs font-bold text-slate-600">Pays ciblés<input value={countries} onChange={(event) => setCountries(event.target.value)} placeholder="Bénin, Sénégal, Kenya" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><label className="sm:col-span-3 text-xs font-bold text-slate-600">Secteurs ciblés<input value={industries} onChange={(event) => setIndustries(event.target.value)} placeholder="Finance, Tech, Agro" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label></div>}
    {notice && <p className="text-xs font-semibold text-[#006874]">{notice}</p>}
  </>;
}
