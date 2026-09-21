import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions Légales & Informations Éditeur",
  description: "Mentions légales, identification officielle de l'éditeur, direction de publication et hébergement d'Envol Africa Magazine.",
  alternates: { canonical: "/mentions-legales" },
  openGraph: {
    title: "Mentions Légales & Informations Éditeur | Envol Africa",
    description: "Mentions légales, statut juridique de l'éditeur, direction de la publication et hébergement d'Envol Africa Magazine.",
    url: "/mentions-legales",
    type: "website",
    siteName: "Envol Africa",
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Cadre Réglementaire & Transparence
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        Mentions Légales
      </h1>
      <p className="mt-6 font-sans text-sm leading-7 text-[#5c403f]">
        Conformément aux lois régissant la presse, la communication audiovisuelle et le commerce électronique en République du Bénin ainsi qu’aux standards de transparence numérique en Afrique, voici les informations légales relatives à la plateforme <strong>envolafrica.site</strong>.
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">1. Éditeur de la Plateforme</h2>
          <p className="mt-2 text-[#5c403f]">
            Le portail d’information, les éditions numériques du magazine, le Kiosque, la Marketplace et les services annexes sont édités par :
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[#5c403f]">
            <li><strong>Raison sociale :</strong> ENVOL AFRICA GROUPE SARL</li>
            <li><strong>Forme juridique :</strong> Société à Responsabilité Limitée (SARL) de droit béninois</li>
            <li><strong>Registre du Commerce et du Crédit Mobilier (RCCM) :</strong> RB/COT/21 B 29845</li>
            <li><strong>Identifiant Fiscal Unique (IFU) :</strong> 3202112845612</li>
            <li><strong>Siège social & Rédaction centrale :</strong> Quartier Haie Vive, Rue 340, Immeuble Envol Africa, Cotonou, République du Bénin</li>
            <li><strong>Bureaux de liaison régionale :</strong> Abidjan (Côte d’Ivoire) · Dakar (Sénégal)</li>
            <li><strong>Directeur de la Publication & Gérant :</strong> M. Arminel LENOUATIN (Président-Fondateur & Directeur Général de la Publication)</li>
            <li><strong>Téléphone officiel :</strong> (+229) 01 97 00 00 00 / (+229) 97 00 00 00</li>
            <li><strong>Courriels officiels :</strong>
              <div className="mt-1 pl-3 text-xs space-y-0.5">
                <div>• Direction Générale : <a href="mailto:contact@envolafrica.site" className="text-[#9e001f] underline">contact@envolafrica.site</a></div>
                <div>• Rédaction Centrale : <a href="mailto:redaction@envolafrica.site" className="text-[#9e001f] underline">redaction@envolafrica.site</a></div>
                <div>• Régie Publicitaire : <a href="mailto:regie@envolafrica.site" className="text-[#9e001f] underline">regie@envolafrica.site</a></div>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">2. Hébergement & Infrastructures Cloud</h2>
          <p className="mt-2 text-[#5c403f]">
            L&apos;infrastructure d&apos;hébergement cloud, la distribution de contenu (Edge CDN) et la sécurité réseau sont assurées par des prestataires techniques de premier rang :
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[#5c403f]">
            <li><strong>Hébergeur Cloud & CDN Edge :</strong> Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#9e001f] underline">vercel.com</a>)</li>
            <li><strong>Base de données & Stockage numérique sécurisé :</strong> Supabase Inc. — 970 Toa Payoh North #07-04, Singapour (Infrastructures infogérées sur data centers AWS conformes SOC 2 Type II et ISO 27001)</li>
            <li><strong>Passerelle de paiement sécurisée :</strong> Moneroo SAS (agréée pour les transactions bancaires et Mobile Money conformes aux normes PCI-DSS)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">3. Propriété Intellectuelle & Droits Réservés</h2>
          <p className="mt-2 text-[#5c403f]">
            Tous les contenus publiés sur cette plateforme (titres, articles, analyses économiques, photographies, maquettes graphiques des magazines du Kiosque, logiciels, marques déposées et logos) sont protégés par le droit de la propriété intellectuelle (OAPI et conventions internationales).
          </p>
          <p className="mt-2 text-[#5c403f]">
            Toute reproduction intégrale ou partielle, extraction automatisée de données (scraping), rediffusion ou exploitation commerciale sans l&apos;accord exprès et préalable d&apos;Envol Africa Groupe SARL est formellement interdite.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">4. Contact Juridique, Droit de Réponse & Régie</h2>
          <p className="mt-2 text-[#5c403f]">
            Pour toute demande d’exercice du droit de réponse, notification de contenu ou sollicitation commerciale, contactez-nous par notre page <Link href="/contact" className="font-bold text-[#9e001f] underline">Contact</Link> ou par courrier électronique adressé à <a href="mailto:contact@envolafrica.site" className="font-bold text-[#9e001f] underline">contact@envolafrica.site</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
