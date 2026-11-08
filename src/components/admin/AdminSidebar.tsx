"use client";

import React from "react";
import Link from "next/link";
import SvgIcon from "@/components/ui/Icon";

export interface NavTabItem {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

export interface NavGroup {
  title: string;
  tabs: NavTabItem[];
}

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activePlatform: string;
  setActivePlatform: (platform: any) => void;
  adminPlatforms: Array<{ id: string; label: string; accent: string; badge?: string }>;
  user: {
    prenom: string;
    nom: string;
    email: string;
    role: string;
    twoFactorEnabled?: boolean;
  };
  counts: {
    articles: number;
    magazines: number;
    users: number;
    orders: number;
    categories: number;
    authors: number;
  };
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  activePlatform,
  setActivePlatform,
  adminPlatforms,
  user,
  counts,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const navGroups: NavGroup[] = [
    {
      title: "Pilotage & Analytics",
      tabs: [
        { id: "overview", label: "Vue d'ensemble & KPIs", icon: "insights" },
        { id: "landing", label: "Landing Vitrine", icon: "web" },
      ],
    },
    {
      title: "Contenu Éditorial",
      tabs: [
        { id: "articles", label: "Articles", icon: "newspaper", count: counts.articles },
        { id: "magazines", label: "Magazines & Kiosque", icon: "menu_book", count: counts.magazines },
        { id: "categories", label: "Catégories", icon: "category", count: counts.categories },
        { id: "redacteurs", label: "Rédacteurs & Équipe", icon: "groups", count: counts.authors },
        { id: "commentaires", label: "Commentaires", icon: "forum" },
      ],
    },
    {
      title: "Utilisateurs & Commerce",
      tabs: [
        { id: "users", label: "Utilisateurs & Rôles", icon: "manage_accounts", count: counts.users },
        { id: "orders", label: "Commandes & Ventes", icon: "receipt_long", count: counts.orders },
        { id: "abonnements", label: "Abonnements", icon: "card_membership" },
        { id: "affiliate", label: "Affiliation (MLM 5x5)", icon: "workspace_premium" },
      ],
    },
    {
      title: "Conformité & Système",
      tabs: [
        { id: "tarifs", label: "Tarifs & Monétisation", icon: "payments" },
        { id: "kyc", label: "Conformité KYC & AML", icon: "verified_user" },
        { id: "service", label: "Services & Rôles", icon: "handyman" },
        { id: "settings", label: "Configuration Système", icon: "settings" },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A1931] text-white">
      {/* Brand & User Profile in Sidebar */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo-blanc-footer.png" alt="Envol Africa" className="h-8 w-auto object-contain" />
            <div>
              <span className="block font-display font-black text-sm tracking-tight text-white">
                Admin Console
              </span>
              <span className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Envol Africa
              </span>
            </div>
          </Link>
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-white lg:hidden"
            >
              <SvgIcon name="close" className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Card */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#D4AF37] font-black text-[#0A1931] text-xs">
            {user.prenom ? user.prenom[0] : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-white">
              {user.prenom} {user.nom}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="capitalize">{user.role}</span>
              <span>•</span>
              <span className={user.twoFactorEnabled ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {user.twoFactorEnabled ? "✓ 2FA" : "⚠ 2FA"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Switcher */}
      <div className="p-4 border-b border-white/10 bg-black/15">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
          Volet Actif
        </label>
        <select
          value={activePlatform}
          onChange={(e) => {
            setActivePlatform(e.target.value);
            setActiveTab("overview");
          }}
          className="w-full rounded-xl border border-white/15 bg-[#102a4e] px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#D4AF37]"
        >
          {adminPlatforms.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0A1931] text-white">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Groups & Tabs */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-2">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                      isActive
                        ? "bg-[#D4AF37] text-[#0A1931] shadow-md font-black"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SvgIcon name={tab.icon} className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0A1931]" : "text-slate-400"}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    {typeof tab.count === "number" && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black shrink-0 ${
                          isActive ? "bg-[#0A1931]/15 text-[#0A1931]" : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Shortcut Links */}
      <div className="p-4 border-t border-white/10 space-y-1 text-xs bg-black/20">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <SvgIcon name="storefront" className="w-4 h-4 text-slate-400" />
          <span>Voir le site public</span>
        </Link>
        <Link
          href="/compte"
          className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
        >
          <SvgIcon name="manage_accounts" className="w-4 h-4 text-slate-400" />
          <span>Espace Mon Compte</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-800 h-[calc(100vh-65px)] sticky top-[65px] overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide Over) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
