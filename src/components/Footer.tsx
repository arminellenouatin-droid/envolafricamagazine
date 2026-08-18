"use client";

import Link from "next/link";
import type { ReactNode, TouchEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getPlatformKey, PLATFORM_CONFIGS } from "@/lib/platforms";
import { internalBrowserHref } from "@/lib/internal-browser";

const siteLinks = [
  { name: "Magazine", href: "/" },
  { name: "Kiosque", href: "/kiosque" },
  { name: "World Africa Business", href: "/wab" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Jobs", href: "/emploi" },
  { name: "Africa Awards", href: "/africa-awards" },
  { name: "Crowdfunding", href: "/financement" },
  { name: "Salons", href: "/salons" },
];

const supportLinks = [
  { name: "Ingénierie digitale", href: "https://envolafrica.net/" },
  { name: "Newsletters", href: "https://envolafrica.net/" },
  { name: "Abonnement", href: "/abonnement" },
  { name: "Levée de fonds et accompagnement", href: "https://envolafrica.net/" },
  { name: "Programme d'affiliation", href: "/affiliation" },
  { name: "Kit média", href: "https://envolafrica.net/" },
  { name: "Recherche de financement", href: "https://envolafrica.net/" },
];

const serviceLinks = [
  { name: "Sur Android", href: "https://direct.kkiapay.me/4788/business-angel-1" },
  { name: "Sur iPhone", href: "https://envolafrica.net/" },
  { name: "Sur Huawei", href: "https://envolafrica.net/" },
  { name: "Externalisation / Applications", href: "https://envolafrica.net/" },
  { name: "Formation et recyclage", href: "https://envolafrica.net/" },
];

const contactLinks = [
  { name: "Publicité", href: "https://envolafrica.net/" },
  { name: "Suivi complet", href: "https://envolafrica.net/" },
  { name: "Applications", href: "https://envolafrica.net/" },
  { name: "Contact Régie", href: "/service" },
  { name: "Mentions Légales", href: "https://envolafrica.net/" },
  { name: "CGU / Confidentialité", href: "https://envolafrica.net/" },
];

function ExternalLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const internalHref = internalBrowserHref(href);
  return internalHref ? <Link href={internalHref} className={className}>{children}</Link> : <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
}

function FooterLinks({ items }: { items: Array<{ name: string; href: string }> }) {
  return <ul className="space-y-3 text-[12px] text-[#e4e2e1]">{items.map((item) => item.href.startsWith("http") ? <li key={item.name}><ExternalLink href={item.href} className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]">{item.name}</ExternalLink></li> : <li key={item.name}><Link href={item.href} className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]">{item.name}</Link></li>)}</ul>;
}

type FooterMenu = { title: string; items: Array<{ name: string; href: string }> };

function FooterMenusCarousel({ menus }: { menus: FooterMenu[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % menus.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isPaused, menus.length]);

  const goTo = (index: number) => {
    setActiveIndex((index + menus.length) % menus.length);
    setIsPaused(true);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setIsPaused(true);
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    const delta = endX === undefined ? 0 : endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    goTo(activeIndex + (delta < 0 ? 1 : -1));
  };

  return (
    <div
      className="md:hidden"
      onMouseEnter={() => setIsPaused(true)}
      onFocusCapture={() => setIsPaused(true)}
      onPointerDown={() => setIsPaused(true)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Menus du footer"
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {menus.map((menu) => (
            <section key={menu.title} className="w-full shrink-0" aria-label={menu.title}>
              <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">{menu.title}</h4>
              <FooterLinks items={menu.items} />
            </section>
          ))}
        </div>
      </div>
      <div className="mt-7 flex items-center justify-between gap-4">
        <button type="button" onClick={() => goTo(activeIndex - 1)} className="min-h-11 rounded border border-white/20 px-3 text-[11px] font-bold uppercase tracking-wide text-[#e4e2e1] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]" aria-label="Menu précédent">Précédent</button>
        <div className="flex items-center gap-2" aria-label={`Menu ${activeIndex + 1} sur ${menus.length}`}>
          {menus.map((menu, index) => (
            <button key={menu.title} type="button" onClick={() => goTo(index)} className={`h-2.5 w-2.5 rounded-full transition-transform duration-200 motion-reduce:transition-none ${index === activeIndex ? "scale-110 bg-[#ffdad8]" : "bg-white/30"}`} aria-label={`Afficher ${menu.title}`} aria-current={index === activeIndex ? "true" : undefined} />
          ))}
        </div>
        <button type="button" onClick={() => goTo(activeIndex + 1)} className="min-h-11 rounded border border-white/20 px-3 text-[11px] font-bold uppercase tracking-wide text-[#e4e2e1] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]" aria-label="Menu suivant">Suivant</button>
      </div>
    </div>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const platform = PLATFORM_CONFIGS[getPlatformKey(pathname)];
  return (
    <footer>
      <div className="border-b border-white/10 bg-[#1b1c1c] px-5 py-10 md:px-[64px]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 md:flex-row">
          <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`}><img src="/logo-blanc-footer.png" alt={platform.logoAlt} className="h-[56px] w-auto object-contain" /></Link>
          <div><p className="max-w-[720px] text-[13px] leading-6 text-white">Une chaîne regroupant toutes les valeurs pour votre succès en entreprise. Plus qu&apos;un magazine, Envol Africa accompagne les projets et les talents africains.</p><p className="mt-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ffdad8]">Espace actuel : {platform.name}</p></div>
        </div>
      </div>
      <div className="bg-[#1b1c1c] px-5 py-12 md:px-[64px]">
        <div className="mx-auto hidden max-w-[1280px] grid-cols-2 gap-8 md:grid md:grid-cols-4">
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Tous nos sites</h4><FooterLinks items={siteLinks} /></div>
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Nos accompagnements</h4><FooterLinks items={supportLinks} /></div>
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Applications & Services</h4><FooterLinks items={serviceLinks} /></div>
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Publicité & Suivi</h4><FooterLinks items={contactLinks} /></div>
        </div>
        <FooterMenusCarousel menus={[
          { title: "Tous nos sites", items: siteLinks },
          { title: "Nos accompagnements", items: supportLinks },
          { title: "Applications & Services", items: serviceLinks },
          { title: "Publicité & Suivi", items: contactLinks },
        ]} />
      </div>
      <div className="bg-[#eae7e7] px-5 py-5 md:px-[64px]"><div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 md:flex-row"><p className="text-[12px] text-[#1c1b1b]">©2026 <ExternalLink href="https://envolafrica.net/" className="font-bold hover:text-[#9e001f]">Envol Africa</ExternalLink> Groupe. Tous droits réservés</p><div className="flex items-center gap-4 text-[12px] text-[#474646]"><ExternalLink href="https://envolafrica.net/" className="hover:text-[#9e001f]">Terms</ExternalLink><span className="text-[#e5bdbb]">;</span><ExternalLink href="https://envolafrica.net/" className="hover:text-[#9e001f]">Privacy</ExternalLink><span className="text-[#e5bdbb]">;</span><ExternalLink href="https://envolafrica.net/" className="hover:text-[#9e001f]">Cookies</ExternalLink><span className="hidden items-center gap-2 md:flex"><span className="h-2 w-2 rounded-full bg-green-600" />Paiement Moneroo sécurisé</span></div></div></div>
    </footer>
  );
}
