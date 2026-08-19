"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPlatformKey, PLATFORM_CONFIGS, platformOptions, type PlatformConfig } from "@/lib/platforms";
import { internalBrowserHref } from "@/lib/internal-browser";
import { normalizeVisitorLocale, persistVisitorLocale, readPersistedVisitorLocale, type VisitorLocale } from "@/lib/visitor-locale";
import InboxToolbox, { type InboxToolboxTab } from "@/components/InboxToolbox";
import CartToolbox from "@/components/CartToolbox";

type FeaturedArticle = { slug: string; title: string };

const firstLineMenus = [
  { name: "S'abonner", href: "/abonnement", icon: "stars" },
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

function MegaMenu({ platform, onClose }: { platform: PlatformConfig; onClose: () => void }) {
  return (
    <div className="absolute left-1/2 top-full z-[70] mt-3 w-[min(92vw,760px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-[#e5bdbb] bg-white shadow-2xl">
      <div className="border-b border-slate-100 px-5 py-4" style={{ backgroundColor: platform.accentSoft }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: platform.accent }}>{platform.name}</p>
            <h2 className="mt-1 font-display text-lg font-extrabold text-slate-950">{platform.megaTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{platform.megaDescription}</p>
          </div>
          <button type="button" aria-label="Fermer le menu" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-slate-950">×</button>
        </div>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {platform.megaItems.map((item) => (
          <Link key={item.label} href={item.href} onClick={onClose} className="group flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-md" style={{ backgroundColor: `${platform.accentSoft}88` }}>
            <span className="material-symbols-outlined text-[22px]" style={{ color: platform.accent }}>{item.icon}</span>
            <span className="flex-1 text-sm font-bold text-slate-800">{item.label}</span>
            <span className="text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
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
  const [inboxToolboxTab, setInboxToolboxTab] = useState<InboxToolboxTab | null>(null);
  const [cartToolboxOpen, setCartToolboxOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [visitorLocale, setVisitorLocale] = useState<VisitorLocale>(() => readPersistedVisitorLocale());
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);

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
    setMobileNavOpen(false);
    setWabToolsOpen(false);
    setProfileOpen(false);
    setInboxToolboxTab(null);
    setCartToolboxOpen(false);
  }, [pathname]);

  useEffect(() => {
    const loadVisitorLocale = async () => {
      try {
        const response = await fetch("/api/geo", { cache: "no-store" });
        if (!response.ok) return;
        const locale = normalizeVisitorLocale(await response.json());
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
    if (platform.key !== "magazine" && platform.key !== "kiosque") { setFeaturedArticles([]); return; }
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
    if (canNotify && Notification.permission === "default" && !localStorage.getItem("eam_notifications_prompted")) setNotificationPrompt(true);

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
    if (!("Notification" in window)) { setNotificationPrompt(false); return; }
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    setNotificationsEnabled(enabled);
    localStorage.setItem("eam_notifications_enabled", String(enabled));
    if (enabled && "serviceWorker" in navigator && "PushManager" in window && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) });
        await fetch("/api/notifications/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      } catch { /* Le consentement navigateur reste valide même si le push serveur est indisponible. */ }
    }
    setNotificationPrompt(false);
  };

  const dismissNotificationPrompt = () => {
    localStorage.setItem("eam_notifications_prompted", "true");
    setNotificationPrompt(false);
  };

  const displayName = user?.prenom || user?.nom || "Mon compte";
  const isMagazineExperience = platform.key === "magazine" || platform.key === "kiosque";
  const firstLineActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {isMagazineExperience && <nav className="hidden items-center justify-between border-b border-[#d8c3c1] bg-white px-5 py-2 text-black lg:flex lg:px-[64px]" style={{ fontFamily: "Century Gothic, Inter, sans-serif" }}>
        <div className="flex items-center gap-5 text-[12px] font-medium">
          {firstLineMenus.map((item) => <Link key={item.name} href={item.href} className={`flex items-center gap-1.5 transition-colors hover:text-[#9e001f] ${firstLineActive(item.href) ? "font-bold text-[#9e001f]" : ""}`}><span className="material-symbols-outlined text-[16px]">{item.icon}</span>{item.name}</Link>)}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="grid h-8 w-8 place-items-center text-black transition-colors hover:text-[#9e001f]" title={`Langue détectée : ${visitorLocale.language.toUpperCase()}`} aria-label={`Traduction automatique en ${visitorLocale.language}`}><span className="material-symbols-outlined text-[18px]">translate</span></button>
          <button type="button" className="grid h-8 w-8 place-items-center text-black transition-colors hover:text-[#9e001f]" title={`${visitorLocale.country} · ${visitorLocale.language.toUpperCase()} · ${visitorLocale.currency}`} aria-label={`Pays ${visitorLocale.country}, langue ${visitorLocale.language}, devise ${visitorLocale.currency}`}><span className="material-symbols-outlined text-[18px]">payments</span></button>
          <button type="button" onClick={toggleDarkMode} className="grid h-8 w-8 place-items-center text-black transition-colors hover:text-[#9e001f]" title={darkMode ? "Mode clair" : "Mode sombre"}><span className="material-symbols-outlined text-[18px]">{darkMode ? "light_mode" : "dark_mode"}</span></button>
        </div>
      </nav>}

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
              {megaMenuOpen && <MegaMenu platform={platform} onClose={() => setMegaMenuOpen(false)} />}
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
              {user ? <Link href="/compte" aria-label={`Mon profil : ${displayName}`} title={displayName} className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d8c3c1] bg-white text-[11px] font-bold text-[#9e001f] transition-colors hover:border-[#9e001f]">{user.avatar ? <img src={user.avatar} alt={`Photo de profil de ${displayName}`} className="h-full w-full object-cover" /> : `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}` || "M"}</Link> : <Link href="/auth/login" className="rounded bg-[#dc2626] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#b91c1c]">Se connecter</Link>}
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
          {[{ icon: "podcasts", label: "Live", href: "/" }, { icon: "shopping_cart", label: "Panier", href: "#cart-toolbox" }, { icon: "favorite_border", label: "Favoris", href: "#inbox-favorites" }, { icon: "mail_outline", label: "Message", href: "#inbox-messages" }, { icon: "notifications_none", label: "Notif", href: "#inbox-notifications" }, { icon: platform.key === "wab" ? "construction" : "translate", label: platform.key === "wab" ? "Outils" : "Trad", href: platform.key === "wab" ? "#wab-tools" : "#" }, { icon: "account_circle", label: "Profil", href: "#profile" }].map((item) => item.href === "#cart-toolbox" ? <button type="button" key={item.label} onClick={() => setCartToolboxOpen((open) => !open)} aria-expanded={cartToolboxOpen} aria-label="Ouvrir le panier" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">shopping_cart</span>{cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[8px] font-bold text-white">{cartCount}</span>}</span><span className="text-[9px] font-medium">Panier</span></button> : item.href.startsWith("#inbox-") ? <button type="button" key={item.label} onClick={() => setInboxToolboxTab((current) => current === item.href.replace("#inbox-", "") as InboxToolboxTab ? null : item.href.replace("#inbox-", "") as InboxToolboxTab)} aria-expanded={inboxToolboxTab === item.href.replace("#inbox-", "")} aria-label={`Ouvrir ${item.label}`} className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">{item.icon}</span>{item.label === "Notif" && notificationCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[8px] font-bold text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}{item.label === "Message" && messageCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#006874] px-1 text-[8px] font-bold text-white">{messageCount > 99 ? "99+" : messageCount}</span>}</span><span className="text-[9px] font-medium">{item.label}</span></button> : item.href === "#wab-tools" ? <button type="button" key={item.label} onClick={() => setWabToolsOpen((open) => !open)} aria-expanded={wabToolsOpen} aria-label="Ouvrir la boîte à outils WAB" className="relative flex flex-col items-center gap-0.5"><span className="relative"><span className="material-symbols-outlined text-[20px]">{item.icon}</span></span><span className="text-[9px] font-medium">{item.label}</span></button> : item.href === "#profile" ? <button type="button" key={item.label} onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Ouvrir le profil" className="relative flex flex-col items-center gap-0.5"><span className="relative">{user?.avatar ? <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="material-symbols-outlined text-[20px]">account_circle</span>}</span><span className="text-[9px] font-medium">Profil</span></button> : <Link key={item.label} href={item.href} className="relative flex flex-col items-center gap-0.5"><span className="relative">{item.label === "Profil" && user?.avatar ? <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <span className="material-symbols-outlined text-[20px]">{item.icon}</span>}{item.label === "Panier" && cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[9px] font-bold text-white">{cartCount}</span>}{item.label === "Notif" && notificationCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[8px] font-bold text-white">{notificationCount > 99 ? "99+" : notificationCount}</span>}{item.label === "Message" && messageCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#006874] px-1 text-[8px] font-bold text-white">{messageCount > 99 ? "99+" : messageCount}</span>}</span><span className="text-[9px] font-medium">{item.label}</span></Link>)}
        </div>
        {platform.key === "wab" && wabToolsOpen && <div className="fixed inset-x-3 top-[52px] z-[90] max-h-[72vh] overflow-y-auto rounded-2xl border border-[#b9dadd] bg-white p-4 shadow-2xl"><div className="flex items-center justify-between border-b border-[#d8eef0] pb-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#006874]">WAB</p><h2 className="font-display text-base font-black text-[#172b2f]">Boîte à outils</h2></div><button type="button" onClick={() => setWabToolsOpen(false)} aria-label="Fermer la boîte à outils" className="grid h-9 w-9 place-items-center rounded-full bg-[#eef7f8] text-[#006874]"><span className="material-symbols-outlined">close</span></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...platform.megaItems, { label: "Mon profil WAB", href: "/wab/profil", icon: "account_circle" }, { label: "Messages", href: "/wab/messages", icon: "mail" }, { label: "Notifications", href: "/wab/notifications", icon: "notifications" }, { label: "Pages et groupes", href: "/wab/profil", icon: "groups" }].map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setWabToolsOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#d8eef0] bg-[#f7fcfc] px-3 py-3 text-[12px] font-bold text-[#172b2f] transition hover:border-[#006874] hover:text-[#006874]"><span className="material-symbols-outlined text-[20px] text-[#006874]">{item.icon}</span><span>{item.label}</span></Link>)}</div></div>}
        {profileOpen && <div className="fixed inset-x-3 top-[52px] z-[90] max-h-[72vh] overflow-y-auto rounded-2xl border border-[#e5bdbb] bg-white p-4 shadow-2xl"><div className="flex items-center justify-between border-b border-[#f0dedd] pb-3"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#f6f3f2] text-[#9e001f]">{user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-[28px]">account_circle</span>}</div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">Compte Envol Africa</p><h2 className="font-display text-base font-black text-[#242020]">{user ? `${user.prenom || ""} ${user.nom || ""}`.trim() || "Mon profil" : "Visiteur"}</h2><p className="text-[11px] text-[#746665]">{platform.name}</p></div></div><button type="button" onClick={() => setProfileOpen(false)} aria-label="Fermer le profil" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f]"><span className="material-symbols-outlined">close</span></button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{[{ label: "Mon compte", href: "/compte", icon: "person" }, { label: `Mon espace ${platform.name}`, href: platform.homeHref, icon: "dashboard" }, { label: "Paramètres", href: "/compte/parametres", icon: "settings" }, { label: "Notifications", href: "/notifications", icon: "notifications" }, { label: "Messages", href: "/messages", icon: "mail" }, { label: "Favoris", href: "/compte/favoris", icon: "favorite" }].map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-xl border border-[#f0dedd] bg-[#fffafa] px-3 py-3 text-[12px] font-bold text-[#242020] transition hover:border-[#9e001f] hover:text-[#9e001f]"><span className="material-symbols-outlined text-[20px] text-[#9e001f]">{item.icon}</span><span>{item.label}</span></Link>)}</div>{!user && <Link href="/auth/login" onClick={() => setProfileOpen(false)} className="mt-3 flex h-11 items-center justify-center rounded-xl bg-[#9e001f] text-[12px] font-black text-white">Se connecter</Link>}</div>}
        <div className="pt-[48px]">
          <header className="flex h-[56px] items-center justify-between border-b border-[#e5bdbb] bg-[#fcf9f8] px-4">
            <div className="flex min-w-0 items-center gap-2">
              <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`} className="flex shrink-0 items-center"><img src="/mobile-header-logo.png" alt="Logo Envol Africa Magazine" className="h-8 w-8 rounded-full object-cover" /></Link>
              <div className="relative min-w-0">
                <button type="button" onClick={() => setDropdownOpen((open) => !open)} aria-expanded={dropdownOpen} className="flex max-w-[150px] items-center gap-1 truncate text-[13px] font-bold text-black" style={{ fontFamily: "Montserrat, Arial, sans-serif" }}>{platform.name}<span className="material-symbols-outlined shrink-0 text-[18px]">expand_more</span></button>
                {dropdownOpen && <div className="absolute left-0 top-full z-[80] mt-2 w-64 rounded-xl border border-[#e5bdbb] bg-white p-2 shadow-xl">{platformOptions.map((item) => <Link key={item.key} href={item.href} onClick={() => setDropdownOpen(false)} className={`block rounded-lg px-4 py-2.5 text-[13px] text-black transition-colors hover:bg-[#f6f3f2] ${platform.key === item.key ? "bg-[#f0eded] font-bold" : "font-normal"}`} style={{ fontFamily: "Montserrat, Arial, sans-serif" }}>{item.name}</Link>)}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => setMegaMenuOpen((open) => !open)} aria-label="Ouvrir les actions de la plateforme" className="grid h-9 w-9 place-items-center" style={{ color: platform.accent }}><span className="material-symbols-outlined">{platform.megaLabel === "+" ? "add" : "apps"}</span></button><button type="button" onClick={() => setShowSearch((open) => !open)} aria-label="Rechercher" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2]"><span className="material-symbols-outlined">search</span></button><button type="button" onClick={() => setSideMenuOpen(true)} aria-label="Ouvrir le menu" className="grid h-9 w-9 place-items-center text-[#303030]"><span className="material-symbols-outlined">menu</span></button></div>
          </header>
          {megaMenuOpen && <div className="mobile-context-row sticky top-[48px] z-40 border-b border-[#e5bdbb] bg-white px-3 py-2 shadow-sm"><div className="flex items-center gap-2 overflow-x-auto">{platform.megaItems.map((item) => <Link key={item.label} href={item.href} onClick={() => setMegaMenuOpen(false)} className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#e5bdbb] px-3 py-2 text-[11px] font-bold text-[#303030] transition-colors hover:border-[#9e001f] hover:text-[#9e001f]" style={{ backgroundColor: `${platform.accentSoft}88` }}><span className="material-symbols-outlined text-[17px]" style={{ color: platform.accent }}>{item.icon}</span>{item.label}</Link>)}</div></div>}
          {showSearch && <div className="border-b bg-white p-4"><form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) window.location.assign(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`); }}><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher..." className="h-11 w-full rounded-lg border bg-[#f6f3f2] px-4" /></form></div>}
        </div>
        <div className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 p-0">
          <div className="mobile-bottom-nav__surface relative flex w-full max-w-none items-end justify-between gap-1 rounded-none border-x-0 border-b-0 border-t border-[#e5bdbb] bg-[#fffdfc]/95 px-2 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_35px_rgba(79,13,25,0.12)] backdrop-blur-xl">
            {mobilePrimaryNav.map((item) => {
              const active = pathname === item.href;
              return <Link key={item.name} href={item.href} className={`mobile-nav-item ${active ? "mobile-nav-item--active" : ""}`} aria-current={active ? "page" : undefined}><span className="mobile-nav-item__icon"><span className="material-symbols-outlined text-[20px]">{item.icon}</span></span><span className="mobile-nav-item__label">{item.name}</span></Link>;
            })}
            <div className={`mobile-nav-plus-wrap ${mobileSecondaryActive ? "mobile-nav-plus-wrap--active" : ""}`}>
              <div className={`mobile-secondary-menu ${mobileNavOpen ? "mobile-secondary-menu--open" : ""}`} aria-hidden={!mobileNavOpen}>
                {mobileSecondaryNav.map((item, index) => <Link key={item.name} href={item.href} tabIndex={mobileNavOpen ? 0 : -1} style={{ "--mobile-delay": `${index * 45}ms` } as React.CSSProperties} className="mobile-secondary-item"><span className="mobile-secondary-item__icon"><span className="material-symbols-outlined text-[18px]">{item.icon}</span></span><span>{item.name}</span></Link>)}
              </div>
              <button type="button" className={`mobile-plus-button ${mobileNavOpen ? "mobile-plus-button--open" : ""}`} onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? "Fermer Jobs, Kiosque et Profil" : "Afficher Jobs, Kiosque et Profil"} aria-expanded={mobileNavOpen}><span className="mobile-plus-button__icon"><span className="material-symbols-outlined text-[28px]">{mobileNavOpen ? "close" : "add"}</span></span></button>
            </div>
          </div>
        </div>
      </div>

      {notificationPrompt && <div className="fixed bottom-20 left-1/2 z-[120] w-[min(92vw,440px)] -translate-x-1/2 rounded-2xl md:bottom-6 border border-[#e5bdbb] bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-[#9e001f]">notifications_active</span><div className="flex-1"><h2 className="font-display text-base font-extrabold">Recevoir les nouvelles publications ?</h2><p className="mt-1 text-sm leading-6 text-slate-600">Autorisez les notifications pour être informé des nouveaux articles, magazines, publications WAB et informations de vos groupes.</p><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={dismissNotificationPrompt} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">Plus tard</button><button type="button" onClick={requestNotifications} className="rounded-lg bg-[#9e001f] px-4 py-2 text-xs font-bold text-white hover:bg-[#c8102e]">Autoriser</button></div></div></div></div>}

      {sideMenuOpen && <div className="fixed inset-0 z-[100] flex justify-end"><button type="button" aria-label="Fermer le fond du menu" className="absolute inset-0 cursor-default bg-black/40" onClick={() => setSideMenuOpen(false)} /><aside className="relative h-full w-[min(92vw,420px)] overflow-y-auto bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><Link href={platform.homeHref} onClick={() => setSideMenuOpen(false)}><img src={platform.logoSrc} alt={platform.logoAlt} className="h-12 w-auto" /></Link><button type="button" onClick={() => setSideMenuOpen(false)} aria-label="Fermer le menu" className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100">×</button></div><p className="text-[13px] leading-6 text-[#5c403f]">Une chaîne regroupant toutes les valeurs pour votre succès en entreprise. Plus qu'un magazine, Envol Africa accompagne les projets et les talents africains.</p><Link href="/don" onClick={() => setSideMenuOpen(false)} className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#9e001f] text-[13px] font-bold text-white">Soutenir ENVOL AFRICA</Link><div className="mt-8 space-y-1">{sidePanelLinks.map((item) => { const internalHref = internalBrowserHref(item.href); return <Link key={item.name} href={internalHref || item.href} target={internalHref ? undefined : "_blank"} rel={internalHref ? undefined : "noreferrer"} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] hover:bg-[#f6f3f2]"><span className="h-1.5 w-1.5 rounded-full bg-[#9e001f]" />{item.name}</Link>; })}</div><div className="mt-8 rounded-2xl border border-[#e5bdbb] bg-[#f0eded] p-5"><h2 className="font-display text-base font-extrabold">{platform.name}</h2><p className="mt-2 text-[13px] leading-5 text-[#5c403f]">Accédez directement à l’espace {platform.name} et retrouvez votre compte partagé.</p><Link href={platform.homeHref} onClick={() => setSideMenuOpen(false)} className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#303030] text-[12px] font-bold text-white">Accéder à l’espace</Link></div></aside></div>}
    </>
  );
}
