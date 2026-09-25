"use client";

import Link from "next/link";
import type { ReactNode, TouchEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getPlatformKey, PLATFORM_CONFIGS } from "@/lib/platforms";
import { internalBrowserHref } from "@/lib/internal-browser";

interface FooterLinkItem {
  name: string;
  href: string;
  download?: boolean;
  isChatTrigger?: boolean;
}

const ecosystemLinks: FooterLinkItem[] = [
  { name: "Magazine", href: "/" },
  { name: "Kiosque", href: "/kiosque" },
  { name: "Jobs", href: "/emploi" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Crowdfunding", href: "/financement" },
  { name: "Africa Awards", href: "/africa-awards" },
  { name: "World Africa Business", href: "/wab" },
];

const serviceLinks: FooterLinkItem[] = [
  { name: "Ingénierie digitale", href: "/service" },
  { name: "Externalisation", href: "/service" },
  { name: "Levée de fonds et accompagnement", href: "/financement" },
  { name: "Externalisation / Applications", href: "/service" },
  { name: "Recherche de financement", href: "/financement" },
  { name: "Formation et recyclage", href: "/service" },
];

const resourceLinks: FooterLinkItem[] = [
  { name: "Abonnement", href: "/abonnement" },
  { name: "Publicités", href: "/publicite" },
  { name: "Programme d'affiliation", href: "/affiliation" },
  { name: "Kit Media", href: "/api/kit-media", download: true },
  { name: "FAQ", href: "/faq" },
  { name: "Assistance", href: "#assistance", isChatTrigger: true },
  { name: "Newsletter", href: "/#newsletter" },
];

const solutionLinks: FooterLinkItem[] = [
  { name: "DebitMaster", href: "https://debitmaster.com" },
  { name: "AtelierCoutureManager", href: "https://ateliercouturemanager.com" },
];

const legalLinks: FooterLinkItem[] = [
  { name: "Contact Régie", href: "/contact?sujet=regie" },
  { name: "Mentions Légales", href: "/mentions-legales" },
  { name: "CGU", href: "/conditions" },
  { name: "Confidentialité", href: "/politique-de-confidentialite" },
];

function ExternalLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const internalHref = internalBrowserHref(href);
  return internalHref ? (
    <Link href={internalHref} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

function FooterLinks({ items }: { items: FooterLinkItem[] }) {
  const triggerAssistance = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-assistance-chat"));
    }
  };

  return (
    <ul className="space-y-3 text-[12px] text-[#e4e2e1]">
      {items.map((item) => {
        if (item.isChatTrigger) {
          return (
            <li key={item.name}>
              <button
                type="button"
                onClick={triggerAssistance}
                className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8] text-left transition-colors"
              >
                {item.name}
              </button>
            </li>
          );
        }
        if (item.download) {
          return (
            <li key={item.name}>
              <a
                href={item.href}
                download
                className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8] transition-colors"
              >
                {item.name}
              </a>
            </li>
          );
        }
        if (item.href.startsWith("http")) {
          return (
            <li key={item.name}>
              <ExternalLink
                href={item.href}
                className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8] transition-colors"
              >
                {item.name}
              </ExternalLink>
            </li>
          );
        }
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8] transition-colors"
            >
              {item.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type FooterMenu = { title: string; items: FooterLinkItem[] };

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
      className="lg:hidden"
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
        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          className="min-h-11 rounded border border-white/20 px-3 text-[11px] font-bold uppercase tracking-wide text-[#e4e2e1] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]"
          aria-label="Menu précédent"
        >
          Précédent
        </button>
        <div className="flex items-center gap-2" aria-label={`Menu ${activeIndex + 1} sur ${menus.length}`}>
          {menus.map((menu, index) => (
            <button
              key={menu.title}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2.5 w-2.5 rounded-full transition-transform duration-200 motion-reduce:transition-none ${
                index === activeIndex ? "scale-110 bg-[#ffdad8]" : "bg-white/30"
              }`}
              aria-label={`Afficher ${menu.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          className="min-h-11 rounded border border-white/20 px-3 text-[11px] font-bold uppercase tracking-wide text-[#e4e2e1] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffdad8]"
          aria-label="Menu suivant"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const platform = PLATFORM_CONFIGS[getPlatformKey(pathname)];

  const footerMenus: FooterMenu[] = [
    { title: "Écosystème Envol Africa", items: ecosystemLinks },
    { title: "Nos services", items: serviceLinks },
    { title: "Ressources & Programmes", items: resourceLinks },
    { title: "Nos solutions", items: solutionLinks },
    { title: "Légal & Régie", items: legalLinks },
  ];

  return (
    <footer>
      {/* Bannière d'en-tête de pied de page */}
      <div className="border-b border-white/10 bg-[#1b1c1c] px-5 py-10 md:px-[64px]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 md:flex-row">
          <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`}>
            <img
              src="/envolafrica-footer-new.png"
              alt={platform.logoAlt}
              className="h-[56px] w-auto object-contain"
            />
          </Link>
          <div>
            <p className="max-w-[720px] text-[13px] leading-6 text-white">
              Une chaîne regroupant toutes les valeurs pour votre succès en entreprise. Plus qu&apos;un magazine, Envol Africa accompagne les projets et les talents africains.
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ffdad8]">
              Espace actuel : {platform.name}
            </p>
          </div>
        </div>
      </div>

      {/* Grille principale 5 colonnes */}
      <div className="bg-[#1b1c1c] px-5 py-12 md:px-[64px]">
        {/* Desktop / Large Screen: 5 colonnes */}
        <div className="mx-auto hidden max-w-[1280px] grid-cols-2 gap-8 lg:grid lg:grid-cols-5">
          <div>
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Écosystème Envol Africa</h4>
            <FooterLinks items={ecosystemLinks} />
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Nos services</h4>
            <FooterLinks items={serviceLinks} />
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Ressources & Programmes</h4>
            <FooterLinks items={resourceLinks} />
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Nos solutions</h4>
            <FooterLinks items={solutionLinks} />
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Légal & Régie</h4>
            <FooterLinks items={legalLinks} />
          </div>
        </div>

        {/* Mobile / Tablette : Carrousel 5 colonnes */}
        <FooterMenusCarousel menus={footerMenus} />
      </div>

      {/* Barre de copyright et légale */}
      <div className="bg-[#eae7e7] px-5 py-5 md:px-[64px]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-[12px] text-[#1c1b1b]">
            ©2026 <Link href="/" className="font-bold hover:text-[#9e001f]">Envol Africa</Link> Groupe. Tous droits réservés
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#474646]">
            <Link href="/conditions" className="hover:text-[#9e001f]">Conditions (CGU)</Link>
            <span className="text-[#e5bdbb]">;</span>
            <Link href="/politique-de-confidentialite" className="hover:text-[#9e001f]">Confidentialité</Link>
            <span className="text-[#e5bdbb]">;</span>
            <Link href="/mentions-legales" className="hover:text-[#9e001f]">Mentions Légales</Link>
            <span className="text-[#e5bdbb]">;</span>
            <Link href="/cookies" className="hover:text-[#9e001f]">Cookies</Link>
            <span className="hidden items-center gap-2 md:flex">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Paiement Moneroo & Mobile Money sécurisé
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
