"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlatformKey, PLATFORM_CONFIGS, platformOptions, type PlatformConfig } from "@/lib/platforms";

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

export default function Header({ user }: { user?: { id: string; nom?: string; prenom?: string; email?: string; role?: string } }) {
  const pathname = usePathname();
  const platform = useMemo(() => PLATFORM_CONFIGS[getPlatformKey(pathname)], [pathname]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    setMegaMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const readCart = () => {
      const saved = localStorage.getItem("eam_cart");
      if (!saved) return setCartCount(0);
      try { setCartCount(JSON.parse(saved).length); } catch { setCartCount(0); }
    };
    readCart();
    const interval = window.setInterval(readCart, 1000);
    const savedMode = localStorage.getItem("eam_dark_mode");
    if (savedMode === "dark") { setDarkMode(true); document.documentElement.classList.add("dark"); }

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
    return () => window.clearInterval(interval);
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

  return (
    <>
      <nav className="hidden items-center justify-between border-b border-white/10 bg-[#303030] px-5 py-2 text-white md:flex lg:px-[64px]" style={{ fontFamily: "Century Gothic, Inter, sans-serif" }}>
        <div className="flex items-center gap-5 text-[12px] font-medium">
          {firstLineMenus.map((item) => <Link key={item.name} href={item.href} className="flex items-center gap-1.5 transition-colors hover:text-[#ffdad8]"><span className="material-symbols-outlined text-[16px]">{item.icon}</span>{item.name}</Link>)}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20" title="Traduction"><span className="material-symbols-outlined text-[18px]">translate</span></button>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20" title="Devise"><span className="material-symbols-outlined text-[18px]">payments</span></button>
          <button type="button" onClick={toggleDarkMode} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20" title={darkMode ? "Mode clair" : "Mode sombre"}><span className="material-symbols-outlined text-[18px]">{darkMode ? "light_mode" : "dark_mode"}</span></button>
        </div>
      </nav>

      <header className="sticky top-0 z-40 border-b border-[#e5bdbb] bg-[#fcf9f8] shadow-sm">
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

            <div className="relative hidden lg:block">
              <button type="button" aria-expanded={megaMenuOpen} onClick={() => setMegaMenuOpen((open) => !open)} onMouseEnter={() => setMegaMenuOpen(true)} className="flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-bold text-white transition-colors hover:brightness-110" style={{ backgroundColor: platform.accent }}>
                {platform.megaLabel}<span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {megaMenuOpen && <MegaMenu platform={platform} onClose={() => setMegaMenuOpen(false)} />}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 border-r border-[#e5bdbb] pr-3 lg:flex">
              <Link href="/panier" aria-label="Panier" className="relative grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">shopping_cart</span>{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[9px] font-bold text-white">{cartCount}</span>}</Link>
              <button type="button" onClick={() => setNotificationPrompt(true)} aria-label="Notifications" className={`grid h-9 w-9 place-items-center rounded-full hover:bg-[#e5bdbb] ${notificationsEnabled ? "bg-[#e9f7f5] text-[#087e8b]" : "bg-[#f6f3f2]"}`}><span className="material-symbols-outlined text-[20px]">notifications</span></button>
              <Link href="/service" aria-label="Messages" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">mail</span></Link>
              <Link href="/compte/favoris" aria-label="Favoris" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">favorite</span></Link>
              <button type="button" onClick={() => setShowSearch((open) => !open)} aria-label="Rechercher" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] hover:bg-[#e5bdbb]"><span className="material-symbols-outlined text-[20px]">search</span></button>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              {user ? <Link href="/compte" className="max-w-[130px] truncate rounded bg-[#0A1931] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#152a4d]">{displayName}</Link> : <Link href="/auth/login" className="rounded bg-[#dc2626] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#b91c1c]">Se connecter</Link>}
              <Link href="/abonnement" className="rounded bg-[#303030] px-4 py-2 text-[12px] font-bold text-white hover:bg-black">S'abonner</Link>
              <Link href="/don" className="rounded bg-[#16a34a] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#15803d]">Faire un don</Link>
            </div>
            <button type="button" onClick={() => setSideMenuOpen(true)} aria-label="Ouvrir le menu" className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-[#303030] text-white hover:bg-black"><span className="material-symbols-outlined">menu</span></button>
          </div>
        </div>

        {showSearch && <div className="border-t border-[#e5bdbb] bg-white p-4"><form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) window.location.assign(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`); }} className="mx-auto flex max-w-[720px] gap-2"><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher..." className="h-11 flex-1 rounded-lg border bg-[#f6f3f2] px-4" /><button type="button" onClick={() => setShowSearch(false)} aria-label="Fermer la recherche" className="grid h-11 w-11 place-items-center rounded-full border">×</button></form></div>}
      </header>

      <section className="hidden items-center overflow-hidden border-b border-[#e5bdbb] bg-[#f0eded] py-2 md:flex">
        <div className="flex w-full items-center px-5 lg:px-[64px]">
          <span className="mr-4 shrink-0 bg-[#9e001f] px-3 py-1 text-[12px] font-bold tracking-wider text-white">À LA UNE</span>
          <div className="flex-1 overflow-hidden"><p className="scrolling-ticker text-[13px] font-black text-black" style={{ fontFamily: "Century Gothic, sans-serif" }}>• Transition énergétique Nigeria 12M$ • Sommet UA libre-échange • PIB continental prévisions 2025 • Fintech Kenya • ZLECAf 1,3Md • Cacao 50% transformation locale • Wave 20M utilisateurs</p></div>
          <div className="ml-4 flex items-center gap-2 whitespace-nowrap text-[12px] font-bold text-black"><span className="material-symbols-outlined text-[16px]">location_on</span>{cityWeather.city} • {cityWeather.temp} {cityWeather.icon}</div>
        </div>
      </section>

      <div className="md:hidden">
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-around border-b border-[#e5bdbb] bg-[#fcf9f8] px-2 py-2">
          {[{ icon: "live_tv", label: "Live", href: "/" }, { icon: "shopping_cart", label: "Panier", href: "/panier" }, { icon: "favorite", label: "Favoris", href: "/compte/favoris" }, { icon: "mail", label: "Message", href: "/service" }, { icon: "notifications", label: "Notif", href: "#notifications" }, { icon: "translate", label: "Trad", href: "#" }, { icon: "person", label: "Profil", href: "/compte" }].map((item) => item.href === "#notifications" ? <button type="button" key={item.label} onClick={() => setNotificationPrompt(true)} className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[20px]">{item.icon}</span><span className="text-[9px] font-medium">{item.label}</span></button> : <Link key={item.label} href={item.href} className="flex flex-col items-center gap-0.5"><span className="material-symbols-outlined text-[20px]">{item.icon}</span><span className="text-[9px] font-medium">{item.label}</span></Link>)}
        </div>
        <div className="pt-[56px]">
          <header className="flex h-[56px] items-center justify-between border-b border-[#e5bdbb] bg-[#fcf9f8] px-4">
            <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`} className="flex min-w-0 items-center gap-3"><img src={platform.logoSrc} alt={platform.logoAlt} className="h-8 w-auto" /><span className="max-w-[160px] truncate text-[13px] font-black" style={{ color: platform.accent }}>{platform.name}</span></Link>
            <div className="flex items-center gap-2"><button type="button" onClick={() => setMegaMenuOpen((open) => !open)} aria-label="Ouvrir les actions de la plateforme" className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ backgroundColor: platform.accent }}><span className="material-symbols-outlined">{platform.megaLabel === "+" ? "add" : "apps"}</span></button><button type="button" onClick={() => setShowSearch((open) => !open)} aria-label="Rechercher" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2]"><span className="material-symbols-outlined">search</span></button><button type="button" onClick={() => setSideMenuOpen(true)} aria-label="Ouvrir le menu" className="grid h-9 w-9 place-items-center rounded-full bg-[#303030] text-white"><span className="material-symbols-outlined">menu</span></button></div>
          </header>
          {megaMenuOpen && <div className="relative z-50"><MegaMenu platform={platform} onClose={() => setMegaMenuOpen(false)} /></div>}
          {showSearch && <div className="border-b bg-white p-4"><form onSubmit={(event) => { event.preventDefault(); if (searchQuery.trim()) window.location.assign(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`); }}><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher..." className="h-11 w-full rounded-lg border bg-[#f6f3f2] px-4" /></form></div>}
        </div>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e5bdbb] bg-white/95 px-2 py-2 backdrop-blur"><div className="flex items-center justify-around">{[{ name: "Accueil", href: platform.homeHref, icon: "home" }, { name: "Kiosque", href: "/kiosque", icon: "menu_book" }, { name: "Jobs", href: "/emploi", icon: "work" }, { name: "Crowdfunding", href: "/financement", icon: "volunteer_activism" }, { name: "Marketplace", href: "/marketplace", icon: "storefront" }, { name: "Awards", href: "/africa-awards", icon: "emoji_events" }, { name: "WAB", href: "/wab", icon: "public" }].map((item) => <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 ${pathname === item.href ? "text-[#9e001f]" : "text-[#5c403f]"}`}><span className="material-symbols-outlined text-[20px]">{item.icon}</span><span className="text-[9px] font-medium">{item.name}</span></Link>)}</div></div>
      </div>

      {notificationPrompt && <div className="fixed bottom-20 left-1/2 z-[120] w-[min(92vw,440px)] -translate-x-1/2 rounded-2xl md:bottom-6 border border-[#e5bdbb] bg-white p-5 shadow-2xl"><div className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-[#9e001f]">notifications_active</span><div className="flex-1"><h2 className="font-display text-base font-extrabold">Recevoir les nouvelles publications ?</h2><p className="mt-1 text-sm leading-6 text-slate-600">Autorisez les notifications pour être informé des nouveaux articles, magazines, publications WAB et informations de vos groupes.</p><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={dismissNotificationPrompt} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50">Plus tard</button><button type="button" onClick={requestNotifications} className="rounded-lg bg-[#9e001f] px-4 py-2 text-xs font-bold text-white hover:bg-[#c8102e]">Autoriser</button></div></div></div></div>}

      {sideMenuOpen && <div className="fixed inset-0 z-[100] flex justify-end"><button type="button" aria-label="Fermer le fond du menu" className="absolute inset-0 cursor-default bg-black/40" onClick={() => setSideMenuOpen(false)} /><aside className="relative h-full w-[min(92vw,420px)] overflow-y-auto bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><Link href={platform.homeHref} onClick={() => setSideMenuOpen(false)}><img src={platform.logoSrc} alt={platform.logoAlt} className="h-12 w-auto" /></Link><button type="button" onClick={() => setSideMenuOpen(false)} aria-label="Fermer le menu" className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100">×</button></div><p className="text-[13px] leading-6 text-[#5c403f]">Une chaîne regroupant toutes les valeurs pour votre succès en entreprise. Plus qu'un magazine, Envol Africa accompagne les projets et les talents africains.</p><Link href="/don" onClick={() => setSideMenuOpen(false)} className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#9e001f] text-[13px] font-bold text-white">Soutenir ENVOL AFRICA</Link><div className="mt-8 space-y-1">{sidePanelLinks.map((item) => <a key={item.name} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] hover:bg-[#f6f3f2]"><span className="h-1.5 w-1.5 rounded-full bg-[#9e001f]" />{item.name}</a>)}</div><div className="mt-8 rounded-2xl border border-[#e5bdbb] bg-[#f0eded] p-5"><h2 className="font-display text-base font-extrabold">{platform.name}</h2><p className="mt-2 text-[13px] leading-5 text-[#5c403f]">Accédez directement à l’espace {platform.name} et retrouvez votre compte partagé.</p><Link href={platform.homeHref} onClick={() => setSideMenuOpen(false)} className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#303030] text-[12px] font-bold text-white">Accéder à l’espace</Link></div></aside></div>}
    </>
  );
}
