"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPlatformKey, PLATFORM_CONFIGS, platformOptions, type PlatformConfig } from "@/lib/platforms";
import { internalBrowserHref } from "@/lib/internal-browser";
import { normalizeVisitorLocale, persistVisitorLocale, readPersistedVisitorLocale, type VisitorLocale } from "@/lib/visitor-locale";
import { getCountryFlag, getCountryFlagImgUrl } from "@/lib/country-data";
import { translate } from "@/lib/i18n";
import InboxToolbox, { type InboxToolboxTab } from "@/components/InboxToolbox";
import CartToolbox from "@/components/CartToolbox";
import WabSidebarCards from "@/components/wab/WabSidebarCards";
import { registerFirebaseMessaging, listenForForegroundMessages } from "@/lib/firebase-messaging-client";

type FeaturedArticle = { slug: string; title: string; image?: string; category?: string; summary?: string };
type MegaMenuConfig = { title?: string; description?: string; buyHref?: string; categories?: string[]; items?: Array<{ id?: string; title: string; mediaUrl?: string; href?: string; description?: string }> };

const firstLineMenus = [
  { name: "S'affilier", href: "/affiliation", icon: "group_add" },
  { name: "Kiosque", href: "/kiosque", icon: "menu_book" },
  { name: "Jobs", href: "/emploi", icon: "work" },
  { name: "Marketplace", href: "/marketplace", icon: "storefront" },
  { name: "Crowdfunding", href: "/financement", icon: "volunteer_activism" },
  { name: "Africa Awards", href: "/africa-awards", icon: "emoji_events" },
  { name: "Salons", href: "/salons", icon: "event_seat" },
  { name: "World Africa Business", href: "/wab", icon: "public" },
];

const mobilePrimaryNav = [
  { name: "Magazine", href: "/", icon: "menu_book" },
  { name: "WAB", href: "/wab", icon: "public" },
  { name: "Awards", href: "/africa-awards", icon: "emoji_events" },
  { name: "Market", href: "/marketplace", icon: "shopping_bag" },
  { name: "Finance", href: "/financement", icon: "volunteer_activism" },
];

const mobileSecondaryNav = [
  { name: "Jobs", href: "/emploi", icon: "work" },
  { name: "Kiosque", href: "/kiosque", icon: "storefront" },
  { name: "Profil", href: "/compte", icon: "account_circle" },
];

const LANGUAGE_OPTIONS = [
  { code: "fr", label: "Français 🇫🇷" },
  { code: "en", label: "English 🇬🇧" },
  { code: "es", label: "Español 🇪🇸" },
  { code: "pt", label: "Português 🇵🇹" },
  { code: "ar", label: "العربية 🇸🇦" },
  { code: "sw", label: "Kiswahili 🇹🇿" },
];
const CURRENCY_OPTIONS = [
  { code: "EUR", label: "Euros", symbol: "€", detail: "Zone Euro" },
  { code: "USD", label: "Dollars US", symbol: "$", detail: "États-Unis / International" },
  { code: "XOF", label: "Franc CFA", symbol: "FCFA", detail: "UEMOA (Bénin, CI, SN...)" },
  { code: "XAF", label: "Franc CFA", symbol: "FCFA", detail: "CEMAC (Cameroun, Gabon...)" },
  { code: "CAD", label: "Dollar CA", symbol: "CA$", detail: "Canada" },
  { code: "GBP", label: "Livre Sterling", symbol: "£", detail: "Royaume-Uni" },
  { code: "NGN", label: "Naira", symbol: "₦", detail: "Nigeria" },
  { code: "GHS", label: "Cedi", symbol: "₵", detail: "Ghana" },
  { code: "KES", label: "Shilling", symbol: "KSh", detail: "Kenya" },
  { code: "ZAR", label: "Rand", symbol: "R", detail: "Afrique du Sud" },
  { code: "MAD", label: "Dirham", symbol: "DH", detail: "Maroc" },
];

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

const sidePanelLinks = [
  { name: "Montage de plan d'affaires", href: "https://envolafrica.net/" },
  { name: "Conseils et externalisation", href: "https://envolafrica.net/" },
  { name: "Recrutement", href: "https://envolafrica.net/" },
  { name: "Formation et recyclage", href: "https://envolafrica.net/" },
  { name: "Levée de fonds", href: "https://envolafrica.net/" },
  { name: "Services digitaux", href: "https://envolafrica.net/" },
  { name: "Marketing et stratégie de vente", href: "https://envolafrica.net/" },
  { name: "Audit de gestion", href: "https://envolafrica.net/" },
  { name: "Gestion de projet", href: "https://envolafrica.net/" },
  { name: "Courtage", href: "https://envolafrica.net/" },
];

