import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique Publicitaire & Charte de Diffusion | Envol Africa",
  description:
    "Découvrez les règles d'éthique, formats autorisés et engagements de transparence de la régie publicitaire Envol Ads.",
  alternates: { canonical: "/publicite/politique" },
};

export default function PolitiquePublicitairePage() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#2a211a]">
      {/* Header */}
      <section className="border-b border-[#eadfce] bg-white px-5 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[#806c58]">
            <Link href="/" className="hover:text-[#9e001f]">
              Accueil
            </Link>
            <span>›</span>
            <Link href="/publicite" className="hover:text-[#9e001f]">
              Régie Publicitaire
            </Link>
            <span>›</span>
            <span className="text-[#9e001f]">Politique publicitaire</span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-black text-[#2a211a] sm:text-4xl">
            Politique Publicitaire & Charte de Diffusion Envol Ads
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#725f4d]">
            Dernière mise à jour : 10 octobre 2026. Cette charte définit les standards d&apos;intégrité,
            d&apos;acceptabilité des annonces et de respect des lecteurs au sein de l&apos;écosystème
            Envol Africa.
          </p>
        </div>
      </section>

      {/* Contenu */}
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-10 lg:px-16">
        <div className="space-y-10 text-sm leading-relaxed text-[#5c3d19]">
          <section className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-black text-[#2a211a]">
              1. Nos principes fondamentaux
            </h2>
            <p className="mt-3">
              Envol Africa s&apos;engage pour un journalisme panafricain indépendant et un commerce
              équitable. La régie publicitaire Envol Ads respecte quatre piliers non négociables :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong>Identification claire :</strong> Toute communication commerciale porte
                distinctement la mention « Sponsorisé » ou « Publicité ».
              </li>
              <li>
                <strong>Sécurité absolue :</strong> Aucun script tiers (JavaScript/HTML arbitraire)
                n&apos;est exécuté. Les visuels sont exclusivement des images ou vidéos sécurisées
                et contrôlées.
              </li>
              <li>
                <strong>Respect de la vie privée :</strong> Le ciblage est strictement contextuel
                (pays, thématique, appareil). Aucun profilage individuel intrusif n&apos;est opéré.
              </li>
              <li>
                <strong>Zéro gêne de lecture :</strong> Aucune publicité ne bloque la navigation, ne
                déclenche de son sans action de l&apos;utilisateur, ni ne déplace le contenu à
                l&apos;écran (stabilité CLS garantie).
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8">
            <h2 className="font-display text-xl font-black text-rose-900">
              2. Produits et contenus strictement interdits
            </h2>
            <p className="mt-3 text-rose-950">
              Sont formellement refusés sans exception sur l&apos;ensemble de nos supports :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-rose-950">
              <li>
                Promesses de gains irréalistes ou rapides (« Devenez millionnaire en 7 jours »,
                systèmes pyramidaux / MLM, cryptomonnaies frauduleuses).
              </li>
              <li>
                Produits de santé non autorisés, « remèdes miracles » ou allégations médicales non
                prouvées.
              </li>
              <li>
                Contenus pour adultes, jeux d&apos;argent non régulés, armes, drogues ou substances
                illicites.
              </li>
              <li>
                Discours haineux, désinformation, usurpation de marque ou fausses alertes système
                trompeuses.
              </li>
              <li>
                Offres d&apos;emploi exigeant un paiement préalable du candidat pour postuler.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-black text-[#2a211a]">
              3. Processus de modération et sanctions
            </h2>
            <p className="mt-3">
              Chaque campagne soumise fait l&apos;objet d&apos;un double contrôle :
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5">
              <li>
                <strong>Contrôle technique automatisé :</strong> Vérification de l&apos;URL de
                destination (HTTPS obligatoire, liste noire de domaines réputés dangereux),
                conformité des dimensions visuelles et absence de malwares.
              </li>
              <li>
                <strong>Revue éditoriale humaine :</strong> Approbation préalable par l&apos;équipe
                de modération Envol Africa sous 24 heures ouvrées.
              </li>
            </ol>
            <p className="mt-4">
              En cas d&apos;infraction ou de signalements répétés fondés de nos lecteurs, l&apos;annonce
              est immédiatement suspendue et le solde non consommé est géré selon les dispositions de
              nos conditions générales.
            </p>
          </section>

          <section className="rounded-3xl border border-[#eadfce] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-black text-[#2a211a]">
              4. Transparence et signalement lecteur
            </h2>
            <p className="mt-3">
              Chaque encart publicitaire intègre un bouton d&apos;option permettant à tout lecteur de :
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>
                <strong>Masquer l&apos;annonce</strong> pour la durée de sa visite.
              </li>
              <li>
                <strong>Signaler l&apos;annonce</strong> en précisant le motif d&apos;infraction. Tout
                signalement est traité avec la plus grande diligence par notre cellule de confiance.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/publicite"
            className="inline-flex items-center gap-2 rounded-full bg-[#9e001f] px-8 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:bg-[#800019]"
          >
            ← Retour à l&apos;espace publicité
          </Link>
        </div>
      </main>
    </div>
  );
}
