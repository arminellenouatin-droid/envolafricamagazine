import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable (404)",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-[#fcf9f8] px-6 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#9e001f]/10 text-[#9e001f] text-xs font-black uppercase tracking-[0.2em] mb-6">
          Erreur 404 • Page introuvable
        </span>
        <h1 className="font-serif text-4xl sm:text-6xl text-[#292323] font-bold tracking-tight mb-4">
          Cette page a pris un autre envol
        </h1>
        <p className="text-zinc-600 text-base sm:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Le document ou la rubrique que vous cherchez n'existe plus, a changé d'adresse ou est momentanément indisponible.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#9e001f] text-white text-sm font-bold shadow-md hover:bg-[#800018] transition"
          >
            Retour au Magazine
          </Link>
          <Link
            href="/kiosque"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-zinc-300 bg-white text-zinc-800 text-sm font-bold hover:bg-zinc-50 transition"
          >
            Consulter le Kiosque
          </Link>
          <Link
            href="/recherche"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-zinc-300 bg-white text-zinc-800 text-sm font-bold hover:bg-zinc-50 transition"
          >
            Rechercher un article
          </Link>
        </div>

        <div className="pt-8 border-t border-zinc-200">
          <p className="text-xs uppercase font-bold tracking-wider text-zinc-400 mb-4">
            Explorer les autres piliers de l'écosystème Envol Africa
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#0A1931]">
            <Link href="/emploi" className="hover:text-[#9e001f] transition">Emploi & Recrutement</Link>
            <span>•</span>
            <Link href="/marketplace" className="hover:text-[#9e001f] transition">Marketplace</Link>
            <span>•</span>
            <Link href="/financement" className="hover:text-[#9e001f] transition">Crowdfunding</Link>
            <span>•</span>
            <Link href="/africa-awards" className="hover:text-[#9e001f] transition">Africa Awards</Link>
            <span>•</span>
            <Link href="/wab" className="hover:text-[#9e001f] transition">World Africa Business</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
