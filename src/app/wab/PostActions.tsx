"use client";

import { useState } from "react";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return { error: `Réponse serveur invalide (HTTP ${response.status}).` }; }
}

function formatCount(value: number) {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.max(0, Number(value) || 0));
}

export default function PostActions({ postId, initialLikes, initialComments, initialShares, views, canBoost = false, onComment }: { postId: string; initialLikes: number; initialComments: number; initialShares: number; views: number; canBoost?: boolean; onComment?: () => void }) {
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [shares, setShares] = useState(initialShares);
  const [liked, setLiked] = useState(false);
  const [notice, setNotice] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
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

  async function shareTo(destination: "story" | "feed" | "friend" | "whatsapp" | "facebook" | "linkedin" | "twitter" | "telegram" | "copy") {
    const canonicalBase =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || "https://envolafrica.vercel.app";
    const url = `${canonicalBase}/wab/posts/${postId}`;
    const shareText = "Découvrez cette publication sur World Africa Business (WAB)";

    if (destination === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} : ${url}`)}`, "_blank", "noopener,noreferrer");
    } else if (destination === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    } else if (destination === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    } else if (destination === "twitter") {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    } else if (destination === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
    } else if (destination === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setNotice("Lien de la publication copié !");
      } catch {
        window.prompt("Copiez le lien de la publication :", url);
      }
    } else if (destination === "story") {
      const storyResponse = await fetch("/api/wab/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl: url, mimeType: "text/plain", caption: "Publication partagée depuis WAB" }),
      });
      const storyData = await readJson(storyResponse);
      if (!storyResponse.ok) { setNotice(String(storyData.error || "Partage en Story impossible.")); return; }
      setNotice("Publication ajoutée à votre Story WAB.");
    } else if (destination === "friend" && typeof navigator.share === "function") {
      try { await navigator.share({ title: "Publication WAB", text: shareText, url }); } catch { return; }
      setNotice("Lien partagé.");
    } else if (destination === "feed") {
      const feedResponse = await fetch("/api/wab/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `Je partage cette publication WAB : ${url}`, type: "text", tags: ["Partage"] }),
      });
      const feedData = await readJson(feedResponse);
      if (!feedResponse.ok) { setNotice(String(feedData.error || "Publication dans le fil impossible.")); return; }
      setNotice("Publication repartagée dans le fil WAB.");
    }

    const response = await fetch(`/api/wab/posts/${postId}/share`, { method: "POST" });
    const data = await readJson(response);
    if (response.ok) setShares(Number(data.shares ?? shares));
    setShareOpen(false);
  }

  async function boost() {
    setBoosting(true); setNotice("");
    const response = await fetch("/api/wab/boosts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, budgetXof: budget, durationDays: days, targetCountries: countries.split(",").map((value) => value.trim()).filter(Boolean), targetIndustries: industries.split(",").map((value) => value.trim()).filter(Boolean) }) });
    const data = await readJson(response);
    if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
    if (!response.ok) { setNotice(typeof data.error === "string" ? data.error : "Promotion impossible."); setBoosting(false); return; }
    if (typeof data.checkoutUrl === "string") window.location.assign(data.checkoutUrl);
  }

  return <>
    <div className="flex items-center gap-1 border-t border-[#001325]/10 pt-3" aria-label="Actions de la publication">
      <button type="button" onClick={react} aria-label={`${liked ? "Retirer le j’aime" : "Aimer"}. ${formatCount(likes)} j’aime`} aria-pressed={liked} className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874] hover:bg-[#eefcfa] ${liked ? "text-[#006874]" : "text-[#43474d]"}`}><span className="material-symbols-outlined text-[20px]" aria-hidden="true">{liked ? "favorite" : "favorite_border"}</span><span>{formatCount(likes)}</span></button>
      <button type="button" onClick={onComment} aria-label={`Commenter. ${formatCount(comments)} commentaires`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-[#43474d] transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874] hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">chat_bubble</span><span>{formatCount(comments)}</span></button>
      <button type="button" onClick={() => setShareOpen((v) => !v)} aria-label={`Partager. ${formatCount(shares)} partages`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-[#43474d] transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874] hover:bg-[#eefcfa]"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">share</span><span>{formatCount(shares)}</span></button>
      <span aria-label={`${formatCount(views)} vues`} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-[#43474d]"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">visibility</span><span>{formatCount(views)}</span></span>
      {canBoost && <button type="button" onClick={() => window.location.assign(`/wab/campagnes?postId=${encodeURIComponent(postId)}`)} aria-expanded={false} className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#a36300] px-3 py-2 text-xs font-bold text-white transition active:scale-[.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a36300] hover:bg-[#875600]"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">campaign</span><span>Boost</span></button>}
    </div>

    {shareOpen && (
      <div className="mt-3 rounded-2xl border border-[#d1e9e6] bg-white p-4 shadow-lg animate-in fade-in zoom-in-95 duration-150" role="dialog" aria-label="Partager cette publication">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
          <p className="text-xs font-extrabold text-[#082843] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#006874]">share</span>
            <span>Partager cette publication</span>
          </p>
          <button type="button" onClick={() => setShareOpen(false)} className="h-6 w-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 grid place-items-center text-xs">
            ✕
          </button>
        </div>

        {/* Grille des réseaux sociaux avec icônes officielles */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => void shareTo("whatsapp")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all group"
            title="Partager sur WhatsApp"
          >
            <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.803-.414-1.275-.53-2.115-1.785-2.18-1.872-.064-.087-.514-.684-.514-1.304 0-.62.324-.925.44-.1.047.116.144.116.216.216.072.072.072.116.108.188.036.072.018.144-.009.216-.027.072-.116.188-.171.252-.054.063-.116.135-.054.243.063.108.279.46.603.747.414.37.765.486.873.54.108.054.171.045.234-.027.063-.072.27-.315.342-.423.072-.108.144-.09.243-.054.099.036.63.297.738.351.108.054.18.081.207.126.027.045.027.261-.117.666z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.31L2 22l4.82-1.5C8.31 21.46 10.1 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.25c-1.77 0-3.41-.55-4.78-1.48l-.34-.23-2.85.89.9-2.77-.25-.37A8.21 8.21 0 0 1 3.75 12c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-700">WhatsApp</span>
          </button>

          {/* LinkedIn */}
          <button
            type="button"
            onClick={() => void shareTo("linkedin")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-all group"
            title="Partager sur LinkedIn"
          >
            <div className="w-9 h-9 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.7a1.63 1.63 0 1 0 1.63 1.63c0-.9-.73-1.63-1.63-1.63z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-700">LinkedIn</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => void shareTo("facebook")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all group"
            title="Partager sur Facebook"
          >
            <div className="w-9 h-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-700">Facebook</span>
          </button>

          {/* X / Twitter */}
          <button
            type="button"
            onClick={() => void shareTo("twitter")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-black/5 hover:bg-black/15 transition-all group"
            title="Partager sur X (Twitter)"
          >
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-700">X (Twitter)</span>
          </button>

          {/* Telegram */}
          <button
            type="button"
            onClick={() => void shareTo("telegram")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 transition-all group"
            title="Partager sur Telegram"
          >
            <div className="w-9 h-9 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="text-[10px] font-bold text-gray-700">Telegram</span>
          </button>

          {/* Story WAB */}
          <button
            type="button"
            onClick={() => void shareTo("story")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-[#006874]/10 hover:bg-[#006874]/20 transition-all group"
            title="Ajouter à ma Story WAB"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#9e001f] to-[#006874] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-lg">auto_stories</span>
            </div>
            <span className="text-[10px] font-bold text-gray-700">Story WAB</span>
          </button>

          {/* Fil WAB */}
          <button
            type="button"
            onClick={() => void shareTo("feed")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-[#006874]/10 hover:bg-[#006874]/20 transition-all group"
            title="Repartager dans le fil d'actualité WAB"
          >
            <div className="w-9 h-9 rounded-full bg-[#006874] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-lg">dynamic_feed</span>
            </div>
            <span className="text-[10px] font-bold text-gray-700">Fil WAB</span>
          </button>

          {/* Copier le lien */}
          <button
            type="button"
            onClick={() => void shareTo("copy")}
            className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all group"
            title="Copier le lien"
          >
            <div className="w-9 h-9 rounded-full bg-[#082843] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-lg">link</span>
            </div>
            <span className="text-[10px] font-bold text-gray-700">Copier</span>
          </button>
        </div>
      </div>
    )}
    {showBoost && <div className="grid gap-2 rounded-xl bg-[#fff3dc] p-3 sm:grid-cols-[1fr_120px_auto]"><label className="text-xs font-bold text-slate-600">Budget XOF<input min="1" type="number" value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><label className="text-xs font-bold text-slate-600">Durée (jours)<input min="1" max="90" type="number" value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><button type="button" disabled={boosting} onClick={boost} className="self-end rounded-lg bg-[#a36300] px-3 py-2 text-xs font-bold text-white">{boosting ? "…" : "Payer et promouvoir"}</button><label className="sm:col-span-3 text-xs font-bold text-slate-600">Pays ciblés<input value={countries} onChange={(event) => setCountries(event.target.value)} placeholder="Bénin, Sénégal, Kenya" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label><label className="sm:col-span-3 text-xs font-bold text-slate-600">Secteurs ciblés<input value={industries} onChange={(event) => setIndustries(event.target.value)} placeholder="Finance, Tech, Agro" className="mt-1 w-full rounded-lg border p-2 text-sm" /></label></div>}
    {notice && <p className="text-xs font-semibold text-[#006874]" role="status">{notice}</p>}
  </>;
}
