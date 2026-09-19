"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type EcosystemExperience = {
  key: string;
  name: string;
  href: string;
  icon: string;
  accent: string;
  soft: string;
  title: string;
  body: string;
};

const experiences: EcosystemExperience[] = [
  { key: "magazine", name: "Magazine", href: "/", icon: "menu_book", accent: "#9e001f", soft: "#fff1f2", title: "Les analyses pour décider avec hauteur", body: "Retrouvez les récits, tendances et repères qui donnent une longueur d’avance aux dirigeants africains." },
  { key: "kiosque", name: "Kiosque", href: "/kiosque", icon: "library_books", accent: "#9e001f", soft: "#fff1f2", title: "Emportez l’essentiel avec vous", body: "Feuilletez les numéros et construisez votre bibliothèque de référence, où que vous soyez." },
  { key: "jobs", name: "Jobs", href: "/emploi", icon: "work", accent: "#087e8b", soft: "#eefcfa", title: "Les talents et les opportunités se rencontrent", body: "Explorez les offres, les profils et les parcours qui font avancer les organisations africaines." },
  { key: "marketplace", name: "Market", href: "/marketplace", icon: "storefront", accent: "#9e001f", soft: "#fff7ed", title: "Découvrez ceux qui produisent ici", body: "Trouvez des produits, services et entrepreneurs sélectionnés dans l’écosystème Envol Africa." },
  { key: "financement", name: "Finance", href: "/financement", icon: "account_balance", accent: "#087e8b", soft: "#eefcfa", title: "Une idée mérite les bons partenaires", body: "Parcourez les projets, opportunités de financement et initiatives qui cherchent leur prochain relais." },
  { key: "awards", name: "Awards", href: "/africa-awards", icon: "emoji_events", accent: "#a66b16", soft: "#fff8e7", title: "Célébrons celles et ceux qui ouvrent la voie", body: "Rencontrez les talents, les initiatives et les histoires qui inspirent l’Afrique en mouvement." },
  { key: "wab", name: "WAB", href: "/wab", icon: "public", accent: "#006874", soft: "#eefcfa", title: "Votre réseau professionnel est déjà là", body: "Publiez, échangez, trouvez des partenaires et faites circuler vos opportunités dans World Africa Business." },
];

const platformFromPath = (pathname: string) => {
  if (pathname.startsWith("/wab")) return "wab";
  if (pathname.startsWith("/emploi")) return "jobs";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  if (pathname.startsWith("/financement")) return "financement";
  if (pathname.startsWith("/africa-awards")) return "awards";
  if (pathname.startsWith("/kiosque")) return "kiosque";
  return "magazine";
};

const excludedPath = (pathname: string) => ["/auth", "/compte", "/panier", "/moneroo", "/admin", "/wab/admin", "/marketplace/admin"].some((prefix) => pathname.startsWith(prefix));

const FIRST_PLATFORM_INTRO_DELAY = 2 * 60 * 1000;
const randomDelay = () => 30 * 60 * 1000 + Math.floor(Math.random() * (30 * 60 * 1000 + 1));

