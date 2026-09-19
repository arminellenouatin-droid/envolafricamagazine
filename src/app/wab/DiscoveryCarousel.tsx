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

            // Cards for Reels, Pages, Groups
            return (
              <article
                key={item.id}
                className="flex min-w-[214px] max-w-[240px] shrink-0 snap-start flex-col rounded-2xl border border-[#d8e2e6] bg-white p-3.5 shadow-sm transition hover:shadow-md"
              >
                <a href={item.href} className="flex min-w-0 items-center gap-3" aria-label={`Ouvrir ${item.title}`}>
                  {type === "reels" && item.mediaUrl ? (
                    <video
                      src={item.mediaUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-12 w-12 shrink-0 rounded-xl bg-[#001325] object-cover"
                      aria-label="Aperçu du Reel"
                    />
                  ) : item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-[#eefcfa] object-cover" loading="lazy" />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eefcfa] text-lg font-black text-[#006874]">
                      {item.title.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <strong className="block truncate text-xs font-extrabold text-[#082843]">{item.title}</strong>
                    <span className="mt-1 block truncate text-[10px] text-[#687274]">{item.subtitle}</span>
                  </span>
                </a>
                <div className="mt-auto pt-3">
                  {type === "pages" && item.targetPageId ? (
                    <FollowPageButton pageId={item.targetPageId} />
                  ) : type === "groups" ? (
                    <button
                      type="button"
                      onClick={() => joinGroup(item)}
                      disabled={joined[item.id]}
                      className="w-full rounded-xl bg-[#006874] px-3 py-2 text-[10px] font-extrabold text-white disabled:bg-[#d7e5e3] disabled:text-[#43474d]"
                    >
                      {joined[item.id] ? "Groupe rejoint" : "Rejoindre"}
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      className="block w-full rounded-xl border border-[#9adbd4] px-3 py-2 text-center text-[10px] font-extrabold text-[#006874] hover:bg-[#eefcfa]"
                    >
                      {type === "reels" ? "Regarder" : "Découvrir"}
                    </a>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
