"use client";

import Link from "next/link";
import SvgIcon from "@/components/ui/Icon";

export type WabUser = {
  id: string;
  nom?: string;
  prenom?: string;
  avatar?: string;
  role?: string;
};

const navItems: Array<{ label: string; href: string; icon: string; customIcon?: string }> = [
  { label: "Fil d'actualité", href: "/wab", icon: "newspaper" },
  { label: "Messagerie WAB", href: "/messages", icon: "chat", customIcon: "/wab-message-icon.webp" },
  { label: "Mon Réseau", href: "/wab/profil", icon: "group" },
  { label: "Salons & Événements", href: "/salons", icon: "forum" },
  { label: "Offres d'emploi", href: "/emploi", icon: "work" },
  { label: "Kiosque & Magazines", href: "/kiosque", icon: "menu_book" },
  { label: "Marketplace B2B", href: "/marketplace", icon: "storefront" },
  { label: "Programme d'affiliation", href: "/affiliation", icon: "handshake" },
  { label: "Espace Créateurs", href: "/wab/createur", icon: "workspace_premium" },
];

export default function WabSidebarCards({
  user,
  isBusiness = false,
  onUpgradeClick,
  onLinkClick,
  activeHref = "/wab",
}: {
  user: WabUser | null;
  isBusiness?: boolean;
  onUpgradeClick?: () => void;
  onLinkClick?: () => void;
  activeHref?: string;
}) {
  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Mon compte";
  const initials = displayName.split(/\s+/).filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "W";

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Profile Card with full KPIs */}
      <div className="overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white shadow-sm">
        {/* Cover Banner */}
        <div className="relative h-16 w-full bg-gradient-to-r from-[#00373e] via-[#006874] to-[#0a9396]">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
        </div>

        {/* Avatar & Header */}
        <div className="relative px-4 pb-4">
          <div className="-mt-9 mb-3 flex items-center justify-between">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-[#d7e5e3] shadow-md">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-lg font-bold text-[#006874]">{initials}</span>
              )}
            </div>
            {isBusiness ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
                <SvgIcon name="verified" className="w-3.5 h-3.5" /> Pro
              </span>
            ) : (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="inline-flex items-center gap-1 rounded-full bg-[#eefcfa] px-2.5 py-1 text-[11px] font-bold text-[#006874] transition hover:bg-[#d7f2ee]"
              >
                <SvgIcon name="workspace_premium" className="w-3.5 h-3.5" /> Passer Pro
              </button>
            )}
          </div>

          <Link href="/wab/profil" onClick={onLinkClick} className="group block">
            <h2 className="truncate font-display text-base font-bold text-[#001325] group-hover:text-[#006874] group-hover:underline">
              {displayName}
            </h2>
            <p className="truncate text-xs text-[#5f6368]">
              {user ? "Membre Envol Africa · Réseau WAB" : "Visiteur WAB"}
            </p>
          </Link>

          {/* Full KPIs Dashboard */}
          <div className="mt-4 border-t border-[#edf2f4] pt-3 text-xs">
            {/* Top Stat Tiles: Followers & Following */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#edf2f4]">
              <Link
                href="/wab/profil"
                onClick={onLinkClick}
                className="rounded-xl bg-[#f8fafb] p-2 text-center transition hover:bg-[#eefcfa]"
              >
                <span className="block font-extrabold text-[#006874] text-sm">328</span>
                <span className="block text-[10px] text-[#5f6368]">Abonnés</span>
              </Link>
              <Link
                href="/wab/profil"
                onClick={onLinkClick}
                className="rounded-xl bg-[#f8fafb] p-2 text-center transition hover:bg-[#eefcfa]"
              >
                <span className="block font-extrabold text-[#006874] text-sm">194</span>
                <span className="block text-[10px] text-[#5f6368]">Abonnements</span>
              </Link>
            </div>

            {/* Detailed KPIs list */}
            <div className="space-y-1.5 pt-2">
              <Link
                href="/wab/profil"
                onClick={onLinkClick}
                className="flex items-center justify-between py-1 text-[#5f6368] hover:text-[#006874] transition"
              >
                <span className="flex items-center gap-2">
                  <SvgIcon name="visibility" className="w-4 h-4 text-[#006874]" />
                  <span>Vues du profil</span>
                </span>
                <span className="font-bold text-[#006874]">142</span>
              </Link>

              <Link
                href="/wab/profil"
                onClick={onLinkClick}
                className="flex items-center justify-between py-1 text-[#5f6368] hover:text-[#006874] transition"
              >
                <span className="flex items-center gap-2">
                  <SvgIcon name="dynamic_feed" className="w-4 h-4 text-[#0284c7]" />
                  <span>Impressions du réseau</span>
                </span>
                <span className="font-bold text-[#006874]">1,8k</span>
              </Link>

              <div className="flex items-center justify-between py-1 text-[#5f6368]">
                <span className="flex items-center gap-2">
                  <SvgIcon name="favorite" className="w-4 h-4 text-[#e11d48]" />
                  <span>Mentions J'aime</span>
                </span>
                <span className="font-bold text-[#006874]">512</span>
              </div>

              <div className="flex items-center justify-between py-1 text-[#5f6368]">
                <span className="flex items-center gap-2">
                  <SvgIcon name="article" className="w-4 h-4 text-[#16a34a]" />
                  <span>Publications actives</span>
                </span>
                <span className="font-bold text-[#006874]">24</span>
              </div>
            </div>
          </div>

          {/* Premium banner link */}
          {!isBusiness && (
            <div className="mt-3 border-t border-[#edf2f4] pt-3">
              <button
                type="button"
                onClick={onUpgradeClick}
                className="w-full text-left rounded-xl bg-amber-50/80 p-2.5 transition hover:bg-amber-100/80 border border-amber-200/60"
              >
                <div className="flex items-center gap-2">
                  <SvgIcon name="stars" className="w-4 h-4 text-amber-700" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-amber-900">Accédez à WAB Entreprise</p>
                    <p className="text-[10px] text-amber-700">Vidéos illimitées & opportunités B2B</p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Navigation & Services Card */}
      <div className="overflow-hidden rounded-2xl border border-[#d8e2e6] bg-white p-3 shadow-sm">
        <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#82888e]">
          Navigation & Services
        </p>
        <nav className="flex flex-col gap-0.5 text-xs font-semibold" aria-label="Menu WAB">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  isActive
                    ? "bg-[#eefcfa] font-bold text-[#006874]"
                    : "text-[#43474d] hover:bg-[#f3f7f6] hover:text-[#001325]"
                }`}
              >
                {item.customIcon ? (
                  <img src={item.customIcon} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <SvgIcon name={item.icon || "explore"} className={`w-5 h-5 ${isActive ? "text-[#006874]" : "text-[#5f6368]"}`} />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user?.role === "admin" && (
          <div className="mt-2 border-t border-[#edf2f4] pt-2">
            <Link
              href="/wab/admin"
              onClick={onLinkClick}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#9e001f] transition hover:bg-red-50"
            >
              <SvgIcon name="admin_panel_settings" className="w-5 h-5 text-[#9e001f]" />
              <span>Administration WAB</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