function MegaMenu({ platform, onClose, articles, config }: { platform: PlatformConfig; onClose: () => void; articles: FeaturedArticle[]; config?: MegaMenuConfig }) {
  if (platform.key === "magazine") {
    const configured = (config?.items || []).map((item) => ({ slug: "", title: item.title, image: item.mediaUrl, category: "À découvrir", href: item.href }));
    const sourceArticles = configured.length ? configured : articles;
    const main = sourceArticles.slice(0, 3);
    const side = sourceArticles.slice(3, 6);
    const categories = config?.categories?.length ? config.categories.slice(0, 6) : Array.from(new Set(articles.map((item) => item.category).filter(Boolean))).slice(0, 6);
    return <div className="absolute left-1/2 top-full z-[70] mt-3 w-[min(94vw,1080px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#d8c3c1] bg-[#fffdfc] shadow-[0_26px_70px_rgba(55,23,24,.22)]" onClick={(event) => event.stopPropagation()}><div className="border-b border-[#ead8d5] bg-[linear-gradient(135deg,#fff8f3,#f5e3dc)] px-7 py-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9e001f]">Magazine · édition en cours</p><h2 className="mt-1 font-serif text-3xl font-black text-[#2b2525]">{config?.title || "Nouveau numéro"}</h2><p className="mt-1 text-sm text-[#746665]">{config?.description || "Les idées, les visages et les analyses à ouvrir maintenant."}</p></div><button type="button" aria-label="Fermer le menu" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#9e001f] shadow-sm">×</button></div></div><div className="grid gap-5 p-6 lg:grid-cols-[1.6fr_.8fr]"><div className="grid gap-3 md:grid-cols-3">{(main.length ? main : [{ slug: "", title: "Les analyses du nouveau numéro" }]).map((article, index) => <Link key={`${article.slug || "empty"}-${index}`} href={(article as FeaturedArticle & { href?: string }).href || (article.slug ? `/article/${encodeURIComponent(article.slug)}` : "/") } onClick={onClose} className="group overflow-hidden rounded-2xl border border-[#ead8d5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className="h-28 overflow-hidden bg-[#ead8d5]">{article.image ? <img src={article.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center text-[#9e001f]"><span className="material-symbols-outlined text-3xl">menu_book</span></div>}</div><div className="p-3"><span className="text-[9px] font-black uppercase tracking-wider text-[#9e001f]">{article.category || "À découvrir"}</span><h3 className="mt-1 line-clamp-3 font-serif text-lg font-black leading-tight text-[#2b2525]">{article.title}</h3></div></Link>)}</div><div className="space-y-3">{(side.length ? side : main.slice(0, 3)).map((article, index) => <Link key={`${article.slug || "side"}-${index}`} href={(article as FeaturedArticle & { href?: string }).href || (article.slug ? `/article/${encodeURIComponent(article.slug)}` : "/") } onClick={onClose} className="group flex gap-3 border-b border-[#ead8d5] pb-3"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#ead8d5]">{article.image ? <img src={article.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" /> : <span className="grid h-full place-items-center text-[#9e001f]"><span className="material-symbols-outlined">article</span></span>}</div><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-wider text-[#9e001f]">{article.category || "Article"}</p><h3 className="mt-1 line-clamp-2 font-serif text-base font-black leading-tight text-[#2b2525]">{article.title}</h3></div></Link>)}</div></div><div className="flex flex-col gap-4 border-t border-[#ead8d5] bg-white px-6 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">{categories.length ? categories.map((category) => <Link key={category} href={`/recherche?q=${encodeURIComponent(category || "")}`} onClick={onClose} className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[#746665] hover:text-[#9e001f]">{category}</Link>) : <span className="text-[10px] font-bold text-[#746665]">Analyses · Économie · Entrepreneuriat · Société</span>}<Link href="/recherche" onClick={onClose} className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[#9e001f]">Voir plus →</Link></div><Link href={config?.buyHref || "/kiosque"} onClick={onClose} className="shrink-0 rounded-full bg-[#9e001f] px-5 py-3 text-center text-[11px] font-black text-white shadow-sm transition hover:bg-[#7f0019]">Acheter ce numéro</Link></div></div>;
  }

  if (platform.megaSections && platform.megaSections.length > 0) {
    return (
      <div
        className="absolute left-1/2 top-full z-[70] mt-3 w-[min(94vw,980px)] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#d8c3c1] bg-[#fffdfc] shadow-[0_26px_70px_rgba(55,23,24,.22)] animate-in fade-in zoom-in-95 duration-150"
        onClick={(event) => event.stopPropagation()}
      >
        {/* En-tête du MegaMenu */}
        <div
          className="border-b border-[#ead8d5] px-7 py-5"
          style={{
            background: `linear-gradient(135deg, #fffdfc 0%, ${platform.accentSoft} 100%)`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ backgroundColor: `${platform.accent}18`, color: platform.accent }}
                >
                  {platform.name}
                </span>
                <span className="text-[11px] font-semibold text-[#8b7d7b]">· Menu contextuel</span>
              </div>
              <h2 className="mt-1.5 font-serif text-2xl font-black text-[#2b2525]">
                {platform.megaTitle}
              </h2>
              <p className="mt-1 text-xs text-[#746665] max-w-[680px] leading-relaxed">
                {platform.megaDescription}
              </p>
            </div>
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#9e001f] shadow-sm transition hover:scale-105"
            >
              ×
            </button>
          </div>
        </div>

        {/* Grille 2 colonnes par catégorie */}
        <div className="grid gap-6 p-6 lg:grid-cols-2 bg-[#fffdfc]">
          {platform.megaSections.map((section) => (
            <div
              key={section.title}
              className="flex flex-col rounded-2xl border border-[#ead8d5]/80 bg-white p-4 shadow-xs"
            >
              {/* Titre de section */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#f0dedd]">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: `${platform.accent}14`, color: platform.accent }}
                >
                  <span className="material-symbols-outlined text-[19px]">{section.icon}</span>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#2b2525]">
                    {section.title}
                  </h3>
                  <p className="text-[10px] text-[#8b7d7b]">
                    {section.items.length} raccourcis dédiés
                  </p>
                </div>
              </div>

              {/* Liste des actions */}
              <div className="mt-2.5 flex-1 space-y-1.5">
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-start gap-3 rounded-xl p-2.5 transition-all duration-150 hover:bg-[#fff7f6] hover:border-[#ead2d0] border border-transparent"
                  >
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f8f5f4] text-[#746665] transition-all group-hover:scale-105 group-hover:bg-white group-hover:shadow-xs"
                      style={{ color: platform.accent }}
                    >
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-bold text-[#2b2525] group-hover:text-[#9e001f] transition-colors leading-tight">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                            style={{ backgroundColor: `${platform.accent}15`, color: platform.accent }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-[11px] text-[#746665] line-clamp-1 leading-snug">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined shrink-0 text-[16px] text-slate-300 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[#9e001f]">
                      chevron_right
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pied du menu */}
        <div className="flex flex-col gap-3 border-t border-[#ead8d5] bg-[#faf6f5] px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-[#746665]">
            <span className="material-symbols-outlined text-[17px]" style={{ color: platform.accent }}>
              verified
            </span>
            <span className="font-semibold">Portail officiel {platform.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={platform.homeHref}
              onClick={onClose}
              className="text-xs font-bold text-[#5c403f] hover:text-[#9e001f] hover:underline"
            >
              Accéder au flux {platform.name} →
            </Link>
            <Link
              href={platform.megaSections[0]?.items[0]?.href || platform.homeHref}
              onClick={onClose}
              className="rounded-full px-4 py-2 text-center text-[11px] font-black text-white shadow-xs transition hover:brightness-110"
              style={{ backgroundColor: platform.accent }}
            >
              Démarrer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <div className="absolute left-1/2 top-full z-[70] mt-3 w-[min(92vw,760px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#e5bdbb] bg-white shadow-2xl"><div className="border-b border-slate-100 px-5 py-4" style={{ backgroundColor: platform.accentSoft }}><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: platform.accent }}>{platform.name}</p><h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">{platform.megaTitle}</h2><p className="mt-1 text-sm text-slate-600">{platform.megaDescription}</p></div><button type="button" aria-label="Fermer le menu" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-slate-950">×</button></div></div><div className="grid gap-2 p-4 sm:grid-cols-2">{platform.megaItems.map((item) => <Link key={item.label} href={item.href} onClick={onClose} className="group flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-md" style={{ backgroundColor: `${platform.accentSoft}88` }}><span className="material-symbols-outlined text-[22px]" style={{ color: platform.accent }}>{item.icon}</span><span className="flex-1 text-sm font-bold text-slate-800">{item.label}</span><span className="text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true">→</span></Link>)}</div></div>;
}

export default function Header({ user }: { user?: { id: string; nom?: string; prenom?: string; email?: string; role?: string; avatar?: string } }) {
  const [pathname, setPathname] = useState("/");
  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname);
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    const notifyLocationChange = () => window.dispatchEvent(new Event("locationchange"));
    window.history.pushState = function (...args) { const result = originalPushState.apply(this, args as Parameters<History["pushState"]>); notifyLocationChange(); return result; };
    window.history.replaceState = function (...args) { const result = originalReplaceState.apply(this, args as Parameters<History["replaceState"]>); notifyLocationChange(); return result; };
    syncPathname();
    window.addEventListener("popstate", syncPathname);
    window.addEventListener("locationchange", syncPathname);
    return () => { window.history.pushState = originalPushState; window.history.replaceState = originalReplaceState; window.removeEventListener("popstate", syncPathname); window.removeEventListener("locationchange", syncPathname); };
  }, []);
  const platform = useMemo(() => PLATFORM_CONFIGS[getPlatformKey(pathname)], [pathname]);
  const mobileSecondaryActive = mobileSecondaryNav.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileLocaleOpen, setMobileLocaleOpen] = useState(false);
  const [mobileLocaleSection, setMobileLocaleSection] = useState<"currency" | "language" | null>(null);
  const [desktopLocaleMenu, setDesktopLocaleMenu] = useState<"currency" | "language" | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [cityWeather, setCityWeather] = useState({ city: "Cotonou", temp: "28°C", icon: "⛅" });
  const [notificationPrompt, setNotificationPrompt] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [wabToolsOpen, setWabToolsOpen] = useState(false);
  const [marketplaceToolsOpen, setMarketplaceToolsOpen] = useState(false);
  const [awardsToolsOpen, setAwardsToolsOpen] = useState(false);
  const [platformToolsOpen, setPlatformToolsOpen] = useState(false);
  const [inboxToolboxTab, setInboxToolboxTab] = useState<InboxToolboxTab | null>(null);
  const [cartToolboxOpen, setCartToolboxOpen] = useState(false);
  const [subscriptionToolsOpen, setSubscriptionToolsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visitorLocale, setVisitorLocale] = useState<VisitorLocale>(() => readPersistedVisitorLocale());
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [megaMenuConfig, setMegaMenuConfig] = useState<MegaMenuConfig>();
  const [scrollY, setScrollY] = useState(0);
  const [mobileContextBarVisible, setMobileContextBarVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      if (scrollStopTimer) {
        clearTimeout(scrollStopTimer);
      }

      if (currentScrollY <= 40) {
        setMobileContextBarVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Défilement vers le bas -> masquer pour libérer l'espace de lecture
        setMobileContextBarVisible(false);

        // Réapparaître après arrêt du défilement (inactivité ~320ms)
        scrollStopTimer = setTimeout(() => {
          setMobileContextBarVisible(true);
        }, 320);
      } else if (currentScrollY < lastScrollY) {
        // Défilement vers le haut -> réapparaître immédiatement
        setMobileContextBarVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollStopTimer) clearTimeout(scrollStopTimer);
    };
  }, []);

  const openPlatformToolbox = () => {
    if (platform.key === "wab") {
      setWabToolsOpen(true);
    } else if (platform.key === "marketplace") {
      setMarketplaceToolsOpen(true);
    } else if (platform.key === "awards") {
      setAwardsToolsOpen(true);
    } else {
      setPlatformToolsOpen(true);
    }
  };

  useEffect(() => {
    const refreshInboxCounts = async () => {
      try {
        const [notificationsResponse, messagesResponse] = await Promise.all([
          fetch("/api/notifications", { cache: "no-store" }),
          fetch("/api/messages", { cache: "no-store" }),
        ]);
        if (notificationsResponse.ok) setNotificationCount(Number((await notificationsResponse.json()).unreadCount || 0));
        if (messagesResponse.ok) setMessageCount(Number((await messagesResponse.json()).unreadCount || 0));
      } catch { /* Les badges restent à zéro si le réseau est indisponible. */ }
    };
    refreshInboxCounts();
    const interval = window.setInterval(refreshInboxCounts, 30000);
    window.addEventListener("visibilitychange", refreshInboxCounts);
    return () => { window.clearInterval(interval); window.removeEventListener("visibilitychange", refreshInboxCounts); };
  }, [user?.id]);

  useEffect(() => {
    setMegaMenuOpen(false);
    setDropdownOpen(false);
    setDesktopLocaleMenu(null);
    setMobileLocaleOpen(false);
    setMobileLocaleSection(null);
    setMobileNavOpen(false);
    setWabToolsOpen(false);
    setMarketplaceToolsOpen(false);
    setAwardsToolsOpen(false);
    setPlatformToolsOpen(false);
    setMobileNavOpen(false);
    setProfileOpen(false);
    setInboxToolboxTab(null);
    setCartToolboxOpen(false);
    setSubscriptionToolsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const loadVisitorLocale = async () => {
      try {
        const persisted = readPersistedVisitorLocale();
        const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const testCountry = urlParams?.get("country") || urlParams?.get("test_country");
        const geoUrl = testCountry ? `/api/geo?test_country=${encodeURIComponent(testCountry)}` : "/api/geo";

        const response = await fetch(geoUrl, { cache: "no-store" });
        if (!response.ok) return;
        const fetched = await response.json();
        const locale = normalizeVisitorLocale(fetched, persisted);
        setVisitorLocale(locale);
        persistVisitorLocale(locale);
      } catch { /* Le fallback local reste disponible si la détection échoue. */ }
    };
    loadVisitorLocale();
    const syncLocale = (event: Event) => setVisitorLocale(normalizeVisitorLocale((event as CustomEvent<VisitorLocale>).detail));
    window.addEventListener("ea-locale-updated", syncLocale);
    return () => window.removeEventListener("ea-locale-updated", syncLocale);
  }, []);

  useEffect(() => {
    if (platform.key !== "magazine" && platform.key !== "kiosque") { setFeaturedArticles([]); setMegaMenuConfig(undefined); return; }
    fetch("/api/magazine-landing", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ blocks?: Array<{ blockKey?: string; config?: MegaMenuConfig }> }> : Promise.reject(new Error("Landing indisponible"))).then((data) => setMegaMenuConfig(data.blocks?.find((block) => block.blockKey === "mega_menu")?.config)).catch(() => setMegaMenuConfig(undefined));
    let cancelled = false;
    fetch("/api/articles?featured=true", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ articles?: FeaturedArticle[] }> : Promise.reject(new Error("Articles indisponibles")))
      .then((data) => { if (!cancelled) setFeaturedArticles((data.articles || []).filter((article) => article.slug && article.title).slice(0, 8)); })
      .catch(() => { if (!cancelled) setFeaturedArticles([]); });
    return () => { cancelled = true; };
  }, [platform.key]);

  useEffect(() => {
    const readCart = () => {
      const saved = localStorage.getItem("eam_cart");
      if (!saved) return setCartCount(0);
      try { setCartCount(JSON.parse(saved).length); } catch { setCartCount(0); }
    };
    readCart();
    window.addEventListener("storage", readCart);
    window.addEventListener("eam-cart-updated", readCart);
    const interval = window.setInterval(readCart, 1000);
    const savedMode = localStorage.getItem("eam_dark_mode");
    const shouldUseDark = savedMode === "dark";
    setDarkMode(shouldUseDark);
    document.documentElement.classList.toggle("dark", shouldUseDark);

    const storedNotifications = localStorage.getItem("eam_notifications_enabled") === "true";
    setNotificationsEnabled(storedNotifications);
    const canNotify = "Notification" in window;
    if (canNotify && Notification.permission === "default" && !localStorage.getItem("eam_notifications_prompted")) {
      setNotificationPrompt(true);
    } else if (canNotify && Notification.permission === "granted") {
      setNotificationsEnabled(true);
      registerFirebaseMessaging().catch(() => {});
      listenForForegroundMessages().catch(() => {});
    }

    const fetchWeather = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
        const data = await response.json();
        if (data?.city) setCityWeather({ city: data.city, temp: "28°C", icon: "⛅" });
      } catch { /* La météo reste sur Cotonou en cas d’échec. */ }
    };
    fetchWeather();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", readCart);
      window.removeEventListener("eam-cart-updated", readCart);
    };
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("eam_dark_mode", next ? "dark" : "light");
  };

  const requestNotifications = async () => {
    localStorage.setItem("eam_notifications_prompted", "true");
    setNotificationPrompt(false);
    if (!("Notification" in window)) return;

    let fcmSuccess = false;
    try {
      await registerFirebaseMessaging();
      fcmSuccess = true;
      setNotificationsEnabled(true);
      localStorage.setItem("eam_notifications_enabled", "true");
      listenForForegroundMessages().catch(() => {});
    } catch {
      // Si Firebase Messaging n'est pas encore prêt ou en cas d'erreur de token, tentative Web Push fallback
    }

    if (!fcmSuccess) {
      try {
        const permission = await Notification.requestPermission();
        const enabled = permission === "granted";
        setNotificationsEnabled(enabled);
        localStorage.setItem("eam_notifications_enabled", String(enabled));
        if (enabled && "serviceWorker" in navigator && "PushManager" in window && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          const registration = await navigator.serviceWorker.register("/sw.js");
          const existing = await registration.pushManager.getSubscription();
          const subscription = existing || await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
          });
          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription),
          });
        }
      } catch {
        /* Le consentement navigateur reste valide même si le push serveur est indisponible. */
      }
    }
  };

  const dismissNotificationPrompt = () => {
    localStorage.setItem("eam_notifications_prompted", "true");
    setNotificationPrompt(false);
  };

  const displayName = user?.prenom || user?.nom || "Mon compte";
  const isMagazineExperience = platform.key === "magazine" || platform.key === "kiosque";
  const firstLineActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const platformToolItems = useMemo(() => {
    const roleItems = user?.role === "admin" ? [{ label: "Administration de la plateforme", href: platform.key === "magazine" ? "/admin" : platform.homeHref, icon: "admin_panel_settings" }] : user ? [{ label: "Mon espace personnel", href: "/compte", icon: "account_circle" }] : [];
    const sectionItems = platform.megaSections ? platform.megaSections.flatMap((s) => s.items) : platform.megaItems;
    const extras = platform.key === "magazine" ? [{ label: "Gérer les articles et magazines", href: "/admin", icon: "library_books" }, { label: "Voir mes abonnements", href: "/compte/abonnement", icon: "stars" }] : platform.key === "kiosque" ? [{ label: "Mes achats et lectures", href: "/compte/achats", icon: "receipt_long" }, { label: "S’abonner au Magazine", href: "/abonnement", icon: "stars" }] : platform.key === "jobs" ? [{ label: "Publier une offre", href: "/jobs/recruteur/offres/nouvelle", icon: "post_add" }, { label: "Gérer mes candidatures", href: "/jobs/candidat", icon: "badge" }] : platform.key === "crowdfunding" ? [{ label: "Lancer un projet", href: "/crowdfunding/demande", icon: "add_circle" }, { label: "Mon dashboard finance", href: "/crowdfunding/porteur", icon: "dashboard" }] : platform.key === "wab" ? [{ label: "Publier sur WAB", href: "/wab", icon: "edit_square" }, { label: "Mes messages WAB", href: "/wab/messages", icon: "mail" }] : [{ label: `Explorer ${platform.name}`, href: platform.homeHref, icon: "explore" }];
    return [...roleItems, ...sectionItems, ...extras].filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href && candidate.label === item.label) === index).slice(0, 10);
  }, [platform, user?.role, user?.id]);

  const awardsToolItems = useMemo(() => {
    const common = [
      { label: "Voter pour un nominé", href: "/africa-awards/competitions", icon: "how_to_vote" },
      { label: "Participer à un live", href: "/africa-awards/competitions", icon: "live_tv" },
      { label: "Découvrir les compétitions", href: "/africa-awards", icon: "emoji_events" },
    ];
    if (user?.role === "admin") return [
      { label: "Dashboard administrateur", href: "/africa-awards/admin/dashboard", icon: "dashboard" },
      { label: "Créer une compétition", href: "/africa-awards/admin/dashboard/competitions/new", icon: "add_circle" },
      { label: "Valider les candidatures", href: "/africa-awards/admin/dashboard/applications", icon: "fact_check" },
      { label: "Gérer les sessions live", href: "/africa-awards/admin/dashboard", icon: "live_tv" },
    ];
    if (user) return [
      { label: "Mon espace nominé", href: "/africa-awards/candidate/dashboard", icon: "badge" },
      { label: "Mes votes", href: "/africa-awards/my-votes", icon: "how_to_vote" },
      ...common,
    ];
    return common;
  }, [user?.role, user?.id]);

  return (
    <>
      <nav className="notranslate hidden items-center justify-between border-b border-[#d8c3c1] bg-white px-5 py-2 text-black lg:flex lg:px-[64px]" translate="no" style={{ fontFamily: "Century Gothic, Inter, sans-serif" }}>
        <div className="flex items-center gap-5 text-[12px] font-medium">
          {firstLineMenus.map((item) => <Link key={item.name} href={item.href} className={`flex items-center gap-1.5 transition-colors hover:text-[#9e001f] ${firstLineActive(item.href) ? "font-bold text-[#9e001f]" : ""}`}><span className="notranslate material-symbols-outlined text-[16px]" translate="no">{item.icon}</span>{item.name}</Link>)}
        </div>
        <div className="relative flex items-center gap-2">
          {/* Drapeau du pays localisé automatiquement */}
          <div
            className="flex items-center gap-1.5 rounded-full bg-[#f6f3f2] px-2.5 py-1 text-xs font-semibold text-[#242020] border border-[#eee2e0] cursor-default select-none shadow-sm"
            title={`Pays localisé automatiquement : ${visitorLocale.country} (${visitorLocale.countryCode})`}
          >
            <span className="notranslate flex items-center justify-center shrink-0 overflow-hidden" translate="no">
              {visitorLocale.countryCode ? (
                <img
                  src={getCountryFlagImgUrl(visitorLocale.countryCode)}
                  alt={visitorLocale.country || visitorLocale.countryCode}
                  className="h-3.5 w-5 rounded-[2px] object-cover shadow-[0_1px_2px_rgba(0,0,0,0.12)] inline-block"
                  loading="eager"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.parentElement) {
                      target.parentElement.innerText = getCountryFlag(visitorLocale.countryCode);
                    }
                  }}
                />
              ) : (
                <span role="img" aria-label="Monde">🌍</span>
              )}
            </span>
            <span className="font-bold text-[11px] text-[#4a3b3a]">
              {visitorLocale.countryCode}
            </span>
          </div>

          {/* Bouton et menu de choix de langue */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDesktopLocaleMenu((curr) => curr === "language" ? null : "language")}
              className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${desktopLocaleMenu === "language" ? "bg-[#f0eded] text-[#9e001f]" : "text-black hover:bg-[#f6f3f2] hover:text-[#9e001f]"}`}
              title={`Langue du site : ${visitorLocale.language.toUpperCase()} (Cliquer pour changer)`}
              aria-label={`Changer la langue du site (actuellement ${visitorLocale.language})`}
              aria-expanded={desktopLocaleMenu === "language"}
            >
              <span className="notranslate material-symbols-outlined text-[18px]" translate="no">translate</span>
            </button>
            {desktopLocaleMenu === "language" && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDesktopLocaleMenu(null)} />
                <div className="notranslate absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-[#e5bdbb] bg-white p-2.5 shadow-2xl text-black" translate="no">
                  <div className="flex items-center justify-between border-b border-[#f0e7e5] px-2 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                      {translate("common.language", visitorLocale.language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDesktopLocaleMenu(null)}
                      className="grid h-5 w-5 place-items-center rounded-full text-[#746665] hover:bg-[#f6f3f2] hover:text-black text-xs font-bold"
                      aria-label="Fermer"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = visitorLocale.language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            const next = { ...visitorLocale, language: lang.code, isManual: true };
                            setVisitorLocale(next);
                            persistVisitorLocale(next);
                            setDesktopLocaleMenu(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${isSelected ? "bg-[#f0eded] font-bold text-[#9e001f]" : "text-[#242020] hover:bg-[#fff7f6] hover:text-[#9e001f]"}`}
                        >
                          <span>{lang.label}</span>
                          {isSelected && <span className="notranslate material-symbols-outlined text-[16px] text-[#9e001f]" translate="no">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bouton et menu de choix de devise */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDesktopLocaleMenu((curr) => curr === "currency" ? null : "currency")}
              className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${desktopLocaleMenu === "currency" ? "bg-[#f0eded] text-[#9e001f]" : "text-black hover:bg-[#f6f3f2] hover:text-[#9e001f]"}`}
              title={`Devise du site : ${visitorLocale.currency} (Cliquer pour changer)`}
              aria-label={`Changer la devise (actuellement ${visitorLocale.currency})`}
              aria-expanded={desktopLocaleMenu === "currency"}
            >
              <span className="notranslate material-symbols-outlined text-[18px]" translate="no">payments</span>
            </button>
            {desktopLocaleMenu === "currency" && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDesktopLocaleMenu(null)} />
                <div className="notranslate absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#e5bdbb] bg-white p-3 shadow-2xl text-black" translate="no">
                  <div className="flex items-center justify-between border-b border-[#f0e7e5] px-1 pb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#9e001f]">
                        {translate("common.currency", visitorLocale.language)}
                      </span>
                      <p className="text-[11px] text-[#746665]">Sélectionnez votre devise</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDesktopLocaleMenu(null)}
                      className="grid h-5 w-5 place-items-center rounded-full text-[#746665] hover:bg-[#f6f3f2] hover:text-black text-xs font-bold"
                      aria-label="Fermer"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto">
                    {CURRENCY_OPTIONS.map((curr) => {
                      const isSelected = visitorLocale.currency === curr.code;
                      return (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            const next = { ...visitorLocale, currency: curr.code, isManual: true };
                            setVisitorLocale(next);
                            persistVisitorLocale(next);
                            setDesktopLocaleMenu(null);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                            isSelected
                              ? "border-[#9e001f] bg-[#f0eded] text-[#9e001f]"
                              : "border-[#f0e2e0] text-[#242020] hover:bg-[#fff7f6] hover:border-[#9e001f]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#f6f3f2] text-[11px] font-black text-[#9e001f]">
                              {curr.symbol}
                            </span>
                            <div className="text-left">
                              <span className="block font-bold">{curr.label} ({curr.code})</span>
                              <span className="block text-[10px] font-normal text-[#746665]">{curr.detail}</span>
                            </div>
                          </div>
                          {isSelected && <span className="notranslate material-symbols-outlined text-[16px] text-[#9e001f]" translate="no">check</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mode sombre / clair */}
          <button type="button" onClick={toggleDarkMode} className="grid h-8 w-8 place-items-center text-black transition-colors hover:text-[#9e001f]" title={darkMode ? translate("common.lightMode", visitorLocale.language) : translate("common.darkMode", visitorLocale.language)}><span className="notranslate material-symbols-outlined text-[18px]" translate="no">{darkMode ? "light_mode" : "dark_mode"}</span></button>
        </div>
      </nav>

      <header className="hidden sticky top-0 z-40 border-b border-[#e5bdbb] bg-[#fcf9f8] shadow-sm lg:block">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-5 lg:px-[64px]">
          <div className="flex min-w-0 items-center gap-3 lg:gap-6">
            <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`} className="flex shrink-0 items-center gap-2">
              <img src={platform.logoSrc} alt={platform.logoAlt} className="hidden h-[48px] w-auto object-contain lg:block" />
              <span className="font-display text-[21px] font-black tracking-tight lg:hidden" style={{ color: platform.accent }}>Envol Africa</span>
            </Link>

            <div className="relative hidden lg:block">
              <button type="button" aria-expanded={dropdownOpen} onClick={() => setDropdownOpen((open) => !open)} className="flex items-center gap-1 rounded px-3 py-2 text-[14px] font-black transition-colors hover:bg-[#f0eded]" style={{ fontFamily: "Century Gothic, sans-serif" }}>
                {platform.name}<span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {dropdownOpen && <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-[#e5bdbb] bg-white p-2 shadow-xl">{platformOptions.map((item) => <Link key={item.key} href={item.href} onClick={() => setDropdownOpen(false)} className={`block rounded-lg px-4 py-2.5 text-[13px] transition-colors hover:bg-[#f6f3f2] hover:text-[#9e001f] ${platform.key === item.key ? "bg-[#f0eded] font-bold text-[#9e001f]" : ""}`}>{item.name}</Link>)}</div>}
            </div>

            <div className="relative hidden lg:block" onMouseEnter={() => setMegaMenuOpen(true)} onMouseLeave={() => setMegaMenuOpen(false)}>
              <button type="button" aria-expanded={megaMenuOpen} onClick={() => setMegaMenuOpen((open) => !open)} className="flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110" style={{ backgroundColor: platform.accent }}>
                {platform.megaLabel}<span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {megaMenuOpen && <MegaMenu platform={platform} articles={featuredArticles} config={megaMenuConfig} onClose={() => setMegaMenuOpen(false)} />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 border-r border-[#e5bdbb] pr-3 lg:flex">
              <Link href="/panier" aria-label="Panier" className="relative grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">shopping_cart</span>{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[9px] font-bold text-white">{cartCount}</span>}</Link>
              <button type="button" onClick={() => setInboxToolboxTab((current) => current === "notifications" ? null : "notifications")} aria-label={`Notifications${notificationCount ? `, ${notificationCount} non lues` : ""}`} className={`relative grid h-9 w-9 place-items-center rounded-full hover:bg-[#e5bdbb] ${notificationsEnabled ? "bg-[#e9f7f5] text-[#087e8b]" : "bg-[#f6f3f2]"}`}><span className="material-symbols-outlined text-[20px]">notifications</span>{notificationCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[9px] font-bold text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}</button>
              <button type="button" onClick={() => setInboxToolboxTab((current) => current === "messages" ? null : "messages")} aria-label={`Messages${messageCount ? `, ${messageCount} non lus` : ""}`} className="relative grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">mail</span>{messageCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#006874] px-1 text-[9px] font-bold text-white">{messageCount > 99 ? "99+" : messageCount}</span>}</button>
              <button type="button" onClick={() => setInboxToolboxTab((current) => current === "favorites" ? null : "favorites")} aria-label="Favoris" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">favorite</span></button>
              <button type="button" onClick={() => setShowSearch((open) => !open)} aria-label="Rechercher" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">search</span></button>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              {user ? <div className="flex items-center gap-2"><Link href="/compte" aria-label={`Mon profil : ${displayName}`} title={displayName} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d8c3c1] bg-white text-[11px] font-bold text-[#9e001f] transition-colors hover:border-[#9e001f]">{user.avatar ? <img src={user.avatar} alt={`Photo de profil de ${displayName}`} className="h-full w-full object-cover" /> : `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}` || "M"}</Link><Link href="/compte" className="max-w-[120px] truncate font-sans text-[12px] font-bold text-[#302829] hover:text-[#9e001f]" title={displayName}>{displayName}</Link></div> : <Link href="/auth/login" className="rounded bg-[#dc2626] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#b91c1c]">Se connecter</Link>}
              <Link href="/abonnement" className="rounded bg-[#303030] px-4 py-2 text-[12px] font-bold text-white hover:bg-black">S'abonner</Link>
              <Link href="/don" className="rounded bg-[#16a34a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#15803d]">Faire un don</Link>
            </div>
            <button type="button" onClick={() => setSideMenuOpen(true)} aria-label="Ouvrir le menu" className="ml-1 grid h-10 w-10 place-items-center text-black transition-colors hover:text-[#9e001f]"><span className="material-symbols-outlined">menu</span></button>
          </div>
        </div>

        {showSearch && <div className="border-t border-[#e5bdbb] bg-white p-4"><form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) window.location.assign(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`); }} className="mx-auto flex max-w-[720px] gap-2"><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher..." className="h-11 flex-1 rounded-lg border bg-[#f6f3f2] px-4" /><button type="button" onClick={() => setShowSearch(false)} aria-label="Fermer la recherche" className="grid h-11 w-11 place-items-center rounded-full border">×</button></form></div>}
      </header>

      <InboxToolbox open={Boolean(inboxToolboxTab)} tab={inboxToolboxTab || "notifications"} platform={platform.key} onClose={() => setInboxToolboxTab(null)} />
      <CartToolbox open={cartToolboxOpen} onClose={() => setCartToolboxOpen(false)} />
      {isMagazineExperience && <section className="hidden items-center overflow-hidden border-b border-black bg-black py-2 lg:flex">
        <div className="flex w-full items-center px-5 lg:px-[64px]">
          <span className="mr-4 shrink-0 bg-[#9e001f] px-3 py-1 text-[12px] font-bold tracking-wider text-white">À LA UNE</span>
          <div className="flex-1 overflow-hidden"><div className="scrolling-ticker text-[13px] font-black text-white" style={{ fontFamily: "Century Gothic, sans-serif" }}>{featuredArticles.length > 0 ? featuredArticles.map((article, index) => <span key={article.slug}><span aria-hidden="true">• </span><Link href={`/article/${encodeURIComponent(article.slug)}`} className="transition-colors hover:text-[#ffdad8] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]">{article.title}</Link>{index < featuredArticles.length - 1 && <span aria-hidden="true"> </span>}</span>) : <span>• Les dernières analyses et opportunités africaines arrivent bientôt</span>}</div></div>
          <div className="ml-4 flex items-center gap-2 whitespace-nowrap text-[12px] font-bold text-white"><span className="material-symbols-outlined text-[16px]">location_on</span>{cityWeather.city} • {cityWeather.temp} {cityWeather.icon}</div>
        </div>
      </section>}

      <div className="mobile-header-stack md:hidden">
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-around border-b border-[#e5bdbb] bg-[#fcf9f8] px-2 py-2">
          {[platform.key === "wab" ? { icon: "podcasts", label: "Live", href: "/wab" } : { icon: "stars", label: "S'abonner", href: "#subscription-tools" }, { icon: "shopping_cart", label: "Panier", href: "#cart-toolbox" }, { icon: "favorite_border", label: "Favoris", href: "#inbox-favorites" }, { icon: "mail_outline", label: "Message", href: "#inbox-messages" }, { icon: "notifications_none", label: "Notif", href: "#inbox-notifications" }, { icon: platform.key === "wab" || platform.key === "marketplace" || platform.key === "awards" || ["magazine", "kiosque", "jobs", "crowdfunding", "salons"].includes(platform.key) ? "construction" : "translate", label: platform.key === "wab" || platform.key === "marketplace" || platform.key === "awards" || ["magazine", "kiosque", "jobs", "crowdfunding", "salons"].includes(platform.key) ? "Outils" : "Trad", href: platform.key === "wab" ? "#wab-tools" : platform.key === "marketplace" ? "#marketplace-tools" : platform.key === "awards" ? "#awards-tools" : "#platform-tools" }, { icon: "account_circle", label: "Profil", href: "#profile" }].map((item) => item.href === "#subscription-tools" ? <button type="button" key={item.label} onClick={() => setSubscriptionToolsOpen((open) => !open)} aria-expanded={subscriptionToolsOpen} aria-label="Ouvrir les options d’abonnement et de don" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">stars</span></span><span className="text-[9px] font-medium">S’abonner</span></button> : item.href === "#cart-toolbox" ? <button type="button" key={item.label} onClick={() => setCartToolboxOpen((open) => !open)} aria-expanded={cartToolboxOpen} aria-label="Ouvrir le panier" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">shopping_cart</span>{cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[8px] font-bold text-white">{cartCount}</span>}</span><span className="text-[9px] font-medium">Panier</span></button> : item.href.startsWith("#inbox-") ? <button type="button" key={item.label} onClick={() => setInboxToolboxTab((current) => current === item.href.replace("#inbox-", "") as InboxToolboxTab ? null : item.href.replace("#inbox-", "") as InboxToolboxTab)} aria-expanded={inboxToolboxTab === item.href.replace("#inbox-", "")} aria-label={`Ouvrir ${item.label}`} className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">{item.icon}</span>{item.label === "Notif" && notificationCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[8px] font-bold text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}{item.label === "Message" && messageCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#006874] px-1 text-[8px] font-bold text-white">{messageCount > 99 ? "99+" : messageCount}</span>}</span><span className="text-[9px] font-medium">{item.label}</span></button> : item.href === "#wab-tools" ? <button type="button" key={item.label} onClick={() => setWabToolsOpen((open) => !open)} aria-expanded={wabToolsOpen} aria-label="Ouvrir la boîte à outils WAB" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">{item.icon}</span></span><span className="text-[9px] font-medium">{item.label}</span></button> : item.href === "#marketplace-tools" ? <button type="button" key={item.label} onClick={() => setMarketplaceToolsOpen((open) => !open)} aria-expanded={marketplaceToolsOpen} aria-label="Ouvrir la boîte à outils Marketplace" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">construction</span></span><span className="text-[9px] font-medium">Outils</span></button> : item.href === "#awards-tools" ? <button type="button" key={item.label} onClick={() => setAwardsToolsOpen((open) => !open)} aria-expanded={awardsToolsOpen} aria-label="Ouvrir la boîte à outils Africa Awards" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">construction</span></span><span className="text-[9px] font-medium">Outils</span></button> : item.href === "#platform-tools" ? <button type="button" key={item.label} onClick={() => setPlatformToolsOpen((open) => !open)} aria-expanded={platformToolsOpen} aria-label={`Ouvrir les outils ${platform.name}`} className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">construction</span></span><span className="text-[9px] font-medium">Outils</span></button> : item.href === "#profile" ? <button type="button" key={item.label} onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Ouvrir le profil" className="relative flex flex-col items-center gap-0.5"><span className="relative">{user?.avatar ? <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="material-symbols-outlined text-[20px]">account_circle</span>}</span><span className="text-[9px] font-medium">Profil</span></button> : <Link key={item.label} href={item.href} className="relative flex flex-col items-center gap-0.5"><span className="relative">{item.label === "Profil" && user?.avatar ? <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="material-symbols-outlined text-[20px]">{item.icon}</span>}{item.label === "Panier" && cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[9px] font-bold text-white">{cartCount}</span>}{item.label === "Notif" && notificationCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[8px] font-bold text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}{item.label === "Message" && messageCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#006874] px-1 text-[8px] font-bold text-white">{messageCount > 99 ? "99+" : messageCount}</span>}</span><span className="text-[9px] font-medium">{item.label}</span></Link>)}
        </div>
        {subscriptionToolsOpen && <div className="fixed left-1/2 top-[52px] z-[90] w-[min(92vw,350px)] -translate-x-1/2 rounded-2xl border border-[#e5bdbb] bg-white p-3.5 text-[#242020] shadow-2xl"><div className="flex items-center justify-between border-b border-[#f0e7e5] pb-2.5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">Envol Africa</p><h2 className="font-display text-sm font-black text-[#242020]">Rejoindre & Soutenir</h2></div><button type="button" onClick={() => setSubscriptionToolsOpen(false)} aria-label="Fermer les options" className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f] transition hover:bg-[#ebd5d3]"><span className="material-symbols-outlined text-[18px]">close</span></button></div><div className="mt-2.5 grid gap-2"><Link href="/abonnement" onClick={() => setSubscriptionToolsOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#ead2d0] bg-[#fff7f6] px-3 py-2.5 text-[12px] font-bold text-[#7f0019] transition hover:border-[#9e001f]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#9e001f]/10 text-[#9e001f]"><span className="material-symbols-outlined text-[20px]">stars</span></span><span className="min-w-0 flex-1"><span className="block font-black">S’abonner</span><span className="block truncate text-[10px] font-normal text-[#746665]">Accéder aux formules premium</span></span></Link><Link href="/don" onClick={() => setSubscriptionToolsOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#cde9d4] bg-[#f3fbf5] px-3 py-2.5 text-[12px] font-bold text-[#166534] transition hover:border-[#16a34a]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#16a34a]/10 text-[#166534]"><span className="material-symbols-outlined text-[20px]">volunteer_activism</span></span><span className="min-w-0 flex-1"><span className="block font-black">Faire un don</span><span className="block truncate text-[10px] font-normal text-[#52705b]">Soutenir les projets Envol Africa</span></span></Link><Link href="/affiliation" onClick={() => setSubscriptionToolsOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#ecd5a8] bg-[#fffbf2] px-3 py-2.5 text-[12px] font-bold text-[#8a5500] transition hover:border-[#a36300]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#a36300]/10 text-[#8a5500]"><span className="material-symbols-outlined text-[20px]">group_add</span></span><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 font-black text-[#8a5500]">S’affilier<span className="rounded bg-[#a36300] px-1.5 py-0.2 text-[9px] font-black text-white">5×5</span></span><span className="block truncate text-[10px] font-normal text-[#75684d]">Réseau ambassadeur & commissions</span></span></Link></div></div>}
        {platform.key === "marketplace" && marketplaceToolsOpen && <div className="fixed left-1/2 top-[52px] z-[90] max-h-[68vh] w-[min(92vw,350px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#eadfce] bg-white p-3.5 shadow-2xl"><div className="flex items-center justify-between border-b border-[#f0e7dc] pb-2.5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a36300]">Marketplace</p><h2 className="font-display text-sm font-black text-[#2a211a]">Boîte à outils vendeur</h2></div><button type="button" onClick={() => setMarketplaceToolsOpen(false)} aria-label="Fermer la boîte à outils Marketplace" className="grid h-8 w-8 place-items-center rounded-full bg-[#f8f3ed] text-[#9e001f]"><span className="material-symbols-outlined text-[18px]">close</span></button></div><div className="mt-2.5 grid gap-1.5">{[{ label: "Créer ou gérer ma boutique", href: "/marketplace/boutique", icon: "storefront" }, { label: "Publier un produit", href: "/marketplace/boutique?section=product", icon: "add_box" }, { label: "Statistiques de ma boutique", href: "/marketplace/admin?section=analytics", icon: "query_stats" }, { label: "Mes produits", href: "/marketplace/admin?section=products", icon: "inventory_2" }, { label: "Mes commandes", href: "/marketplace/commandes", icon: "shopping_bag" }, { label: "Paiements échelonnés", href: "/marketplace/commandes?filter=installments", icon: "payments" }, { label: "Messages clients", href: "/marketplace/messages", icon: "mail" }].map((item) => <Link key={item.label} href={item.href} onClick={() => setMarketplaceToolsOpen(false)} className="flex items-center gap-2.5 rounded-xl border border-[#eadfce] bg-[#fffaf3] px-3 py-2 text-xs font-bold text-[#5c3d19]"><span className="material-symbols-outlined text-[18px] text-[#9e001f]">{item.icon}</span><span>{item.label}</span></Link>)}</div></div>}
        {platform.key === "wab" && wabToolsOpen && (
          <div className="fixed left-1/2 top-[52px] z-[90] max-h-[85vh] w-[min(94vw,370px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#b9dadd] bg-[#f8fafb] p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#d8eef0] bg-white p-2.5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#006874]">World Africa Business</p>
                <h2 className="font-display text-sm font-black text-[#172b2f]">Mon Profil & Navigation</h2>
              </div>
              <button
                type="button"
                onClick={() => setWabToolsOpen(false)}
                aria-label="Fermer les outils WAB"
                className="grid h-8 w-8 place-items-center rounded-full bg-[#eef7f8] text-[#006874] transition hover:bg-[#d8eef0]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <WabSidebarCards
              user={user ? { id: user.id, nom: user.nom, prenom: user.prenom, avatar: user.avatar, role: user.role } : null}
              onLinkClick={() => setWabToolsOpen(false)}
              activeHref={pathname}
            />
          </div>
        )}
        {platform.key === "awards" && awardsToolsOpen && <div className="fixed left-1/2 top-[52px] z-[90] max-h-[68vh] w-[min(92vw,350px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#e1c98b] bg-white p-3.5 shadow-2xl"><div className="flex items-center justify-between border-b border-[#f0e4bd] pb-2.5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a5b00]">Africa Awards</p><h2 className="font-display text-sm font-black text-[#2b2111]">Boîte à outils</h2><p className="mt-0.5 text-[10px] text-[#75684d]">{user?.role === "admin" ? "Commandes administrateur" : user ? "Voteur et nominé" : "Outils du visiteur"}</p></div><button type="button" onClick={() => setAwardsToolsOpen(false)} aria-label="Fermer la boîte à outils Africa Awards" className="grid h-8 w-8 place-items-center rounded-full bg-[#fff6d9] text-[#8a5b00]"><span className="material-symbols-outlined text-[18px]">close</span></button></div><div className="mt-2.5 grid gap-1.5">{awardsToolItems.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setAwardsToolsOpen(false)} className="flex items-center gap-2.5 rounded-xl border border-[#f0e4bd] bg-[#fffaf0] px-3 py-2 text-[12px] font-bold text-[#2b2111] transition hover:border-[#8a5b00] hover:text-[#8a5b00]"><span className="material-symbols-outlined text-[18px] text-[#8a5b00]">{item.icon}</span><span>{item.label}</span></Link>)}</div></div>}
        {platform.key !== "marketplace" && platform.key !== "wab" && platform.key !== "awards" && platformToolsOpen && <div className="fixed left-1/2 top-[52px] z-[90] max-h-[68vh] w-[min(92vw,350px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#d8c3c1] bg-white p-3.5 shadow-2xl"><div className="flex items-center justify-between border-b border-[#f0dedd] pb-2.5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: platform.accent }}>{platform.name}</p><h2 className="font-display text-sm font-black text-[#242020]">Boîte à outils</h2></div><button type="button" onClick={() => setPlatformToolsOpen(false)} aria-label={`Fermer les outils ${platform.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f3f2]" style={{ color: platform.accent }}><span className="material-symbols-outlined text-[18px]">close</span></button></div><div className="mt-2.5 grid gap-1.5">{platformToolItems.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setPlatformToolsOpen(false)} className="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] font-bold text-[#242020]" style={{ borderColor: `${platform.accent}33`, backgroundColor: `${platform.accentSoft}66` }}><span className="material-symbols-outlined text-[18px]" style={{ color: platform.accent }}>{item.icon}</span><span>{item.label}</span></Link>)}</div></div>}
        {profileOpen && <div className="fixed left-1/2 top-[52px] z-[90] max-h-[68vh] w-[min(92vw,350px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#e5bdbb] bg-white p-3.5 shadow-2xl"><div className="flex items-center justify-between border-b border-[#f0dedd] pb-2.5"><div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#f6f3f2] text-[#9e001f]">{user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-[24px]">account_circle</span>}</div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">Compte Envol Africa</p><h2 className="font-display text-sm font-black text-[#242020]">{user ? `${user.prenom || ""} ${user.nom || ""}`.trim() || "Mon profil" : "Visiteur"}</h2></div></div><button type="button" onClick={() => setProfileOpen(false)} aria-label="Fermer le profil" className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f]"><span className="material-symbols-outlined text-[18px]">close</span></button></div><div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">{[{ label: "Mon compte", href: "/compte", icon: "person" }, { label: `Mon espace ${platform.name}`, href: platform.homeHref, icon: "dashboard" }, { label: "Paramètres", href: "/compte/parametres", icon: "settings" }, { label: "Notifications", href: "/notifications", icon: "notifications" }, { label: "Messages", href: "/messages", icon: "mail" }, { label: "Favoris", href: "/compte/favoris", icon: "favorite" }].map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 rounded-xl border border-[#f0dedd] bg-[#fffafa] px-3 py-2 text-[12px] font-bold text-[#242020] transition hover:border-[#9e001f] hover:text-[#9e001f]"><span className="material-symbols-outlined text-[18px] text-[#9e001f]">{item.icon}</span><span>{item.label}</span></Link>)}</div>{!user && <Link href="/auth/login" onClick={() => setProfileOpen(false)} className="mt-2.5 flex h-10 items-center justify-center rounded-xl bg-[#9e001f] text-[12px] font-black text-white">Se connecter</Link>}</div>}
        <div className="pt-[48px]">
          <header className="flex h-[56px] items-center justify-between border-b border-[#e5bdbb] bg-[#fcf9f8] px-4">
            <div className="flex min-w-0 items-center gap-2">
              <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`} className="flex shrink-0 items-center"><img src="/mobile-header-logo.png" alt="Logo Envol Africa Magazine" className="h-8 w-8 rounded-full object-cover" /></Link>
              <div className="relative min-w-0">
                <button type="button" onClick={() => setDropdownOpen((open) => !open)} aria-expanded={dropdownOpen} className="flex max-w-[150px] items-center gap-1 truncate text-[13px] font-bold text-black" style={{ fontFamily: "Montserrat, Arial, sans-serif" }}>{platform.name}<span className="material-symbols-outlined shrink-0 text-[18px]">expand_more</span></button>
                {dropdownOpen && <div className="absolute left-0 top-full z-[80] mt-2 w-64 rounded-xl border border-[#e5bdbb] bg-white p-2 shadow-xl">{platformOptions.map((item) => <Link key={item.key} href={item.href} onClick={() => setDropdownOpen(false)} className={`block rounded-lg px-4 py-2.5 text-[13px] text-black transition-colors hover:bg-[#f6f3f2] ${platform.key === item.key ? "bg-[#f0eded] font-bold" : "font-normal"}`} style={{ fontFamily: "Montserrat, Arial, sans-serif" }}>{item.name}</Link>)}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => { setMobileLocaleOpen((open) => !open); setMobileLocaleSection(null); }} aria-label={`Réglages régionaux : ${visitorLocale.country}`} aria-expanded={mobileLocaleOpen} className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] p-1.5 transition hover:bg-[#e5bdbb] overflow-hidden">{visitorLocale.countryCode ? (<img src={getCountryFlagImgUrl(visitorLocale.countryCode)} alt={visitorLocale.country || visitorLocale.countryCode} className="h-4 w-5.5 rounded-[2px] object-cover shadow-xs" onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />) : (<span className="text-[18px]">🌍</span>)}</button><button type="button" onClick={() => setShowSearch((open) => !open)} aria-label="Rechercher" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2]"><span className="material-symbols-outlined">search</span></button><button type="button" onClick={() => setSideMenuOpen(true)} aria-label="Ouvrir le menu" className="grid h-9 w-9 place-items-center text-[#303030]"><span className="material-symbols-outlined">menu</span></button></div>
          </header>
          {mobileLocaleOpen && <div className="notranslate fixed left-1/2 top-[52px] z-[90] max-h-[68vh] w-[min(92vw,350px)] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[#e5bdbb] bg-white p-3.5 text-[#242020] shadow-2xl" translate="no"><div className="flex items-center justify-between border-b border-[#f0e7e5] pb-2.5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">{translate("common.country", visitorLocale.language)}</p><p className="mt-0.5 text-sm font-bold flex items-center gap-2">{visitorLocale.countryCode && (<img src={getCountryFlagImgUrl(visitorLocale.countryCode)} alt="" className="h-3.5 w-5 rounded-[2px] object-cover shadow-xs inline-block" />)}<span>{visitorLocale.country}</span></p></div><button type="button" onClick={() => setMobileLocaleOpen(false)} aria-label={translate("common.close", visitorLocale.language)} className="grid h-8 w-8 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f]"><span className="notranslate material-symbols-outlined text-[18px]" translate="no">close</span></button></div><div className="mt-2.5 space-y-2"><button type="button" onClick={() => { toggleDarkMode(); setMobileLocaleOpen(false); }} className="flex w-full items-center justify-between rounded-xl border border-[#eee2e0] px-3 py-2 text-left text-xs font-bold hover:bg-[#fff7f6]"><span className="flex items-center gap-2"><span className="notranslate material-symbols-outlined text-[18px] text-[#9e001f]" translate="no">{darkMode ? "light_mode" : "dark_mode"}</span>{darkMode ? translate("common.lightMode", visitorLocale.language) : translate("common.darkMode", visitorLocale.language)}</span><span className="text-[11px] text-[#746665]">Changer</span></button><div className="rounded-xl border border-[#eee2e0]"><button type="button" onClick={() => setMobileLocaleSection((section) => section === "currency" ? null : "currency")} aria-expanded={mobileLocaleSection === "currency"} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold"><span className="flex items-center gap-2"><span className="notranslate material-symbols-outlined text-[18px] text-[#9e001f]" translate="no">payments</span>{translate("common.currency", visitorLocale.language)} <span className="font-normal text-[#746665]">{visitorLocale.currency}</span></span><span className="notranslate material-symbols-outlined text-[18px]" translate="no">{mobileLocaleSection === "currency" ? "expand_less" : "expand_more"}</span></button>{mobileLocaleSection === "currency" && <div className="notranslate grid grid-cols-1 gap-1.5 border-t border-[#f0e7e5] px-3 py-2 max-h-[220px] overflow-y-auto" translate="no">{CURRENCY_OPTIONS.map((curr) => { const isSelected = visitorLocale.currency === curr.code; return <button type="button" key={curr.code} onClick={() => { const next = { ...visitorLocale, currency: curr.code, isManual: true }; setVisitorLocale(next); persistVisitorLocale(next); setMobileLocaleSection(null); setMobileLocaleOpen(false); }} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${isSelected ? "border-[#9e001f] bg-[#f0eded] text-[#9e001f]" : "border-[#e5bdbb] text-[#242020] hover:bg-[#fff7f6]"}`}><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-[#f6f3f2] text-[11px] font-black text-[#9e001f]">{curr.symbol}</span><div className="text-left"><span className="block font-bold">{curr.label} ({curr.code})</span><span className="block text-[10px] font-normal text-[#746665]">{curr.detail}</span></div></div>{isSelected && <span className="notranslate material-symbols-outlined text-[16px] text-[#9e001f]" translate="no">check</span>}</button>; })}</div>}</div><div className="rounded-xl border border-[#eee2e0]"><button type="button" onClick={() => setMobileLocaleSection((section) => section === "language" ? null : "language")} aria-expanded={mobileLocaleSection === "language"} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold"><span className="flex items-center gap-2"><span className="notranslate material-symbols-outlined text-[18px] text-[#9e001f]" translate="no">translate</span>{translate("common.language", visitorLocale.language)} <span className="font-normal text-[#746665]">{visitorLocale.language.toUpperCase()}</span></span><span className="notranslate material-symbols-outlined text-[18px]" translate="no">{mobileLocaleSection === "language" ? "expand_less" : "expand_more"}</span></button>{mobileLocaleSection === "language" && <div className="notranslate flex flex-wrap gap-1.5 border-t border-[#f0e7e5] px-3 py-2" translate="no">{LANGUAGE_OPTIONS.map((language) => <button type="button" key={language.code} onClick={() => { const next = { ...visitorLocale, language: language.code, isManual: true }; setVisitorLocale(next); persistVisitorLocale(next); setMobileLocaleSection(null); setMobileLocaleOpen(false); }} className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${visitorLocale.language === language.code ? "border-[#9e001f] bg-[#f0eded] text-[#9e001f]" : "border-[#e5bdbb] hover:bg-[#fff7f6]"}`}>{language.label}</button>)}</div>}</div></div></div>}
          {platform.mobileQuickActions && platform.mobileQuickActions.length > 0 && (
            <>
              {/* Espacement dans le flux pour préserver la position du contenu */}
              <div className="h-[44px] md:hidden" aria-hidden="true" />

              {/* Bandeau d'actions contextuelles scroll-aware */}
              <div
                className={`fixed inset-x-0 z-40 md:hidden border-b border-[#ead8d5] bg-[#fffdfc]/95 backdrop-blur-md shadow-xs transition-all duration-300 ease-in-out ${
                  mobileContextBarVisible
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "-translate-y-full opacity-0 pointer-events-none"
                }`}
                style={{
                  top: `${scrollY < 56 ? Math.max(48, 104 - scrollY) : 48}px`,
                }}
              >
                <div className="mx-auto flex h-[44px] max-w-[520px] items-center justify-between gap-1.5 px-3">
                  <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {platform.mobileQuickActions.map((action) => {
                      const isActive = pathname === action.href || (action.href !== "/" && pathname.startsWith(action.href));
                      return (
                        <Link
                          key={action.label}
                          href={action.href}
                          className={`flex-1 min-w-[72px] text-center truncate rounded-full px-2.5 py-1.5 text-[11px] font-black transition-all border active:scale-95 ${
                            isActive
                              ? "shadow-2xs"
                              : "border-[#ead8d5] bg-white text-[#2b2525] hover:border-[#9e001f]"
                          }`}
                          style={
                            isActive
                              ? {
                                  backgroundColor: `${platform.accent}14`,
                                  borderColor: `${platform.accent}55`,
                                  color: platform.accent,
                                }
                              : undefined
                          }
                        >
                          {action.label}
                        </Link>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={openPlatformToolbox}
                    aria-label={`Ouvrir la boîte à outils ${platform.name}`}
                    title="Boîte à outils"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-xs transition-transform active:scale-90 hover:brightness-110"
                    style={{ backgroundColor: platform.accent }}
                  >
                    <span className="material-symbols-outlined text-[19px]">add</span>
                  </button>
                </div>
              </div>
            </>
          )}
          {showSearch && <div className="border-b bg-white p-4"><form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) window.location.assign(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`); }}><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher..." className="h-11 w-full rounded-lg border bg-[#f6f3f2] px-4" /></form></div>}
        </div>
        <div className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 p-0">
          <div className="mobile-bottom-nav__surface relative flex w-full max-w-none items-end justify-between gap-1 rounded-none border-x-0 border-b-0 border-t border-[#e5bdbb] bg-[#fffdfc]/95 px-2 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_35px_rgba(79,13,25,0.12)] backdrop-blur-xl">
            {mobilePrimaryNav.map((item) => {
              const active = pathname === item.href;
              return <Link key={item.name} href={item.href} className={`mobile-nav-item ${active ? "mobile-nav-item--active" : ""}`} aria-current={active ? "page" : undefined}><span className="mobile-nav-item__icon"><span className="notranslate material-symbols-outlined text-[20px]" translate="no">{item.icon}</span></span><span className="mobile-nav-item__label">{item.name}</span></Link>;
            })}
            <div className={`mobile-nav-plus-wrap ${mobileSecondaryActive ? "mobile-nav-plus-wrap--active" : ""}`}>
              <div className={`mobile-secondary-menu ${mobileNavOpen ? "mobile-secondary-menu--open" : ""}`} aria-hidden={!mobileNavOpen}>
                {mobileSecondaryNav.map((item, index) => <Link key={item.name} href={item.href} tabIndex={mobileNavOpen ? 0 : -1} style={{ "--mobile-delay": `${index * 45}ms` } as React.CSSProperties} className="mobile-secondary-item"><span className="mobile-secondary-item__icon"><span className="notranslate material-symbols-outlined text-[18px]" translate="no">{item.icon}</span></span><span>{item.name}</span></Link>)}
              </div>
              <button type="button" className={`mobile-plus-button ${mobileNavOpen ? "mobile-plus-button--open" : ""}`} onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? "Fermer Jobs, Kiosque et Profil" : "Afficher Jobs, Kiosque et Profil"} aria-expanded={mobileNavOpen}><span className="mobile-plus-button__icon"><span className="notranslate material-symbols-outlined text-[28px]" translate="no">{mobileNavOpen ? "close" : "add"}</span></span></button>
            </div>
          </div>
        </div>
      </div>

      {notificationPrompt && <div className="fixed bottom-20 left-1/2 z-[120] w-[min(94vw,720px)] -translate-x-1/2 rounded-xl border border-[#e5bdbb] bg-white/95 px-3 py-2.5 shadow-[0_12px_40px_rgba(54,19,24,.18)] backdrop-blur md:bottom-5"><div className="flex items-center gap-2"><span className="material-symbols-outlined shrink-0 text-[20px] text-[#9e001f]">notifications_active</span><p className="min-w-0 flex-1 truncate font-sans text-[11px] font-semibold text-[#443a39]">Recevoir les alertes importantes d’Envol Africa.</p><Link href="/conditions" className="hidden shrink-0 font-sans text-[10px] font-bold text-[#746665] underline sm:inline">Conditions</Link><Link href="/cookies" className="hidden shrink-0 font-sans text-[10px] font-bold text-[#746665] underline sm:inline">Cookies</Link><button type="button" onClick={dismissNotificationPrompt} className="shrink-0 rounded-lg px-2.5 py-1.5 font-sans text-[10px] font-bold text-[#746665] hover:bg-[#f6f3f2]">Plus tard</button><button type="button" onClick={requestNotifications} className="shrink-0 rounded-lg bg-[#9e001f] px-3 py-1.5 font-sans text-[10px] font-bold text-white hover:bg-[#c8102e]">Accepter</button></div></div>}

      {sideMenuOpen && <div className="fixed inset-0 z-[100] flex justify-end"><button type="button" aria-label="Fermer le fond du menu" className="absolute inset-0 cursor-default bg-black/40" onClick={() => setSideMenuOpen(false)} /><aside className="relative h-full w-[min(92vw,420px)] overflow-y-auto bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><Link href={platform.homeHref} onClick={() => setSideMenuOpen(false)}><img src={platform.logoSrc} alt={platform.logoAlt} className="h-12 w-auto" /></Link><button type="button" onClick={() => setSideMenuOpen(false)} aria-label="Fermer le menu" className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100">×</button></div><p className="text-[13px] leading-6 text-[#5c403f]">Une chaîne regroupant toutes les valeurs pour votre succès en entreprise. Plus qu'un magazine, Envol Africa accompagne les projets et les talents africains.</p><Link href="/don" onClick={() => setSideMenuOpen(false)} className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#9e001f] text-[13px] font-bold text-white">Soutenir ENVOL AFRICA</Link><div className="mt-8 space-y-1">{sidePanelLinks.map((item) => { const internalHref = internalBrowserHref(item.href); return <Link key={item.name} href={internalHref || item.href} target={internalHref ? undefined : "_blank"} rel={internalHref ? undefined : "noreferrer"} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] hover:bg-[#f6f3f2]"><span className="h-1.5 w-1.5 rounded-full bg-[#9e001f]" />{item.name}</Link>; })}</div><div className="mt-8 rounded-2xl border border-[#e5bdbb] bg-[#f0eded] p-5"><h2 className="font-display text-base font-extrabold">{platform.name}</h2><p className="mt-2 text-[13px] leading-5 text-[#5c403f]">Accédez directement à l’espace {platform.name} et retrouvez votre compte partagé.</p><Link href={platform.homeHref} onClick={() => setSideMenuOpen(false)} className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#303030] text-[12px] font-bold text-white">Accéder à l’espace</Link></div></aside></div>}
    </>
  );
}
