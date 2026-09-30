"use client";

import { useEffect, useRef, useState } from "react";
import FollowButton from "./FollowButton";
import FollowPageButton from "./FollowPageButton";
import MediaInteractions from "./MediaInteractions";

export type DiscoveryType =
  | "people"
  | "reels"
  | "pages"
  | "groups"
  | "certified_sellers"
  | "boosted_products"
  | "boosted_jobs"
  | "boosted_crowdfunding"
  | "awards_competitions";

export type DiscoveryItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  href: string;
  targetUserId?: string;
  targetGroupId?: string;
  targetPageId?: string;
  mediaUrl?: string;
  views?: number;
  likes?: number;
  badge?: string;
  rating?: number;
  price?: number;
  currency?: string;
  company?: string;
  fundedPercent?: number;
  contractType?: string;
  certificationStatus?: string;
};

const LABELS: Record<DiscoveryType, { eyebrow: string; title: string; icon: string; ctaHref?: string; ctaText?: string }> = {
  people: { eyebrow: "Réseau Professionnel", title: "Des personnes à connaître", icon: "person_add", ctaHref: "/wab/profil", ctaText: "Tout voir" },
  reels: { eyebrow: "Vidéos courtes", title: "Les réels du moment", icon: "play_circle" },
  pages: { eyebrow: "Entreprises & Marques", title: "Pages recommandées", icon: "business" },
  groups: { eyebrow: "Communautés d'affaires", title: "Groupes à rejoindre", icon: "groups" },
  certified_sellers: { eyebrow: "Marketplace B2B", title: "Boutiques & Vendeurs certifiés", icon: "verified", ctaHref: "/marketplace", ctaText: "Marketplace" },
  boosted_products: { eyebrow: "Sélection Marketplace", title: "Produits & Solutions sponsorisés", icon: "storefront", ctaHref: "/marketplace", ctaText: "Voir le kiosque" },
  boosted_jobs: { eyebrow: "Opportunités Carrières", title: "Offres d'emploi en vedette", icon: "work", ctaHref: "/emploi", ctaText: "Toutes les offres" },
  boosted_crowdfunding: { eyebrow: "Investissement & Projets", title: "Financements participatifs en cours", icon: "rocket_launch", ctaHref: "/financement", ctaText: "Explorer" },
  awards_competitions: { eyebrow: "Excellence Africaine", title: "Africa Awards — Concours & Votes", icon: "workspace_premium", ctaHref: "/africa-awards", ctaText: "Participer" },
};

function formatCompact(val?: number): string {
  return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(Math.max(0, Number(val) || 0));
}

