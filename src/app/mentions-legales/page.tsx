import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions Légales & Informations Éditeur",
  description: "Mentions légales, identification de l'éditeur et hébergement d'Envol Africa Magazine.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Cadre Réglementaire
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        Mentions Légales
      </h1>
      <p className="mt-6 font-sans text-sm leading-7 text-[#5c403f]">
        Conformément aux lois régissant la communication numérique et les publications de presse en ligne, voici les informations officielles relatives au site <strong>envolafrica.site</strong>.
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">1. Éditeur de la Publication</h2>
          <p className="mt-2 text-[#5c403f]">
            Le site internet et les publications numériques d’Envol Africa Magazine sont édités par le groupe de presse <strong>Envol Africa Groupe</strong>.
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[#5c403f]">
            <li><strong>Dénomination :</strong> Envol Africa Magazine</li>
            <li><strong>Siège et Rédaction centrale :</strong> Cotonou, République du Bénin</li>
            <li><strong>Bureaux régionaux :</strong> Abidjan (Côte d’Ivoire), Dakar (Sénégal)</li>
            <li><strong>E-mail officiel :</strong> contact@envolafrica.site</li>
            <li><strong>Directeur de la publication :</strong> La Direction de la Rédaction Envol Africa</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">2. Hébergement de la Plateforme</h2>
          <p className="mt-2 text-[#5c403f]">
            L&apos;infrastructure d&apos;hébergement cloud et de distribution de contenu (Edge CDN) est assurée par :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-[#5c403f]">
            <li><strong>Hébergeur :</strong> Vercel Inc.</li>
            <li><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
            <li><strong>Base de données sécurisée :</strong> Supabase Inc. (infrastructures conformes SOC2 et ISO 27001)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">3. Propriété Intellectuelle</h2>
          <p className="mt-2 text-[#5c403f]">
            Tous les contenus présents sur cette plateforme (articles, analyses, infographies, maquettes de magazines, logos, marques déposées, éléments graphiques et logiciels) sont la propriété exclusive d&apos;Envol Africa Magazine ou de ses partenaires cessionnaires.
          </p>
          <p className="mt-2 text-[#5c403f]">
            Toute reproduction intégrale ou partielle, extraction automatisée ou diffusion sans autorisation expresse préalable écrite est formellement prohibée.
          </p>
        </div>

        <div>
          <h2 className="font-display text-xl font-extrabold text-[#292323]">4. Contact Régie & Rédaction</h2>
          <p className="mt-2 text-[#5c403f]">
            Pour toute notification juridique, demande de droit de réponse ou sollicitation de notre régie publicitaire, veuillez utiliser notre formulaire sur la page <Link href="/contact" className="font-bold text-[#9e001f] underline">Contact</Link> ou envoyer un courrier électronique à <a href="mailto:contact@envolafrica.site" className="font-bold text-[#9e001f] underline">contact@envolafrica.site</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
