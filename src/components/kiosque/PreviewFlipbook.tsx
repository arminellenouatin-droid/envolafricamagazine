"use client";

import { useEffect, useState } from "react";

type PreviewFlipbookProps = {
  title: string;
  cover: string;
  pages?: string[];
  onClose: () => void;
  onPurchase: () => void;
};

export default function PreviewFlipbook({ title, cover, pages = [], onClose, onPurchase }: PreviewFlipbookProps) {
  const [page, setPage] = useState(1);
  const readablePages = pages.length > 0 ? pages.slice(0, 8) : [cover];
  const isBlocked = page >= 10;
  const isPartiallyMasked = page === 9;
  const currentImage = readablePages[page - 1] || readablePages[readablePages.length - 1] || cover;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setPage((current) => Math.min(10, current + 1));
      if (event.key === "ArrowLeft") setPage((current) => Math.max(1, current - 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1b1c1c]/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="flipbook-title">
      <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f7f3f1] shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-[#e5bdbb] bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9e001f]">Aperçu du magazine</p>
            <h2 id="flipbook-title" className="truncate text-sm font-bold text-[#2b2525]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#2b2525] hover:bg-[#f0eded] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9e001f]" aria-label="Fermer l’aperçu"><span className="material-symbols-outlined">close</span></button>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#2b2525] p-3 sm:p-8">
          <div className="relative aspect-[3/4] w-full max-w-[520px] overflow-hidden rounded-md bg-white shadow-2xl">
            <img src={currentImage} alt={`${title}, page ${page}`} className={`h-full w-full object-cover ${isBlocked ? "opacity-0" : ""}`} />
            {isPartiallyMasked && <div className="absolute inset-y-0 right-0 w-1/2 bg-[#1b1c1c]/85 backdrop-blur-[2px]" aria-label="Contenu protégé" />}
            {isBlocked && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-6 text-center">
              <span className="material-symbols-outlined text-5xl text-[#9e001f]">lock</span>
              <h3 className="mt-4 text-xl font-bold text-[#2b2525]">Acheter pour lire tout le numéro</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#746665]">Les huit premières pages sont accessibles gratuitement. Achetez ce numéro pour poursuivre la lecture.</p>
              <button type="button" onClick={onPurchase} className="mt-5 min-h-11 rounded-xl bg-[#9e001f] px-6 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Choisir une version</button>
            </div>}
            {!isBlocked && <span className="absolute bottom-3 left-3 rounded-full bg-[#1b1c1c]/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Page {page} / 8 gratuites</span>}
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5bdbb] bg-white px-4 py-3 sm:px-6">
          <span className="text-xs text-[#746665]">Utilisez les flèches du clavier ou les boutons pour feuilleter.</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c3c1] text-[#2b2525] disabled:opacity-40" aria-label="Page précédente"><span className="material-symbols-outlined">chevron_left</span></button>
            <span className="min-w-16 text-center text-xs font-bold text-[#2b2525]">{page} / 10</span>
            <button type="button" onClick={() => setPage((current) => Math.min(10, current + 1))} disabled={page === 10} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c3c1] text-[#2b2525] disabled:opacity-40" aria-label="Page suivante"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function getPreviewPages(magazine: { previewImages?: string[]; cover: string }) {
  return magazine.previewImages?.length ? magazine.previewImages.slice(0, 8) : [magazine.cover];
}