export default function DiscoveryCarousel({ type }: { type: DiscoveryType }) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [activeReel, setActiveReel] = useState<DiscoveryItem | null>(null);
  const [reelMuted, setReelMuted] = useState(false);
  const [reelPaused, setReelPaused] = useState(false);
  const reelVideoRef = useRef<HTMLVideoElement>(null);

  function openReel(item: DiscoveryItem) {
    const nextViews = (item.views || 0) + 1;
    setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, views: nextViews } : r)));
    setActiveReel({ ...item, views: nextViews });
    setReelPaused(false);
    fetch(`/api/wab/reels/${encodeURIComponent(item.id)}/view`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.views === "number") {
          setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, views: data.views } : r)));
          setActiveReel((cur) => (cur && cur.id === item.id ? { ...cur, views: data.views } : cur));
        }
      })
      .catch(() => undefined);
  }

  async function likeReel(item: DiscoveryItem, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    try {
      const res = await fetch("/api/wab/media-interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType: "reel", mediaId: item.id, reaction: "love" }),
      });
      const data = await res.json().catch(() => ({}));
      if (typeof data?.totalLikes === "number") {
        setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, likes: data.totalLikes } : r)));
        setActiveReel((cur) => (cur && cur.id === item.id ? { ...cur, likes: data.totalLikes } : cur));
      } else {
        const nextLikes = (item.likes || 0) + 1;
        setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, likes: nextLikes } : r)));
        setActiveReel((cur) => (cur && cur.id === item.id ? { ...cur, likes: nextLikes } : cur));
      }
    } catch {}
  }

  useEffect(() => {
    let active = true;
    fetch(`/api/wab/discovery?type=${type}`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type]);

  async function joinGroup(item: DiscoveryItem) {
    if (!item.targetGroupId) return;
    setMessage("");
    try {
      const response = await fetch(`/api/wab/groups/${encodeURIComponent(item.targetGroupId)}/join`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Impossible de rejoindre ce groupe.");
      setJoined((current) => ({ ...current, [item.id]: true }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    }
  }

  function dismissItem(id: string) {
    setDismissed((prev) => ({ ...prev, [id]: true }));
  }

  const label = LABELS[type];
  const visibleItems = items.filter((item) => !dismissed[item.id]);

  if (!loading && !visibleItems.length) return null;

  return (
    <section className="rounded-2xl border border-[#d8e2e6] bg-white p-4 sm:p-5 shadow-sm" aria-label={label.title}>
      {/* Header with Title & Icon */}
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2f4] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#006874]">{label.eyebrow}</p>
          <h2 className="mt-0.5 font-display text-base sm:text-lg font-bold text-[#001325]">{label.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {label.ctaHref && (
            <a href={label.ctaHref} className="text-xs font-bold text-[#006874] hover:underline">
              {label.ctaText || "Tout voir"}
            </a>
          )}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#eefcfa] text-[#006874]">
            <span className="material-symbols-outlined text-[18px]">{label.icon}</span>
          </span>
        </div>
      </div>

      {message && <p role="alert" className="mt-2 text-xs font-semibold text-[#9e001f]">{message}</p>}

      {/* Horizontal Carousel */}
      <div className="mt-4 flex snap-x gap-3.5 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {loading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 w-48 animate-pulse rounded-2xl bg-[#f0f4f6]" />
            ))}
          </div>
        ) : (
          visibleItems.map((item) => {
            // 1. PEOPLE (LinkedIn-Style)
            if (type === "people") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[190px] sm:w-[205px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white text-center shadow-sm transition-all hover:border-[#b9ebe6] hover:shadow-md"
                >
                  <div className="relative h-14 w-full bg-gradient-to-r from-[#00373e] via-[#006874] to-[#0a9396]">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer la suggestion"
                      className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/60"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <div className="relative -mt-8 mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-[#eefcfa] shadow-md">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-lg font-bold text-[#006874]">
                        {item.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-3 pt-2 pb-3">
                    <a href={item.href} className="group/name block">
                      <strong className="block truncate font-display text-xs sm:text-sm font-bold text-[#001325] group-hover/name:text-[#006874] group-hover/name:underline">
                        {item.title}
                      </strong>
                    </a>
                    <p className="mt-1 line-clamp-2 h-7 text-[11px] leading-tight text-[#5f6368]">
                      {item.subtitle || "Membre Envol Africa · Réseau WAB"}
                    </p>

                    <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#82888e]">
                      <span className="material-symbols-outlined text-[13px] text-[#006874]">hub</span>
                      <span>Réseau Envol Africa</span>
                    </div>

                    <div className="mt-auto pt-3">
                      {item.targetUserId ? (
                        <div className="[&>button]:w-full [&>button]:rounded-full [&>button]:py-1.5 [&>button]:text-xs">
                          <FollowButton userId={item.targetUserId} />
                        </div>
                      ) : (
                        <a
                          href={item.href}
                          className="flex items-center justify-center gap-1.5 rounded-full border border-[#006874] px-3 py-1.5 text-xs font-bold text-[#006874] transition hover:bg-[#eefcfa]"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_add</span>
                          <span>Se connecter</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            }

            // 2. REELS (TikTok / Shorts 9:16 Style)
            if (type === "reels") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[170px] sm:w-[190px] h-[280px] sm:h-[310px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-[#001325] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl select-none"
                >
                  <button
                    type="button"
                    onClick={() => openReel(item)}
                    className="absolute inset-0 block w-full h-full text-left overflow-hidden cursor-pointer"
                    aria-label={`Regarder le Reel : ${item.title}`}
                  >
                    {item.mediaUrl ? (
                      <video
                        src={item.mediaUrl}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#002b36] via-[#073642] to-[#001f27]" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#006874]/80 group-hover:border-[#38b2ac]">
                        <span className="material-symbols-outlined text-[26px] ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_arrow
                        </span>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end text-left pointer-events-none">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#006874] text-[10px] font-black text-white ring-1 ring-white/50">
                          {item.subtitle.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-[11px] font-bold text-white/95 truncate drop-shadow-sm">
                          {item.subtitle}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-xs font-semibold text-white leading-tight drop-shadow-md">
                        {item.title}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-white/95">
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                          <span className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5" title="Nombre de vues">
                            <span className="material-symbols-outlined text-[13px] text-teal-300">visibility</span>
                            <span>{formatCompact(item.views)}</span>
                          </span>
                          <span
                            onClick={(e) => void likeReel(item, e)}
                            className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-rose-300 hover:bg-black/70 cursor-pointer transition active:scale-95"
                            title="Aimer ce Reel"
                          >
                            <span className="material-symbols-outlined text-[13px] text-rose-400">favorite</span>
                            <span>{formatCompact(item.likes)}</span>
                          </span>
                        </div>
                        <span className="rounded-full bg-[#006874] px-2 py-0.5 text-[9px] text-white font-bold shadow-sm">
                          Regarder
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="absolute inset-x-0 top-0 p-2.5 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white border border-white/20 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#e63946] animate-pulse" />
                      Reel
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dismissItem(item.id);
                      }}
                      aria-label="Ignorer ce Reel"
                      className="grid h-6 w-6 place-items-center rounded-full bg-black/50 backdrop-blur-md text-white/80 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/80 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                </article>
              );
            }

            // 3. PAGES (Corporate / Brand)
            if (type === "pages") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[210px] sm:w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#9adbd4] hover:shadow-lg"
                >
                  <div className="relative h-16 w-full bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#004d56]">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer cette page"
                      className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <div className="relative -mt-8 ml-3.5 flex items-end justify-between pr-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-[#eefcfa] text-base font-black text-[#006874]">
                          {item.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-[#eefcfa] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#006874] border border-[#b9ebe6]">
                      <span className="material-symbols-outlined text-[11px] text-[#006874]">verified</span>
                      Page
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col px-3.5 pt-2 pb-3.5">
                    <a href={item.href} className="group/link block">
                      <strong className="block truncate font-display text-sm font-bold text-[#001325] group-hover/link:text-[#006874] group-hover/link:underline">
                        {item.title}
                      </strong>
                    </a>
                    <p className="mt-1 line-clamp-2 h-7 text-[11px] leading-tight text-[#5f6368]">
                      {item.subtitle || "Entreprise & Marque officielle · WAB"}
                    </p>

                    <div className="mt-2.5 flex items-center gap-1 text-[10px] font-medium text-[#82888e]">
                      <span className="material-symbols-outlined text-[13px] text-[#006874]">corporate_fare</span>
                      <span>Écosystème Entreprise</span>
                    </div>

                    <div className="mt-auto pt-3">
                      {item.targetPageId ? (
                        <div className="[&>button]:w-full [&>button]:rounded-xl [&>button]:py-2 [&>button]:text-xs [&>button]:font-extrabold">
                          <FollowPageButton pageId={item.targetPageId} />
                        </div>
                      ) : (
                        <a
                          href={item.href}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#006874] bg-[#f8fdfd] px-3 py-2 text-center text-xs font-extrabold text-[#006874] transition hover:bg-[#006874] hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          <span>Découvrir</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            }

            // 4. GROUPS
            if (type === "groups") {
              return (
                <article
                  key={item.id}
                  className="group relative flex min-w-[214px] max-w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#9adbd4] hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#eefcfa] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#006874]">
                      <span className="material-symbols-outlined text-[11px]">groups</span>
                      Groupe
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer ce groupe"
                      className="grid h-5 w-5 place-items-center rounded-full text-[#82888e] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#f0f4f6]"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <a href={item.href} className="flex min-w-0 items-center gap-3" aria-label={`Ouvrir ${item.title}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-[#eefcfa] object-cover shadow-xs" loading="lazy" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eefcfa] text-lg font-black text-[#006874] shadow-xs">
                        {item.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-extrabold text-[#082843] group-hover:text-[#006874]">{item.title}</strong>
                      <span className="mt-1 block truncate text-[10px] text-[#687274]">{item.subtitle}</span>
                    </span>
                  </a>
                  <div className="mt-auto pt-3">
                    <button
                      type="button"
                      onClick={() => joinGroup(item)}
                      disabled={joined[item.id]}
                      className="w-full rounded-xl bg-[#006874] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#004d56] disabled:bg-[#d7e5e3] disabled:text-[#43474d]"
                    >
                      {joined[item.id] ? "Groupe rejoint" : "Rejoindre"}
                    </button>
                  </div>
                </article>
              );
            }

            // 5. VENDEURS CERTIFIÉS (MARKETPLACE SUPPLIERS)
            if (type === "certified_sellers") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[210px] sm:w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"
                >
                  <div className="relative h-16 w-full bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#059669]">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white border border-white/30">
                      <span className="material-symbols-outlined text-[12px] text-amber-300" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Certifié
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer ce vendeur"
                      className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <div className="relative -mt-8 ml-3.5 flex items-end justify-between pr-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-emerald-50 text-base font-black text-emerald-800">
                          {item.title.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {item.rating !== undefined && item.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <span className="material-symbols-outlined text-[13px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col px-3.5 pt-2 pb-3.5">
                    <a href={item.href} className="group/link block">
                      <strong className="block truncate font-display text-sm font-bold text-[#001325] group-hover/link:text-emerald-700 group-hover/link:underline">
                        {item.title}
                      </strong>
                    </a>
                    <p className="mt-1 line-clamp-2 h-7 text-[11px] leading-tight text-[#5f6368]">
                      {item.subtitle}
                    </p>

                    <div className="mt-auto pt-3">
                      <a
                        href={item.href}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-800 transition hover:bg-emerald-600 hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[15px]">storefront</span>
                        <span>Visiter la boutique</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            }

            // 6. PRODUITS BOOSTÉS (MARKETPLACE PRODUCTS)
            if (type === "boosted_products") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[190px] sm:w-[210px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700">
                        <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                      </div>
                    )}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500/95 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                      <span className="material-symbols-outlined text-[11px]">bolt</span>
                      Sponsorisé
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer ce produit"
                      className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <a href={item.href} className="group/link block">
                      <strong className="block truncate font-display text-xs sm:text-sm font-bold text-[#001325] group-hover/link:text-[#006874] group-hover/link:underline">
                        {item.title}
                      </strong>
                    </a>
                    <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-[#006874]">
                      {item.subtitle}
                    </p>

                    <div className="mt-auto pt-3">
                      <a
                        href={item.href}
                        className="flex w-full items-center justify-center gap-1 rounded-xl bg-[#006874] px-3 py-1.5 text-center text-xs font-bold text-white transition hover:bg-[#004d56]"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        <span>Voir l&apos;offre</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            }

            // 7. OFFRES D'EMPLOI BOOSTÉES (JOBS)
            if (type === "boosted_jobs") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[210px] sm:w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-sky-200 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-400 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-sky-800">
                      <span className="material-symbols-outlined text-[11px]">work</span>
                      {item.contractType || "Offre d'emploi"}
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer cette offre"
                      className="grid h-5 w-5 place-items-center rounded-full text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 my-1">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-sky-50 grid place-items-center shadow-xs">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
                      ) : (
                        <span className="material-symbols-outlined text-sky-700 text-xl">business_center</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <strong className="block truncate font-display text-xs sm:text-sm font-bold text-[#001325] group-hover:text-sky-700">
                        {item.title}
                      </strong>
                      <span className="block truncate text-[11px] text-slate-500 font-medium">
                        {item.company}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 line-clamp-2 h-7 text-[10px] leading-tight text-slate-500">
                    {item.subtitle}
                  </p>

                  <div className="mt-auto pt-3">
                    <a
                      href={item.href}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-700 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-sky-800"
                    >
                      <span className="material-symbols-outlined text-[15px]">send</span>
                      <span>Postuler</span>
                    </a>
                  </div>
                </article>
              );
            }

            // 8. CROWDFUNDING BOOSTÉ / EN COURS
            if (type === "boosted_crowdfunding") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[210px] sm:w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg"
                >
                  <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-teal-50 to-emerald-100 text-teal-700">
                        <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                      </div>
                    )}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-teal-600/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      Projet en cours
                    </span>
                    <button
                      type="button"
                      onClick={() => dismissItem(item.id)}
                      aria-label="Ignorer ce projet"
                      className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <a href={item.href} className="group/link block">
                      <strong className="block truncate font-display text-xs sm:text-sm font-bold text-[#001325] group-hover/link:text-teal-700 group-hover/link:underline">
                        {item.title}
                      </strong>
                    </a>
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                      {item.subtitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-teal-800 mb-1">
                        <span>Collecte</span>
                        <span>{item.fundedPercent || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{ width: `${Math.min(100, item.fundedPercent || 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-3">
                      <a
                        href={item.href}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 px-3 py-1.5 text-center text-xs font-bold text-teal-800 transition hover:bg-teal-600 hover:text-white"
                      >
                        <span className="material-symbols-outlined text-[14px]">handshake</span>
                        <span>Découvrir</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            }

            // 9. AWARDS COMPETITIONS
            return (
              <article
                key={item.id}
                className="group relative flex w-[210px] sm:w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-b from-[#091522] to-[#040911] text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl"
              >
                <div className="relative h-24 w-full overflow-hidden bg-black">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-amber-900/60 to-black text-amber-300">
                      <span className="material-symbols-outlined text-4xl">emoji_events</span>
                    </div>
                  )}
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black shadow-sm">
                    <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
                    {item.badge || "Africa Awards"}
                  </span>
                  <button
                    type="button"
                    onClick={() => dismissItem(item.id)}
                    aria-label="Ignorer ce concours"
                    className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white/80 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <a href={item.href} className="group/link block">
                    <strong className="block truncate font-display text-xs sm:text-sm font-bold text-amber-200 group-hover/link:underline">
                      {item.title}
                    </strong>
                  </a>
                  <p className="mt-1 line-clamp-2 h-7 text-[10px] leading-tight text-slate-300">
                    {item.subtitle}
                  </p>

                  <div className="mt-auto pt-3">
                    <a
                      href={item.href}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-center text-xs font-bold text-black shadow-sm transition hover:from-amber-400 hover:to-amber-500"
                    >
                      <span className="material-symbols-outlined text-[15px]">how_to_vote</span>
                      <span>Voter / Participer</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Reel Viewer Modal */}
      {activeReel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-2 sm:p-4 backdrop-blur-md"
          onClick={() => setActiveReel(null)}
        >
          <div
            className="relative h-[min(88vh,720px)] w-[min(94vw,410px)] overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-4 z-30 flex items-center justify-between px-4 text-white">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#006874] text-xs font-black text-white ring-2 ring-white">
                  {activeReel.subtitle.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="text-xs font-bold leading-none">{activeReel.subtitle}</p>
                  <div className="flex items-center gap-2 text-[10px] text-white/80 mt-1">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px] text-teal-300">visibility</span>
                      <span>{formatCompact(activeReel.views)}</span>
                    </span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => void likeReel(activeReel)}
                      className="flex items-center gap-0.5 text-rose-300 hover:text-rose-200 transition active:scale-95"
                      title="J'aime ce reel"
                    >
                      <span className="material-symbols-outlined text-[12px] text-rose-400">favorite</span>
                      <span>{formatCompact(activeReel.likes)}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReelMuted((m) => !m)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {reelMuted ? "volume_off" : "volume_up"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReel(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                  aria-label="Fermer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 w-full bg-black flex items-center justify-center cursor-pointer"
              onClick={() => {
                if (!reelVideoRef.current) return;
                if (reelVideoRef.current.paused) {
                  reelVideoRef.current.play();
                  setReelPaused(false);
                } else {
                  reelVideoRef.current.pause();
                  setReelPaused(true);
                }
              }}
            >
              {activeReel.mediaUrl ? (
                <video
                  ref={reelVideoRef}
                  src={activeReel.mediaUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={reelMuted}
                  className="h-full w-full object-contain"
                />
              ) : activeReel.imageUrl ? (
                <img src={activeReel.imageUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#002b36] to-[#001f27]" />
              )}

              {reelPaused && (
                <div className="absolute inset-0 grid place-items-center bg-black/30 pointer-events-none">
                  <span className="material-symbols-outlined text-6xl text-white/80">play_circle</span>
                </div>
              )}
            </div>

            <div className="relative z-30">
              <MediaInteractions
                mediaType="reel"
                mediaId={activeReel.id}
                caption={activeReel.title}
                onLikesCountChange={(newLikes) => {
                  setItems((prev) => prev.map((r) => (r.id === activeReel.id ? { ...r, likes: newLikes } : r)));
                  setActiveReel((cur) => (cur ? { ...cur, likes: newLikes } : null));
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
