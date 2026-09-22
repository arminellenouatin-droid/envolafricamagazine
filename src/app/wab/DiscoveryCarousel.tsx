"use client";

import { useEffect, useState } from "react";
import FollowButton from "./FollowButton";
import FollowPageButton from "./FollowPageButton";

type DiscoveryType = "people" | "reels" | "pages" | "groups";
type DiscoveryItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  href: string;
  targetUserId?: string;
  targetGroupId?: string;
  targetPageId?: string;
  mediaUrl?: string;
};

const LABELS: Record<DiscoveryType, { eyebrow: string; title: string; icon: string }> = {
  people: { eyebrow: "Réseau Professionnel", title: "Des personnes à connaître", icon: "person_add" },
  reels: { eyebrow: "Vidéos courtes", title: "Les réels du moment", icon: "play_circle" },
  pages: { eyebrow: "Entreprises & Marques", title: "Pages recommandées", icon: "business" },
  groups: { eyebrow: "Communautés d'affaires", title: "Groupes à rejoindre", icon: "groups" },
};

export default function DiscoveryCarousel({ type }: { type: DiscoveryType }) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
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
          {type === "people" && (
            <a href="/wab/profil" className="text-xs font-bold text-[#006874] hover:underline">
              Tout voir
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
            // LinkedIn-Style "People you may know" Card
            if (type === "people") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[190px] sm:w-[205px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white text-center shadow-sm transition-all hover:border-[#b9ebe6] hover:shadow-md"
                >
                  {/* Decorative Cover Banner */}
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

                  {/* Circular Avatar with white border overlapping banner */}
                  <div className="relative -mt-8 mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-[#eefcfa] shadow-md">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-lg font-bold text-[#006874]">
                        {item.title.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Body: Name, Headline, Network insight */}
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

                    {/* LinkedIn Full-Width Action Button */}
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

            // Instagram / TikTok / Shorts Style 9:16 Card for Reels
            if (type === "reels") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[170px] sm:w-[190px] h-[280px] sm:h-[310px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-[#001325] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl select-none"
                >
                  {/* Background Video / Media or Gradient Fallback */}
                  <a href={item.href} className="absolute inset-0 block overflow-hidden" aria-label={`Regarder le Reel : ${item.title}`}>
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

                    {/* Gradient Overlays for optimal contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                    {/* Center Glass Play Badge */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur-md border border-white/30 text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#006874]/80 group-hover:border-[#38b2ac]">
                        <span className="material-symbols-outlined text-[26px] ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_arrow
                        </span>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end text-left pointer-events-none">
                      {/* Creator badge */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#006874] text-[10px] font-black text-white ring-1 ring-white/50">
                          {item.subtitle.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-[11px] font-bold text-white/95 truncate drop-shadow-sm">
                          {item.subtitle}
                        </span>
                      </div>

                      {/* Reel Caption */}
                      <p className="line-clamp-2 text-xs font-semibold text-white leading-tight drop-shadow-md">
                        {item.title}
                      </p>

                      {/* Views / Action Pill */}
                      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-white/80">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#2dd4bf]">play_circle</span>
                          <span>Reel WAB</span>
                        </span>
                        <span className="rounded-full bg-white/20 backdrop-blur-xs px-2 py-0.5 text-[9px] text-white">
                          Regarder
                        </span>
                      </div>
                    </div>
                  </a>

                  {/* Top Bar: "Reel" Pill & Dismiss Button */}
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

            // Corporate / Brand Card for Pages
            if (type === "pages") {
              return (
                <article
                  key={item.id}
                  className="group relative flex w-[210px] sm:w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#9adbd4] hover:shadow-lg"
                >
                  {/* Decorative Corporate Banner Header */}
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

                  {/* Overlapping Brand Logo Badge (Square with rounded-xl corners) */}
                  <div className="relative -mt-8 ml-3.5 flex items-end justify-between pr-3.5">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
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

                  {/* Body Content */}
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

                    {/* Action Button: FollowPageButton or Link */}
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

            // Cards for Groups
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
          })
        )}
      </div>
    </section>
  );
}
