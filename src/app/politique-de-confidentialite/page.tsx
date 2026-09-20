import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de Confidentialité & Protection des Données",
  description: "Engagement d'Envol Africa Magazine pour la confidentialité et la protection de vos données personnelles.",
  alternates: { canonical: "/politique-de-confidentialite" },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Protection de la Vie Privée
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        Politique de Confidentialité
      </h1>
      <p className="mt-6 font-sans text-sm leading-7 text-[#5c403f]">
        Chez <strong>Envol Africa Magazine</strong>, nous accordons une importance primordiale à la protection de la vie privée de nos lecteurs, annonceurs et partenaires. La présente politique détaille notre engagement en matière de traitement des données personnelles conformément aux standards applicables en Afrique (APDP Bénin, CNDP) et internationaux (RGPD).
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">1. Données Collectées</h2>
          <p className="mt-2 text-[#5c403f]">
            Nous collectons uniquement les informations nécessaires au bon fonctionnement de nos services et à la gestion de vos abonnements :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[#5c403f]">
            <li><strong>Données de compte :</strong> nom, prénom, adresse e-mail professionnelle, langue préférée.</li>
            <li><strong>Données de transaction :</strong> historique d’achats et statut d’abonnement (les données de paiement par carte bancaire ou Mobile Money sont traitées exclusivement par notre passerelle agréée Moneroo et ne transitent jamais sur nos serveurs).</li>
            <li><strong>Données de navigation et mesure d&apos;audience :</strong> statistiques agrégées et anonymisées via Google Analytics dans le respect du consentement.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">2. Utilisation de vos Données</h2>
          <p className="mt-2 text-[#5c403f]">
            Vos données personnelles sont strictement utilisées pour :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[#5c403f]">
            <li>Fournir l’accès à vos magazines, articles abonnés et commandes marketplace.</li>
            <li>Vous transmettre notre lettre d’information économique (newsletter) si vous y avez consenti, avec possibilité de désinscription immédiate en un clic.</li>
            <li>Sécuriser la plateforme contre les fraudes et abus informatiques.</li>
          </ul>
          <p className="mt-3 font-bold text-[#9e001f]">
            Envol Africa ne vend, ne loue et ne cède jamais vos données personnelles à des tiers à des fins commerciales.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">3. Vos Droits & Exercice</h2>
          <p className="mt-2 text-[#5c403f]">
            Vous disposez d’un droit d’accès, de rectification, de portabilité et d’effacement de vos données personnelles. Vous pouvez exercer ces droits à tout moment en adressant un e-mail à notre délégué à la protection des données : <a href="mailto:contact@envolafrica.site" className="font-bold text-[#9e001f] underline">contact@envolafrica.site</a>.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">4. Cookies et Traceurs</h2>
          <p className="mt-2 text-[#5c403f]">
            Pour en savoir plus sur les cookies utilisés et gérer vos préférences, consultez notre page dédiée <Link href="/cookies" className="font-bold text-[#9e001f] underline">Politique des Cookies</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
