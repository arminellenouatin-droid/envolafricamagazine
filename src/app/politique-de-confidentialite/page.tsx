import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de Confidentialité & Protection des Données",
  description: "Engagement d'Envol Africa Magazine pour la confidentialité, la conformité APDP/RGPD, la gestion des sous-traitants et la conservation des données.",
  alternates: { canonical: "/politique-de-confidentialite" },
  openGraph: {
    title: "Politique de Confidentialité & Protection des Données | Envol Africa",
    description: "Engagement d'Envol Africa Magazine pour la confidentialité, la conformité APDP/RGPD, la gestion des sous-traitants et la conservation des données.",
    url: "/politique-de-confidentialite",
    type: "website",
    siteName: "Envol Africa",
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Protection de la Vie Privée & Données Personnelles
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        Politique de Confidentialité
      </h1>
      <p className="mt-6 font-sans text-sm leading-7 text-[#5c403f]">
        Chez <strong>Envol Africa Groupe SARL</strong>, nous accordons une importance primordiale à la protection de la vie privée de nos lecteurs, abonnés, créateurs, marchands et partenaires. La présente politique détaille notre engagement en matière de traitement des données personnelles conformément aux dispositions de la loi sur la protection des données personnelles en République du Bénin (APDP), des règles communautaires africaines et du Règlement Général sur la Protection des Données (RGPD).
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">1. Données Collectées</h2>
          <p className="mt-2 text-[#5c403f]">
            Nous collectons exclusivement les informations nécessaires au bon fonctionnement de nos services, à la livraison des contenus et à la sécurité des transactions :
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[#5c403f]">
            <li><strong>Données d&apos;identité et de compte :</strong> nom, prénom, adresse e-mail professionnelle, langue préférée, devise d&apos;affichage, pays de résidence.</li>
            <li><strong>Données de portefeuille virtuel (Wallet) & Affiliation :</strong> historique des commissions générées, liens et codes de parrainage attribués, soldes de gains et coordonnées de paiement pour les reversements (numéro Mobile Money ou RIB professionnel fourni lors des demandes de retrait).</li>
            <li><strong>Données de transaction :</strong> historique des commandes Kiosque et Marketplace, statuts d&apos;abonnements et jetons de téléchargement sécurisés. <em>Note : Les coordonnées bancaires sensibles (numéros de carte, codes secrets) sont traitées exclusivement par notre opérateur agréé Moneroo et ne transitent ni ne sont jamais stockées sur nos serveurs.</em></li>
            <li><strong>Données de communication :</strong> messages envoyés via nos formulaires de contact, inscriptions à la newsletter économique.</li>
            <li><strong>Données de navigation et mesure d&apos;audience :</strong> statistiques anonymisées et agrégées via Google Analytics (adresse IP anonymisée), conditionnées au recueil préalable de votre consentement.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">2. Durées Précises de Conservation des Données</h2>
          <p className="mt-2 text-[#5c403f]">
            Vos données personnelles sont conservées uniquement pendant la durée strictement nécessaire aux finalités pour lesquelles elles ont été collectées :
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[#eadfce] bg-white text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#f7f1e8] text-[#292323] font-bold">
                <tr>
                  <th className="p-3">Catégorie de données</th>
                  <th className="p-3">Durée de conservation</th>
                  <th className="p-3">Finalité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e7dc] text-[#5c403f]">
                <tr>
                  <td className="p-3 font-semibold">Comptes utilisateurs actifs</td>
                  <td className="p-3">Durée de la relation + 3 ans après la dernière activité</td>
                  <td className="p-3">Gestion du compte, accès aux abonnements</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Transactions, commandes & factures</td>
                  <td className="p-3">10 ans (obligation légale)</td>
                  <td className="p-3">Conformité fiscale, comptable et audit financier</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Portefeuille virtuel & Affiliation</td>
                  <td className="p-3">Durée du compte + 5 ans après dernier retrait</td>
                  <td className="p-3">Traçabilité anti-fraude et lutte contre le blanchiment</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Logs de connexion & sécurité</td>
                  <td className="p-3">12 mois glissants</td>
                  <td className="p-3">Sécurité informatique et prévention des cyberattaques</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Cookies de mesure d&apos;audience</td>
                  <td className="p-3">13 mois maximum</td>
                  <td className="p-3">Statistiques de fréquentation anonymisées</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">3. Sous-Traitants & Prestataires Techniques Tiers</h2>
          <p className="mt-2 text-[#5c403f]">
            Pour assurer la haute disponibilité, la sécurité et l&apos;exécution technique de nos services, Envol Africa collabore avec des sous-traitants rigoureusement sélectionnés garantissant un niveau de protection élevé :
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-2 text-[#5c403f]">
            <li><strong>Vercel Inc. (États-Unis) :</strong> Fournisseur d&apos;hébergement cloud en bordure de réseau (Edge CDN) et d&apos;infrastructures serverless certifiées ISO 27001 et SOC 2 Type II.</li>
            <li><strong>Supabase Inc. (Singapour / AWS Cloud) :</strong> Gestionnaire de la base de données PostgreSQL sécurisée, de l&apos;authentification et du stockage chiffré des ressources documentaires.</li>
            <li><strong>Google LLC (États-Unis / Irlande) :</strong> Mesure d&apos;audience anonymisée (Google Analytics 4 avec respect du consentement) et distribution des alertes éditoriales (Firebase Cloud Messaging).</li>
            <li><strong>Moneroo SAS :</strong> Opérateur de paiement agréé garantissant la conformité PCI-DSS pour le traitement sécurisé des règlements par cartes bancaires et Mobile Money (MTN, Moov, Orange, Wave).</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">4. Portefeuille Virtuel (Wallet) & Sécurité Financière</h2>
          <p className="mt-2 text-[#5c403f]">
            Les opérations de crédit, débit et versement associées au portefeuille utilisateur et au programme d&apos;affiliation font l&apos;objet de vérifications strictes :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[#5c403f]">
            <li>Les tables financières de notre base de données sont protégées par des politiques d&apos;accès Zéro-Trust (RLS étanches) interdisant tout accès public direct.</li>
            <li>Chaque retrait d&apos;affilié fait l&apos;objet d&apos;un audit préalable pour certifier l&apos;authenticité des conversions et prévenir les tentatives de fraude.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">5. Vos Droits & Délégué à la Protection des Données (DPO)</h2>
          <p className="mt-2 text-[#5c403f]">
            Conformément à la réglementation applicable, vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement, de portabilité de vos données et d&apos;opposition.
          </p>
          <p className="mt-2 text-[#5c403f]">
            Pour exercer l&apos;un de ces droits ou pour toute interrogation relative à vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données à l&apos;adresse suivante :{" "}
            <a href="mailto:dpo@envolafrica.site" className="font-bold text-[#9e001f] underline">dpo@envolafrica.site</a> ou via <a href="mailto:contact@envolafrica.site" className="font-bold text-[#9e001f] underline">contact@envolafrica.site</a>.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">6. Cookies et Préférences de Traçage</h2>
          <p className="mt-2 text-[#5c403f]">
            Vous pouvez modifier votre choix à tout moment concernant les cookies statistiques grâce à notre bandeau de consentement ou consulter le détail de nos traceurs sur la page dédiée <Link href="/cookies" className="font-bold text-[#9e001f] underline">Politique des Cookies</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
