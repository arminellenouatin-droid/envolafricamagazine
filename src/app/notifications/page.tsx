"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  platform: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const PLATFORM_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bgLight: string; textBadge: string }
> = {
  system: {
    label: "Envol Africa",
    icon: "verified",
    color: "#9e001f",
    bgLight: "bg-[#fff1f2] dark:bg-[#34181a]",
    textBadge: "text-[#9e001f] dark:text-[#ffb4ab]",
  },
  magazine: {
    label: "Magazine Kiosque",
    icon: "auto_stories",
    color: "#c8102e",
    bgLight: "bg-[#fff1f2] dark:bg-[#34181a]",
    textBadge: "text-[#c8102e] dark:text-[#ffb4ab]",
  },
  wab: {
    label: "WAB Réseau",
    icon: "hub",
    color: "#0a66c2",
    bgLight: "bg-[#eef5fc] dark:bg-[#12283e]",
    textBadge: "text-[#0a66c2] dark:text-[#90caf9]",
  },
  jobs: {
    label: "Emploi & Talents",
    icon: "work",
    color: "#059669",
    bgLight: "bg-[#ecfdf5] dark:bg-[#063426]",
    textBadge: "text-[#059669] dark:text-[#6ee7b7]",
  },
  marketplace: {
    label: "Marketplace B2B",
    icon: "storefront",
    color: "#d97706",
    bgLight: "bg-[#fffbeb] dark:bg-[#392408]",
    textBadge: "text-[#d97706] dark:text-[#fcd34d]",
  },
  crowdfunding: {
    label: "Africa Crowdfunding",
    icon: "trending_up",
    color: "#7c3aed",
    bgLight: "bg-[#f5f3ff] dark:bg-[#281c47]",
    textBadge: "text-[#7c3aed] dark:text-[#c4b5fd]",
  },
  awards: {
    label: "Africa Awards",
    icon: "military_tech",
    color: "#d4af37",
    bgLight: "bg-[#fefce8] dark:bg-[#373010]",
    textBadge: "text-[#a16207] dark:text-[#fef08a]",
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const diff = (Date.now() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return "À l’instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return "Hier";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateString;
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les notifications.");
      setItems(data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
    );
  };

  const visibleItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.platform === filter)),
    [filter, items]
  );
  const unreadCount = items.filter((item) => !item.readAt).length;
  const availablePlatforms = Array.from(new Set(items.map((item) => item.platform)));

  return (
    <main className="min-h-screen bg-[#fcf9f8] px-4 pb-28 pt-8 text-[#221b1b] dark:bg-[#141416] dark:text-[#f8eeee] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#8a7675] dark:text-[#a09090]">
          <Link href="/" className="hover:text-[#9e001f] transition">
            Accueil
          </Link>
          <span>/</span>
          <span className="text-[#9e001f]">Centre de notifications</span>
        </div>

        {/* En-tête Professionnel UI/UX Pro Max */}
        <div className="mt-4 flex flex-col justify-between gap-4 border-b border-[#e5bdbb] pb-6 dark:border-[#382b2e] sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f6f3f2] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#9e001f] dark:bg-[#251f21]">
              <span className="h-2 w-2 rounded-full bg-[#9e001f] animate-pulse" />
              Flux d&apos;activité en temps réel
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black text-[#1d1b1b] dark:text-white">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b5353] dark:text-[#c4b5b5]">
              Alertes de marché, messages professionnels, opportunités d&apos;emploi et actualités éditoriales.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#9e001f]/10 px-3 py-1.5 text-xs font-black text-[#9e001f] dark:bg-[#9e001f]/30 dark:text-[#ffdad8]">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </span>
            )}
            <button
              type="button"
              onClick={markRead}
              disabled={!unreadCount}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#9e001f] px-4 text-xs font-black text-white shadow-xs transition hover:bg-[#c8102e] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        </div>

        {/* Filtres par Plateforme (Horizontal Scrollable Mobile) */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition shadow-2xs ${
              filter === "all"
                ? "border-[#9e001f] bg-[#9e001f] text-white shadow-sm"
                : "border-[#e5bdbb] bg-white text-[#5c403f] hover:bg-[#faf6f5] dark:border-[#382b2e] dark:bg-[#201b1d] dark:text-[#d7c2c2]"
            }`}
          >
            Toutes les alertes {unreadCount > 0 && `(${unreadCount})`}
          </button>
          {availablePlatforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform] || {
              label: platform,
              icon: "notifications",
              color: "#9e001f",
              bgLight: "bg-slate-100",
              textBadge: "text-slate-800",
            };
            const active = filter === platform;
            return (
              <button
                key={platform}
                type="button"
                onClick={() => setFilter(platform)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                  active
                    ? "border-[#9e001f] bg-[#9e001f] text-white shadow-sm"
                    : "border-[#e5bdbb] bg-white text-[#5c403f] hover:bg-[#faf6f5] dark:border-[#382b2e] dark:bg-[#201b1d] dark:text-[#d7c2c2]"
                }`}
              >
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* État de chargement élégant (Skeletons) */}
        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse flex items-start gap-4 rounded-2xl border border-[#ead8d5] bg-white p-4.5 dark:border-[#33282b] dark:bg-[#1f1a1c]"
              >
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/4 rounded-md bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          /* État vide soigné */
          <div className="mt-8 rounded-3xl border border-dashed border-[#d8c3c1] bg-white/70 p-12 text-center dark:border-[#382b2e] dark:bg-[#1a1618]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff2f1] text-[#9e001f] dark:bg-[#34181a]">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-lg font-black text-[#292323] dark:text-white">
              Vous êtes parfaitement à jour
            </h2>
            <p className="mt-2 text-xs text-[#746665] dark:text-[#a09090] max-w-md mx-auto">
              Aucune notification dans cette rubrique pour le moment. Vos futures alertes apparaîtront instantanément ici.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href="/wab"
                className="rounded-xl border border-[#d8c3c1] bg-white px-4 py-2 text-xs font-bold text-[#292323] hover:bg-[#faf7f6] dark:border-[#382b2e] dark:bg-[#201b1d] dark:text-white"
              >
                Fil d&apos;actualité WAB
              </Link>
              <Link
                href="/marketplace"
                className="rounded-xl border border-[#d8c3c1] bg-white px-4 py-2 text-xs font-bold text-[#292323] hover:bg-[#faf7f6] dark:border-[#382b2e] dark:bg-[#201b1d] dark:text-white"
              >
                Marketplace B2B
              </Link>
              <Link
                href="/emploi"
                className="rounded-xl border border-[#d8c3c1] bg-white px-4 py-2 text-xs font-bold text-[#292323] hover:bg-[#faf7f6] dark:border-[#382b2e] dark:bg-[#201b1d] dark:text-white"
              >
                Offres d&apos;emploi
              </Link>
            </div>
          </div>
        ) : (
          /* Liste de notifications enrichie */
          <div className="mt-6 space-y-3">
            {visibleItems.map((item) => {
              const isUnread = !item.readAt;
              const config = PLATFORM_CONFIG[item.platform] || {
                label: item.platform,
                icon: "notifications",
                color: "#9e001f",
                bgLight: "bg-[#fff1f2] dark:bg-[#34181a]",
                textBadge: "text-[#9e001f] dark:text-[#ffb4ab]",
              };

              return (
                <Link
                  key={`${item.platform}-${item.id}`}
                  href={item.link || "/notifications"}
                  className={`group relative flex items-start gap-4 rounded-2xl border p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isUnread
                      ? "border-[#9e001f]/30 bg-white shadow-xs dark:border-[#9e001f]/40 dark:bg-[#231b1e]"
                      : "border-[#ead8d5] bg-white/70 hover:bg-white dark:border-[#2d2427] dark:bg-[#1a1618] dark:hover:bg-[#201b1d]"
                  }`}
                >
                  {/* Point indicateur non lu */}
                  {isUnread && (
                    <span
                      className="absolute right-4 top-4.5 h-2.5 w-2.5 rounded-full bg-[#9e001f] shadow-xs"
                      aria-label="Non lu"
                    />
                  )}

                  {/* Icône de catégorie */}
                  <div
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.bgLight} transition group-hover:scale-105`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ color: config.color }}
                    >
                      {item.type.includes("message") ? "chat" : config.icon}
                    </span>
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${config.textBadge}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-[#8a7b7a] dark:text-[#9c8e8d]">●</span>
                      <span className="text-[10px] font-semibold text-[#8a7b7a] dark:text-[#9c8e8d]">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-1 font-display text-sm font-black text-[#1d1b1b] group-hover:text-[#9e001f] dark:text-white dark:group-hover:text-[#ffb4ab]">
                      {item.title}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-[#5c403f] dark:text-[#c4b5b5] line-clamp-2">
                      {item.body}
                    </p>
                  </div>

                  {/* Flèche d'action */}
                  <div className="self-center pl-1 text-[#aa8f8f] group-hover:text-[#9e001f] transition">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
