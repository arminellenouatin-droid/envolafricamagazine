"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPlatformKey, PLATFORM_CONFIGS } from "@/lib/platforms";

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

function FooterLinks({ items }: { items: Array<{ name: string; href: string }> }) {
  return <ul className="space-y-3 text-[12px] text-[#e4e2e1]">{items.map((item) => item.href.startsWith("http") ? <li key={item.name}><a href={item.href} target="_blank" rel="noreferrer" className="hover:text-white">{item.name}</a></li> : <li key={item.name}><Link href={item.href} className="hover:text-white">{item.name}</Link></li>)}</ul>;
}

export default function Footer() {
  const pathname = usePathname();
  const platform = PLATFORM_CONFIGS[getPlatformKey(pathname)];
  return (
    <footer>
      <div className="border-b border-white/10 bg-[#1b1c1c] px-5 py-10 md:px-[64px]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-6 md:flex-row">
          <Link href={platform.homeHref} aria-label={`Accueil ${platform.name}`}><img src="/logo-blanc-footer.png" alt={platform.logoAlt} className="h-[56px] w-auto object-contain" /></Link>
          <div><p className="max-w-[720px] text-[13px] leading-6 text-white">Une chaîne regroupant toutes les valeurs pour votre succès en entreprise. Plus qu'un magazine, Envol Africa accompagne les projets et les talents africains.</p><p className="mt-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#ffdad8]">Espace actuel : {platform.name}</p></div>
        </div>
      </div>
      <div className="bg-[#1b1c1c] px-5 py-12 md:px-[64px]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 md:grid-cols-4">
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Tous nos sites</h4><FooterLinks items={siteLinks} /></div>
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Nos accompagnements</h4><FooterLinks items={supportLinks} /></div>
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Applications & Services</h4><FooterLinks items={serviceLinks} /></div>
          <div><h4 className="mb-4 text-[13px] font-bold uppercase tracking-widest text-[#ffdad8]">Publicité & Suivi</h4><FooterLinks items={contactLinks} /></div>
        </div>
      </div>
      <div className="bg-[#eae7e7] px-5 py-5 md:px-[64px]"><div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 md:flex-row"><p className="text-[12px] text-[#1c1b1b]">©2026 <a href="https://envolafrica.net/" target="_blank" rel="noreferrer" className="font-bold hover:text-[#9e001f]">Envol Africa</a> Groupe. Tous droits réservés</p><div className="flex items-center gap-4 text-[12px] text-[#474646]"><a href="https://envolafrica.net/" target="_blank" rel="noreferrer" className="hover:text-[#9e001f]">Terms</a><span className="text-[#e5bdbb]">;</span><a href="https://envolafrica.net/" target="_blank" rel="noreferrer" className="hover:text-[#9e001f]">Privacy</a><span className="text-[#e5bdbb]">;</span><a href="https://envolafrica.net/" target="_blank" rel="noreferrer" className="hover:text-[#9e001f]">Cookies</a><span className="hidden items-center gap-2 md:flex"><span className="h-2 w-2 rounded-full bg-green-600" />Paiement Moneroo sécurisé</span></div></div></div>
    </footer>
  );
}
