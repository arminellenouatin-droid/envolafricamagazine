import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales d’Utilisation & de Vente",
  description: "Conditions générales d’utilisation et de vente régissant l'écosystème Envol Africa Magazine, le Kiosque, la Marketplace et les services d'affiliation.",
  alternates: { canonical: "/conditions" },
};

export default function ConditionsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Cadre Contractuel
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        Conditions Générales d’Utilisation & de Vente (CGU / CGV)
      </h1>
      <p className="mt-6 font-sans text-sm leading-7 text-[#5c403f]">
        Les présentes Conditions Générales régissent l’accès et l’utilisation de l’ensemble des services numériques proposés par <strong>Envol Africa Groupe</strong> sur la plateforme <strong>envolafrica.site</strong>, incluant le magazine d’information économique, le Kiosque numérique, la Marketplace panafricaine, les services d’offres d’emploi, de financement participatif et le programme d’affiliation.
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">1. Objet et Acceptation des Conditions</h2>
          <p className="mt-2 text-[#5c403f]">
            Toute navigation, inscription, souscription d’abonnement ou achat sur le site implique l’acceptation pleine, entière et sans réserve des présentes conditions par l’utilisateur. Si vous n’acceptez pas ces termes, vous devez cesser d’utiliser nos services.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">2. Comptes Utilisateurs et Sécurité</h2>
          <p className="mt-2 text-[#5c403f]">
            Pour accéder à certaines fonctionnalités (lecture intégrale d’articles abonnés, bibliothèque Kiosque, boutique vendeur, participation crowdfunding ou vote awards), l’utilisateur doit créer un compte personnel. L’utilisateur s’engage à fournir des informations exactes et à préserver la stricte confidentialité de ses identifiants. Toute action effectuée depuis son compte est réputée réalisée par lui-même.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">3. Abonnements et Kiosque Numérique</h2>
          <p className="mt-2 text-[#5c403f]">
            Les abonnements donnent accès aux éditions numériques d’Envol Africa Magazine ainsi qu’aux articles d’investigation économique réservés. La consultation s’effectue via notre lecteur sécurisé Flipbook. Les prévisualisations sont limitées aux pages gratuites définies par la rédaction (pages 1 à 8 pour les magazines sous paywall).
          </p>
          <p className="mt-2 text-[#5c403f]">
            Toute tentative de contournement des verrous techniques ou d’extraction non autorisée des fichiers PDF protégés constitue une violation grave sanctionnée par la résiliation immédiate du compte sans préavis ni remboursement.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">4. Marketplace et Commandes Marchandes</h2>
          <p className="mt-2 text-[#5c403f]">
            La Marketplace permet la vente de produits physiques, numériques, formations et services par des vendeurs tiers indépendants ou par Envol Africa. Chaque vendeur est seul responsable de la conformité, de la qualité et de la livraison de ses produits.
          </p>
          <p className="mt-2 text-[#5c403f]">
            Pour les produits numériques, un jeton de téléchargement horodaté et sécurisé est émis dès confirmation de la commande.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">5. Programme d’Affiliation et Commissions</h2>
          <p className="mt-2 text-[#5c403f]">
            Les affiliés enregistrés disposent d’un lien et d’un code de parrainage personnel. Les commissions (sur abonnements ou produits de la marketplace) sont calculées et créditées sur le portefeuille affilié après validation effective du paiement par notre passerelle. Les demandes de retrait de fonds sont soumises à vérification administrative et audit anti-fraude.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">6. Paiements Sécurisés et Devises</h2>
          <p className="mt-2 text-[#5c403f]">
            Les transactions financières sont opérées en Francs CFA (XOF) ou dans les devises converties équivalentes via notre partenaire de paiement sécurisé <strong>Moneroo</strong> (supportant Mobile Money MTN, Moov, Orange, Wave et cartes Visa/Mastercard).
          </p>
          <p className="mt-2 text-[#5c403f]">
            Aucune coordonnée bancaire ou numéro de compte de paiement n’est conservé sur les serveurs d’Envol Africa.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">7. Propriété Intellectuelle</h2>
          <p className="mt-2 text-[#5c403f]">
            L’intégralité des marques, textes, photographies éditoriales, infographies et logiciels de la plateforme demeure la propriété exclusive d’Envol Africa Groupe. Toute reproduction sans accord écrit est formellement interdite.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">8. Loi Applicable et Juridiction Compétente</h2>
          <p className="mt-2 text-[#5c403f]">
            Les présentes conditions sont régies par le droit en vigueur en République du Bénin et par les règles communautaires OHADA. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire devant les tribunaux compétents de Cotonou.
          </p>
          <p className="mt-4 text-[#5c403f]">
            Pour toute question ou assistance, notre équipe est à votre disposition via notre page <Link href="/contact" className="font-bold text-[#9e001f] underline">Contact</Link> ou par e-mail à <a href="mailto:contact@envolafrica.site" className="font-bold text-[#9e001f] underline">contact@envolafrica.site</a>.
          </p>
        </div>
      </section>
    </main>
  );
}

