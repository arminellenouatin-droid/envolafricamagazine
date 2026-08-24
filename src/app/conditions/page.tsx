// Style Envol Africa : document légal éditorial, clair, accessible et sans surcharge visuelle.
import Link from "next/link";

export const metadata = {
  title: "Conditions d’utilisation | Envol Africa",
  description: "Conditions d’utilisation de l’écosystème Envol Africa.",
  robots: { index: true, follow: true },
};

const updated = "24 août 2026";

export default function ConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f]">← Retour au Magazine</Link>
      <p className="mt-10 font-sans text-[10px] font-black uppercase tracking-[0.18em] text-[#9e001f]">Document officiel · Mise à jour : {updated}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-[#292323] md:text-6xl">Conditions d’utilisation</h1>
      <p className="mt-6 max-w-3xl font-sans text-sm leading-7 text-[#635655]">Les présentes conditions encadrent l’accès à Envol Africa Magazine, World Africa Business, Africa Awards, Kiosque, Marketplace, Jobs, Crowdfunding et aux autres services numériques exploités par Envol Africa Groupe.</p>

      <article className="mt-12 space-y-9 font-sans text-sm leading-7 text-[#443a39]">
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">1. Éditeur et acceptation</h2><p className="mt-2">Envol Africa Groupe exploite l’écosystème Envol Africa. En consultant le site, en créant un compte ou en utilisant un service, vous reconnaissez avoir lu ces conditions. Si vous n’acceptez pas une disposition, vous devez cesser d’utiliser le service concerné. Les informations d’identification de l’éditeur et les coordonnées de contact sont accessibles depuis la page <Link href="/service" className="font-bold text-[#9e001f] underline">Contact</Link>.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">2. Comptes et sécurité</h2><p className="mt-2">Vous devez fournir des informations exactes, conserver vos identifiants confidentiels et nous signaler toute utilisation non autorisée. Les connexions Google, Facebook ou TikTok peuvent être proposées lorsque le service correspondant est activé. L’utilisateur reste responsable de l’accès à son compte et des informations fournies par le fournisseur d’identité.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">3. Contenus et règles de conduite</h2><p className="mt-2">Les articles, magazines, formations, offres, publications, commentaires, images et vidéos sont soumis aux droits de leurs auteurs et aux lois applicables. Il est interdit de publier du contenu illégal, trompeur, discriminatoire, violent, contrefaisant, malveillant ou portant atteinte aux droits d’une autre personne. Envol Africa peut modérer, retirer ou limiter un contenu qui enfreint ces règles, sans préjudice des droits prévus par la loi.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">4. Abonnements, achats et paiements</h2><p className="mt-2">Les prix, taxes éventuelles, conditions d’accès et durées sont affichés avant la confirmation. Les paiements peuvent être traités par un prestataire de paiement tel que Moneroo ; Envol Africa ne demande pas et ne stocke pas les données complètes de carte bancaire dans son application. Les conditions particulières d’un abonnement, d’un produit numérique, d’un service, d’une candidature, d’un vote, d’un don ou d’une contribution peuvent compléter ces conditions.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">5. Africa Awards</h2><p className="mt-2">Les compétitions, candidatures, votes, cadeaux, dons, cagnottes et sessions live sont soumis aux paramètres affichés pour chaque opération. Une participation ne garantit pas un résultat, un classement ou un reversement. Les opérations financières sont confirmées uniquement après validation effective du prestataire de paiement et selon les règles de la compétition concernée.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">6. Marketplace et contenus numériques</h2><p className="mt-2">Les vendeurs sont responsables de l’exactitude de leurs annonces, de leurs produits, de leurs services, de leurs formations et de leurs fichiers numériques. Envol Africa peut suspendre une annonce ou un compte en cas de fraude, de violation de droits ou de risque pour les utilisateurs. L’accès à un fichier numérique après paiement dépend de la disponibilité du produit et des conditions affichées.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">7. Disponibilité et responsabilité</h2><p className="mt-2">Nous mettons en œuvre des mesures raisonnables pour maintenir un service fiable, mais aucun service en ligne ne peut être garanti sans interruption. Les liens et contenus de tiers restent sous la responsabilité de leurs éditeurs. Ces conditions ne limitent pas les droits impératifs accordés aux consommateurs par la loi applicable.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">8. Suppression du compte et contact</h2><p className="mt-2">Vous pouvez demander la fermeture de votre compte et la suppression des données associées en utilisant la page <Link href="/service" className="font-bold text-[#9e001f] underline">Contact</Link>. Nous pouvons conserver certaines informations lorsque la loi, la prévention de la fraude, la preuve d’une transaction ou un litige le justifie. La suppression ne supprime pas nécessairement les contenus légalement archivés ou anonymisés.</p></section>
        <section><h2 className="font-display text-xl font-extrabold text-[#292323]">9. Modification</h2><p className="mt-2">Ces conditions peuvent évoluer pour refléter les services, la réglementation ou les exigences des plateformes partenaires. La date de mise à jour est indiquée en haut de cette page. Les changements importants seront signalés par un moyen approprié.</p></section>
      </article>

      <div className="mt-12 flex flex-wrap gap-4 border-t border-[#e5d9d7] pt-6 font-sans text-xs font-bold text-[#9e001f]"><Link href="/confidentialite" className="underline">Politique de confidentialité</Link><Link href="/cookies" className="underline">Politique cookies</Link><Link href="/service" className="underline">Demander la suppression de mon compte</Link></div>
    </main>
  );
}
