import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique Relative aux Cookies & Traceurs",
  description: "Modalités d'utilisation des cookies essentiels et statistiques d'audience anonymisés sur Envol Africa Magazine.",
  alternates: { canonical: "/cookies" },
  openGraph: {
    title: "Politique Relative aux Cookies | Envol Africa",
    description: "Modalités d'utilisation des cookies essentiels et statistiques d'audience anonymisés sur Envol Africa Magazine.",
    url: "/cookies",
    type: "website",
    siteName: "Envol Africa",
  },
};

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Transparence Numérique
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        Politique Relative aux Cookies
      </h1>
      <p className="mt-6 font-sans text-sm leading-7 text-[#5c403f]">
        Cette page détaille la manière dont la plateforme <strong>envolafrica.site</strong> utilise les cookies techniques et les traceurs d&apos;audience anonymisés afin de garantir le bon fonctionnement du site et d&apos;adapter nos services éditoriaux.
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">1. Cookies Techniques & Strictement Nécessaires</h2>
          <p className="mt-2 text-[#5c403f]">
            Ces témoins de connexion sont indispensables pour naviguer sur le site, mémoriser votre panier Marketplace, sécuriser vos sessions d’authentification et appliquer vos préférences de thème ou de langue. Ils ne peuvent être désactivés sans altérer gravement le fonctionnement de la plateforme.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">2. Mesure d&apos;Audience & Statistiques (Google Analytics 4)</h2>
          <p className="mt-2 text-[#5c403f]">
            Ces cookies nous aident à comprendre le volume de visites et les rubriques les plus consultées (analyses économiques, Kiosque, opportunités). Conformément au Google Consent Mode v2 et aux recommandations de l’APDP, ces traceurs sont désactivés par défaut et ne s&apos;activent que si vous cliquez sur « Tout accepter » dans notre bandeau de consentement.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">3. Gestion de vos Choix</h2>
          <p className="mt-2 text-[#5c403f]">
            Vous pouvez à tout moment effacer vos données locales depuis les paramètres de votre navigateur ou solliciter notre équipe pour toute question relative à la vie privée via notre page <Link href="/contact" className="font-bold text-[#9e001f] underline">Contact</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
