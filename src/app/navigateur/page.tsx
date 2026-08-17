"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { validateExternalUrl } from "@/lib/internal-browser";

function InternalBrowserContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [frameFailed, setFrameFailed] = useState(false);
  const target = useMemo(() => validateExternalUrl(params.get("url") || ""), [params]);
  const targetHref = target?.toString() || "";

  if (!target) {
    return (
      <main className="min-h-[65vh] bg-[#fcf9f8] px-5 py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#e5bdbb] bg-white p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-[#9e001f]">link_off</span>
          <h1 className="mt-4 font-display text-2xl font-black text-[#303030]">Lien externe invalide</h1>
          <p className="mt-3 text-sm leading-6 text-[#5c403f]">Pour votre sécurité, EAM accepte uniquement les liens HTTP ou HTTPS sans identifiant intégré et sans adresse locale.</p>
          <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-[#303030] px-6 text-sm font-bold text-white">Retour à l’accueil</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] bg-[#f3f5f6]">
      <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Retour" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100"><span className="material-symbols-outlined">arrow_back</span></button>
          <Link href="/" className="font-display text-lg font-black text-[#9e001f]">EAM</Link>
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />{target.hostname}{target.pathname !== "/" ? target.pathname : ""}</div>
          <a href={targetHref} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100"><span className="material-symbols-outlined text-[17px]">open_in_new</span>Ouvrir dehors</a>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-4 md:px-8">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          <span className="material-symbols-outlined text-[18px]">shield</span>
          <p><strong>Navigation intégrée EAM :</strong> le site externe reste affiché dans cette interface lorsque sa politique de sécurité autorise l’intégration. EAM ne contrôle pas le contenu affiché et ne demande jamais vos identifiants dans cette fenêtre.</p>
        </div>

        {frameFailed && <div className="mt-4 rounded-2xl border border-[#e5bdbb] bg-white px-4 py-3 text-sm text-[#5c403f]">Ce site refuse probablement l’intégration dans une iframe. Vous pouvez utiliser le bouton « Ouvrir dehors » pour continuer sur le site officiel.</div>}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe title={`Navigation EAM vers ${target.hostname}`} src={targetHref} className="h-[calc(100vh-260px)] min-h-[560px] w-full" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-same-origin" onError={() => setFrameFailed(true)} />
        </div>
      </div>
    </main>
  );
}

export default function InternalBrowserPage() {
  return <Suspense fallback={<main className="min-h-[70vh] bg-[#f3f5f6] p-8"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center text-sm text-slate-600">Chargement du navigateur EAM…</div></main>}><InternalBrowserContent /></Suspense>;
}
