import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos de notre rédaction et de l'écosystème",
  description: "Découvrez l'histoire, la mission panafricaine et l'équipe éditoriale d'Envol Africa Magazine, le guide des dirigeants et créateurs d'entreprise en Afrique.",
  alternates: { canonical: "/a-propos" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-24">
      <Link href="/" className="font-sans text-xs font-bold text-[#9e001f] hover:underline">
        ← Retour au Magazine
      </Link>
      <p className="mt-8 font-sans text-[10px] font-black uppercase tracking-[0.2em] text-[#9e001f]">
        Qui sommes-nous
      </p>
      <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-tight text-[#292323]">
        À propos d&apos;Envol Africa Magazine
      </h1>
      <p className="mt-6 font-sans text-base leading-relaxed text-[#5c403f]">
        <strong>Envol Africa Magazine</strong> est la publication économique et d’affaires de référence dédiée aux décideurs, entrepreneurs, investisseurs et acteurs du développement sur le continent africain.
      </p>

      <section className="mt-12 space-y-10 font-sans text-sm leading-7 text-[#443a39]">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#292323]">Notre Mission</h2>
          <p className="mt-3 text-[#5c403f]">
            Informer avec rigueur, éclairer les mutations économiques africaines et connecter les porteurs de valeur. De Cotonou à Abidjan, de Dakar à Kigali, nous offrons des décryptages sans complaisance, des enquêtes de terrain et des opportunités d’affaires concrètes pour transformer le potentiel de l&apos;Afrique en réussites durables.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#292323]">L&apos;Écosystème Envol Africa</h2>
          <p className="mt-3 text-[#5c403f]">
            Envol Africa ne se résume pas à un magazine papier et numérique. C&apos;est une plateforme globale réunissant plusieurs piliers complémentaires :
          </p>
          <ul className="mt-4 list-disc pl-5 space-y-2 text-[#5c403f]">
            <li><strong>Le Kiosque Numérique :</strong> nos numéros et dossiers spéciaux accessibles au format numérique interactif (Flipbook) et papier.</li>
            <li><strong>La Marketplace Panafricaine :</strong> un espace de commerce B2B et B2C pour valoriser les produits et artisans africains certifiés.</li>
            <li><strong>World Africa Business (WAB) :</strong> le réseau professionnel pour connecter les dirigeants et entrepreneurs du continent.</li>
            <li><strong>Africa Awards :</strong> la célébration annuelle de l&apos;excellence entrepreneuriale, de l&apos;innovation et du leadership féminin.</li>
            <li><strong>Financement & Crowdfunding :</strong> des solutions participatives pour financer les PME et projets prometteurs.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-2xl font-extrabold text-[#292323]">Ligne Éditoriale & Indépendance</h2>
          <p className="mt-3 text-[#5c403f]">
            Notre rédaction s&apos;appuie sur des journalistes, économistes et analystes chevronnés établis à travers le continent. Nous défendons un journalisme indépendant, axé sur les faits, la pédagogie financière et la souveraineté économique des nations africaines.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e5bdbb] bg-[#fffaf9] p-6">
          <h3 className="font-display text-lg font-bold text-[#9e001f]">Nous Contacter</h3>
          <p className="mt-2 text-[#5c403f]">
            Une question, une proposition d&apos;article ou un partenariat éditorial ? Rendez-vous sur notre page <Link href="/contact" className="font-bold text-[#9e001f] underline">Contact</Link> ou écrivez-nous à <a href="mailto:contact@envolafrica.site" className="font-bold text-[#9e001f] underline">contact@envolafrica.site</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
