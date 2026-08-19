"use client";

import { useEffect, useRef, useState } from "react";

type PreviewFlipbookProps = { title: string; cover: string; pages?: string[]; pdfUrl?: string; language?: string; onClose: () => void; onPurchase: () => void };

export default function PreviewFlipbook({ title, cover, pages = [], pdfUrl, language = "fr", onClose, onPurchase }: PreviewFlipbookProps) {
  const [page, setPage] = useState(1);
  const [pdf, setPdf] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(Boolean(pdfUrl));
  const [pdfError, setPdfError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readablePages = pages.length > 0 ? pages.slice(0, 10) : [];
  const isBlocked = page >= 8;
  const isPartiallyMasked = page === 7 && !pdf;

  useEffect(() => {
    let cancelled = false;
    if (!pdfUrl) { setPdfLoading(false); return; }
    setPdfLoading(true); setPdfError("");
    import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      try {
        const loaded = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise;
        if (!cancelled) setPdf(loaded);
      } catch {
        if (!cancelled) setPdfError("Le PDF ne peut pas être affiché dans cet aperçu.");
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    }).catch(() => { if (!cancelled) { setPdfLoading(false); setPdfError("Le moteur PDF n’est pas disponible dans cet aperçu."); } });
    return () => { cancelled = true; };
  }, [pdfUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!pdf || !canvasRef.current || isBlocked) return;
    pdf.getPage(page).then((pdfPage: any) => {
      if (cancelled || !canvasRef.current) return;
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(1.8, 760 / baseViewport.width);
      const viewport = pdfPage.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      pdfPage.render({ canvasContext: context, viewport }).promise.catch(() => undefined);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [pdf, page, isBlocked]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setPage((current) => Math.min(8, current + 1));
      if (event.key === "ArrowLeft") setPage((current) => Math.max(1, current - 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const currentImage = readablePages[page - 1] || readablePages[readablePages.length - 1] || cover;
  const usingPdf = Boolean(pdfUrl && pdf && !pdfError);
  const hasPreview = usingPdf || readablePages.length > 0;

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1b1c1c]/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="flipbook-title">
    <div className="flex max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f7f3f1] shadow-2xl">
      <header className="flex items-center justify-between gap-4 border-b border-[#e5bdbb] bg-white px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9e001f]">Aperçu du magazine · {language.toUpperCase()}</p><h2 id="flipbook-title" className="truncate text-sm font-bold text-[#2b2525]">{title}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#2b2525] hover:bg-[#f0eded]" aria-label="Fermer l’aperçu"><span className="material-symbols-outlined">close</span></button></header>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#2b2525] p-3 sm:p-8"><div className="relative flex aspect-[3/4] w-full max-w-[520px] items-center justify-center overflow-hidden rounded-md bg-white shadow-2xl"><canvas ref={canvasRef} className={`${usingPdf && !isBlocked ? "block" : "hidden"} h-full w-full object-contain`} aria-label={`${title}, page ${page}`} /><img src={usingPdf ? undefined : currentImage} alt={`${title}, page ${page}`} className={`${usingPdf ? "hidden" : "block"} h-full w-full object-cover ${isBlocked ? "opacity-0" : ""}`} />{pdfLoading && !isBlocked && <div className="absolute inset-0 grid place-items-center bg-white/90 p-6 text-center text-sm text-[#746665]">Chargement de l’aperçu PDF…</div>}{!pdfLoading && !hasPreview && !isBlocked && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-[#746665]">Aucun aperçu n’est encore disponible.</div>}{isPartiallyMasked && <div className="absolute inset-y-0 right-0 w-1/2 bg-[#1b1c1c]/85 backdrop-blur-[2px]" aria-label="Contenu protégé" />}{isBlocked && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-6 text-center"><span className="material-symbols-outlined text-5xl text-[#9e001f]">lock</span><h3 className="mt-4 text-xl font-bold text-[#2b2525]">Acheter pour lire tout le numéro</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#746665]">Les sept premières pages sont accessibles gratuitement. La lecture est protégée à partir de la page 8.</p><button type="button" onClick={onPurchase} className="mt-5 min-h-11 rounded-xl bg-[#9e001f] px-6 text-sm font-bold text-white">Choisir une version</button></div>}{!isBlocked && <span className="absolute bottom-3 left-3 rounded-full bg-[#1b1c1c]/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Page {page} / 7 gratuites</span>}</div></div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5bdbb] bg-white px-4 py-3 sm:px-6"><span className="text-xs text-[#746665]">{pdfError || "Aperçu généré depuis le PDF de l’édition sélectionnée."}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c3c1] text-[#2b2525] disabled:opacity-40" aria-label="Page précédente"><span className="material-symbols-outlined">chevron_left</span></button><span className="min-w-16 text-center text-xs font-bold text-[#2b2525]">{page} / 8</span><button type="button" onClick={() => setPage((current) => Math.min(8, current + 1))} disabled={page === 8} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c3c1] text-[#2b2525] disabled:opacity-40" aria-label="Page suivante"><span className="material-symbols-outlined">chevron_right</span></button></div></footer>
    </div>
  </div>;
}

export function getPreviewPages(magazine: { previewImages?: string[]; cover: string }) { return magazine.previewImages?.length ? magazine.previewImages.slice(0, 10) : [magazine.cover]; }
