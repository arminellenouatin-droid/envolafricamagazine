// Style Envol Africa : transparence numérique sobre, lisible et orientée vers le contrôle utilisateur.
import Link from "next/link";

export const metadata = {
  title: "Politique relative aux cookies | Envol Africa",
  description: "Politique relative aux cookies et au stockage local d’Envol Africa.",
  robots: { index: true, follow: true },
};

const updated = "24 août 2026";

export default function CookiesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f]">← Retour au Magazine</Link>
      <p className="mt-10 font-sans text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">Document officiel · Mise à jour : {updated}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-[#292323] md:text-6xl">Politique relative aux cookies</h1>
      <p className="mt-6 max-w-3xl font-sans text-sm leading-7 text-[#635655]">Cette page décrit l’utilisation des cookies, du stockage local et des technologies similaires sur les services Envol Africa.</p>

      <article className="mt-12 space-y-9 font-sans text-sm leading-7 text-[#443a39]">
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">1. Qu’est-ce qu’un cookie ?</h2><p className="mt-2">Un cookie est un petit fichier ou identifiant conservé par le navigateur. Le stockage local et les technologies similaires peuvent remplir une fonction comparable. Ils ne permettent pas nécessairement de vous identifier directement, mais peuvent être associés à votre compte ou à votre appareil.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">2. Cookies strictement nécessaires</h2><p className="mt-2">Ils sont utilisés pour maintenir une session, protéger les formulaires, sécuriser l’authentification, mémoriser un panier, gérer les préférences essentielles et prévenir les abus. Leur désactivation peut empêcher certaines fonctions du site.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">3. Préférences</h2><p className="mt-2">Avec votre choix, nous pouvons conserver la langue, la devise, le pays, le thème clair ou sombre et certains réglages d’affichage. Ces éléments servent à éviter de vous redemander les mêmes préférences à chaque visite.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">4. Mesure d’audience</h2><p className="mt-2">Des outils d’analyse comme Google Analytics 4 peuvent être activés uniquement lorsqu’ils sont configurés et lorsque le consentement ou une autre base légale appropriée est requis. Ils servent à comprendre les performances, les parcours et les erreurs, et non à vendre vos données personnelles.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">5. Publicité</h2><p className="mt-2">Si des publicités, notamment Google AdSense, sont activées, leurs cookies et identifiants peuvent être soumis au consentement applicable et aux informations du fournisseur. L’activation effective d’un service publicitaire dépend de sa configuration, de son examen et de ses propres règles ; cette page ne constitue pas une promesse de validation publicitaire.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">6. Contrôler vos choix</h2><p className="mt-2">Vous pouvez accepter, refuser ou retirer votre consentement depuis le bandeau ou les réglages de confidentialité lorsqu’ils sont proposés. Vous pouvez également supprimer les cookies et le stockage local dans les paramètres de votre navigateur. Le retrait ne supprime pas les données déjà collectées pour une autre finalité ; pour exercer vos droits, consultez la <Link href="/confidentialite" className="font-bold text-[#9e001f] underline">Politique de confidentialité</Link>.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">7. Prestataires et mises à jour</h2><p className="mt-2">Certains services techniques, d’authentification, de paiement, de mesure ou de publicité peuvent déposer leurs propres technologies sous réserve de leur activation. Les informations peuvent évoluer lorsque les services changent. La date de la dernière mise à jour figure en haut de cette page.</p></section>
      </article>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-[#e5d9d7] pt-6 font-sans text-xs font-bold text-[#9e001f]"><Link href="/conditions" className="underline">Conditions d’utilisation</Link><Link href="/confidentialite" className="underline">Politique de confidentialité</Link><Link href="/service" className="underline">Contact</Link></div>
    </main>
  );
}