export default function PromoPopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<EcosystemExperience | null>(null);
  const [visitCount, setVisitCount] = useState(1);
  const currentPlatform = useMemo(() => platformFromPath(pathname), [pathname]);

  useEffect(() => {
    if (excludedPath(pathname)) return;
    const introKey = `ea_platform_intro_seen_${currentPlatform}`;
    const hasSeenPlatform = localStorage.getItem(introKey) === "1";
    let visibleMs = 0;
    let lastTick = Date.now();
    let active = true;

    const showPlatformIntro = () => {
      if (!active || document.visibilityState !== "visible" || localStorage.getItem(introKey) === "1") return;
      const visits = Number(localStorage.getItem("ea_ecosystem_visit_count") || 0) + 1;
      localStorage.setItem("ea_ecosystem_visit_count", String(visits));
      localStorage.setItem(introKey, "1");
      localStorage.setItem("ea_ecosystem_popup_last", String(Date.now()));
      localStorage.setItem("ea_ecosystem_popup_next", String(Date.now() + randomDelay()));
      setVisitCount(visits);
      setCurrent(experiences.find((experience) => experience.key === currentPlatform) || experiences[0]);
      setShow(true);
    };

    if (!hasSeenPlatform) {
      const interval = window.setInterval(() => {
        const now = Date.now();
        if (document.visibilityState === "visible") visibleMs += now - lastTick;
        lastTick = now;
        if (visibleMs >= FIRST_PLATFORM_INTRO_DELAY) {
          window.clearInterval(interval);
          showPlatformIntro();
        }
      }, 1000);
      return () => { active = false; window.clearInterval(interval); };
    }

    const now = Date.now();
    const scheduled = Number(localStorage.getItem("ea_ecosystem_popup_next") || 0);
    const nextAt = scheduled > now ? scheduled : now + randomDelay();
    localStorage.setItem("ea_ecosystem_popup_next", String(nextAt));
    const timer = window.setTimeout(() => {
      const available = experiences.filter((experience) => experience.key !== currentPlatform);
      if (!available.length) return;
      const visits = Number(localStorage.getItem("ea_ecosystem_visit_count") || 0) + 1;
      localStorage.setItem("ea_ecosystem_visit_count", String(visits));
      const index = (visits + Math.floor(now / (60 * 60 * 1000))) % available.length;
      setVisitCount(visits);
      setCurrent(available[index]);
      setShow(true);
      localStorage.setItem("ea_ecosystem_popup_last", String(Date.now()));
      localStorage.setItem("ea_ecosystem_popup_next", String(Date.now() + randomDelay()));
    }, Math.max(1000, nextAt - now));
    return () => { active = false; window.clearTimeout(timer); };
  }, [currentPlatform, pathname]);

  const close = () => setShow(false);
  if (!show || !current) return null;
  const congratulations = visitCount <= 1 ? "Félicitations, vous commencez votre découverte de l’écosystème." : visitCount < 4 ? "Bravo, votre parcours Envol Africa prend forme." : "Félicitations, vous explorez déjà les différentes facettes d’Envol Africa.";

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[110] sm:left-auto sm:right-4 sm:w-[360px] md:bottom-5" role="status" aria-labelledby="ecosystem-popup-title">
      <div className="relative overflow-hidden rounded-2xl border border-[#e6c9c7] bg-white shadow-[0_16px_40px_rgba(54,19,24,.18)]">
        <div className="flex items-center justify-between border-b border-[#f0dedd] px-3.5 py-2.5" style={{ backgroundColor: current.soft }}>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-white shadow-xs" style={{ color: current.accent }}>
              <span className="material-symbols-outlined text-[18px]">{current.icon}</span>
            </div>
            <div>
              <span className="block text-[9px] font-black uppercase tracking-wider" style={{ color: current.accent }}>Découverte Écosystème</span>
              <span className="block font-sans text-[11px] font-bold text-[#302829]">{current.name}</span>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Fermer la suggestion" className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[#4a3433] shadow-xs transition hover:bg-white hover:text-[#9e001f]"><span className="material-symbols-outlined text-[16px]">close</span></button>
        </div>
        <div className="p-3.5">
          <h2 id="ecosystem-popup-title" className="font-display text-[13px] font-black leading-snug text-[#292323] line-clamp-1">{current.title}</h2>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#635655]">{current.body}</p>
          <div className="mt-3 flex items-center gap-2">
            <Link href={current.href} onClick={close} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-xl px-3 font-sans text-[11px] font-black text-white shadow-xs transition hover:brightness-105" style={{ backgroundColor: current.accent }}>Explorer {current.name} <span className="text-[12px]">→</span></Link>
            <button type="button" onClick={close} className="h-8 rounded-xl border border-[#ead9d7] px-3 font-sans text-[11px] font-bold text-[#635655] transition hover:border-[#9e001f] hover:text-[#9e001f]">Plus tard</button>
          </div>
        </div>
      </div>
    </div>
  );
}
