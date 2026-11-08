"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception safely without sensitive data
    console.error("Runtime application error caught by error boundary:", error.message);
  }, [error]);

  return (
    <main className="min-h-[75vh] flex items-center justify-center bg-[#fcf9f8] px-6 py-16">
      <div className="max-w-xl mx-auto text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[#9e001f]/10 text-[#9e001f] text-xs font-black uppercase tracking-[0.2em] mb-6">
          Incident Technique Temporaire
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#292323] font-bold tracking-tight mb-4">
          Une difficulté inattendue est survenue
        </h1>
        <p className="text-zinc-600 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
          Nos équipes ont été notifiées de cet incident. Vous pouvez relancer la page ou revenir à l’accueil du Magazine pour poursuivre votre navigation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center h-12 px-7 rounded-xl bg-[#9e001f] text-white text-sm font-bold shadow-md hover:bg-[#800018] transition"
          >
            Réessayer maintenant
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-zinc-300 bg-white text-zinc-800 text-sm font-bold hover:bg-zinc-50 transition"
          >
            Retour au Magazine
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-zinc-300 bg-white text-zinc-800 text-sm font-bold hover:bg-zinc-50 transition"
          >
            Contacter l’assistance
          </Link>
        </div>
      </div>
    </main>
  );
}
