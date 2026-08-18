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

const randomDelay = () => 30 * 60 * 1000 + Math.floor(Math.random() * (30 * 60 * 1000 + 1));

export default function PromoPopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState<EcosystemExperience | null>(null);
  const currentPlatform = useMemo(() => platformFromPath(pathname), [pathname]);

  useEffect(() => {
    if (excludedPath(pathname)) return;
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
      setCurrent(available[index]);
      setShow(true);
      localStorage.setItem("ea_ecosystem_popup_last", String(Date.now()));
      localStorage.setItem("ea_ecosystem_popup_next", String(Date.now() + randomDelay()));
    }, Math.max(1000, nextAt - now));
    return () => window.clearTimeout(timer);
  }, [currentPlatform, pathname]);

  const close = () => setShow(false);
  if (!show || !current) return null;
  const visits = Number(localStorage.getItem("ea_ecosystem_visit_count") || 1);
  const congratulations = visits <= 1 ? "Félicitations, vous commencez votre découverte de l’écosystème." : visits < 4 ? "Bravo, votre parcours Envol Africa prend forme." : "Félicitations, vous explorez déjà les différentes facettes d’Envol Africa.";

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#151112]/45 p-4 backdrop-blur-[3px]" role="dialog" aria-modal="true" aria-labelledby="ecosystem-popup-title"><div className="relative w-full max-w-[480px] overflow-hidden rounded-[22px] border border-[#e6c9c7] bg-[#fffdfc] shadow-[0_24px_80px_rgba(54,19,24,.26)]"><button type="button" onClick={close} aria-label="Fermer la découverte" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[#4a3433] shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9e001f]"><span className="material-symbols-outlined">close</span></button><div className="relative overflow-hidden px-6 pb-7 pt-8" style={{ backgroundColor: current.soft }}><div className="absolute -right-16 -top-20 h-48 w-48 rounded-full border-[20px] border-white/50" /><div className="relative"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: current.accent }}><span className="material-symbols-outlined text-[26px]">{current.icon}</span></div><p className="mt-5 font-sans text-[10px] font-black uppercase tracking-[0.17em]" style={{ color: current.accent }}>Une nouvelle étape dans votre parcours</p><p className="mt-2 max-w-[360px] font-serif text-[25px] font-semibold leading-[1.05] text-[#292323]">{congratulations}</p></div></div><div className="p-6"><div className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: current.accent }}><span className="material-symbols-outlined text-[18px]">arrow_forward</span> À découvrir : {current.name}</div><h2 id="ecosystem-popup-title" className="mt-3 font-display text-[22px] font-extrabold leading-tight text-[#292323]">{current.title}</h2><p className="mt-3 text-[14px] leading-6 text-[#635655]">{current.body}</p><div className="mt-6 flex flex-col gap-2 sm:flex-row"><Link href={current.href} onClick={close} className="flex h-12 flex-1 items-center justify-center rounded-xl px-5 font-sans text-[12px] font-black text-white transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ backgroundColor: current.accent }}>Découvrir {current.name} <span className="ml-2">→</span></Link><button type="button" onClick={close} className="h-12 rounded-xl border border-[#ead9d7] px-5 font-sans text-[12px] font-bold text-[#635655] transition hover:border-[#9e001f] hover:text-[#9e001f]">Continuer ici</button></div><p className="mt-4 text-center font-sans text-[10px] text-[#9b8987]">Nous vous proposerons une autre découverte plus tard, sans interrompre votre lecture.</p></div></div></div>;
}
