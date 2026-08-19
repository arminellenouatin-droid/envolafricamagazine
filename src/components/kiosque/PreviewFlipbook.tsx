"use client";

import { useEffect, useRef, useState } from "react";

type FlipMode = "single" | "spread";
type PreviewFlipbookProps = { title: string; cover: string; pages?: string[]; pdfUrl?: string; language?: string; onClose: () => void; onPurchase: () => void };

export default function PreviewFlipbook({ title, cover, pages = [], pdfUrl, language = "fr", onClose, onPurchase }: PreviewFlipbookProps) {
  const [page, setPage] = useState(1);
  const [pdf, setPdf] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(Boolean(pdfUrl));
  const [pdfError, setPdfError] = useState("");
  const [mode, setMode] = useState<FlipMode>("single");
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");
  const [turning, setTurning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const readablePages = pages.slice(0, 10);
  const rightPage = page + 1;
  const isBlocked = (value: number) => value >= 8;
  const pageCount = pdf?.numPages || Math.max(readablePages.length, 8);
  const showSpread = mode === "spread" && page > 1 && page < 8;
  const maxStart = pageCount >= 8 ? 8 : Math.max(1, pageCount < 2 ? 1 : 2 + 2 * Math.floor((Math.min(7, pageCount) - 2) / 2));

  useEffect(() => {
    const updateMode = () => { const landscapeMobile = window.innerWidth > window.innerHeight && window.innerWidth >= 560; setMode(window.innerWidth >= 768 || landscapeMobile ? "spread" : "single"); };
    updateMode(); window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!pdfUrl) { setPdfLoading(false); return; }
    setPdfLoading(true); setPdfError(""); setPdf(null);
    import("pdfjs-dist").then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      try { const loaded = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise; if (!cancelled) setPdf(loaded); }
      catch { if (!cancelled) setPdfError("Le PDF ne peut pas être affiché dans cet aperçu."); }
      finally { if (!cancelled) setPdfLoading(false); }
    }).catch(() => { if (!cancelled) { setPdfLoading(false); setPdfError("Le moteur PDF n’est pas disponible dans cet aperçu."); } });
    return () => { cancelled = true; };
  }, [pdfUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!pdf) return;
    const render = async (number: number, canvas: HTMLCanvasElement | null) => {
      if (!canvas || isBlocked(number) || number > pdf.numPages) return;
      try {
        const pdfPage = await pdf.getPage(number); if (cancelled) return;
        const baseViewport = pdfPage.getViewport({ scale: 1 }); const scale = Math.min(1.8, 760 / baseViewport.width); const viewport = pdfPage.getViewport({ scale });
        const context = canvas.getContext("2d"); if (!context) return;
        canvas.width = viewport.width; canvas.height = viewport.height; await pdfPage.render({ canvasContext: context, viewport }).promise;
      } catch { /* Le lecteur conserve ses contrôles même si une page échoue. */ }
    };
    void render(page, canvasLeftRef.current); if (showSpread) void render(rightPage, canvasRightRef.current);
    return () => { cancelled = true; };
  }, [pdf, page, rightPage, showSpread]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); if (event.key === "ArrowRight") goTo(nextPage(page), "next"); if (event.key === "ArrowLeft") goTo(previousPage(page), "prev"); };
    window.addEventListener("keydown", handleKeyDown); return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, page, turning]);

  function nextPage(current: number) { if (current === 1) return 2; if (current < 8) return Math.min(8, current + 2); return 8; }
  function previousPage(current: number) { if (current === 2) return 1; if (current >= 4) return current - 2; return 1; }
  function playTurnSound() {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass(); const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.setValueAtTime(520, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(210, context.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.24); window.setTimeout(() => void context.close(), 350);
    } catch { /* Les navigateurs peuvent refuser le son ; le tournage reste fonctionnel. */ }
  }
  function goTo(next: number, direction: "next" | "prev") {
    const clamped = Math.max(1, Math.min(maxStart, next)); if (clamped === page || turning) return;
    setTurnDirection(direction); setTurning(true); playTurnSound(); setPage(clamped); window.setTimeout(() => setTurning(false), 460);
  }

  const currentImage = readablePages[page - 1] || cover; const nextImage = readablePages[rightPage - 1] || cover; const usingPdf = Boolean(pdfUrl && pdf && !pdfError); const hasPreview = usingPdf || readablePages.length > 0;
  const pageLabel = page === 1 ? "Couverture" : page >= 8 ? "Page 8 protégée" : showSpread ? `${page}–${rightPage} / 7 gratuites` : `${page} / 7 gratuites`;

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1b1c1c]/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="flipbook-title">
    <div className="flex max-h-[98vh] w-full max-w-6xl flex-col overflow-hidden rounded-none sm:rounded-2xl bg-[#f7f3f1] shadow-2xl">
      <header className="flex items-center justify-between gap-4 border-b border-[#e5bdbb] bg-white px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9e001f]">Aperçu du magazine · {language.toUpperCase()}</p><h2 id="flipbook-title" className="truncate text-sm font-bold text-[#2b2525]">{title}</h2></div><div className="flex items-center gap-2"><div className="hidden rounded-full bg-[#f0eded] p-1 sm:flex"><button type="button" onClick={() => setMode("single")} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${mode === "single" ? "bg-white text-[#9e001f] shadow-sm" : "text-[#746665]"}`}>1 page</button><button type="button" onClick={() => setMode("spread")} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${mode === "spread" ? "bg-white text-[#9e001f] shadow-sm" : "text-[#746665]"}`}>2 pages</button></div><button type="button" onClick={() => setSoundEnabled((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full text-[#2b2525] hover:bg-[#f0eded]" aria-label={soundEnabled ? "Désactiver le son de tournage" : "Activer le son de tournage"}><span className="material-symbols-outlined">{soundEnabled ? "volume_up" : "volume_off"}</span></button><button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#2b2525] hover:bg-[#f0eded]" aria-label="Fermer l’aperçu"><span className="material-symbols-outlined">close</span></button></div></header>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#2b2525] p-0 sm:p-2 md:p-5"><div className={`relative flex w-full items-center justify-center ${showSpread ? "max-w-[1100px] gap-0" : "max-w-[560px]"} ${turning ? `flipbook-turn-${turnDirection}` : ""}`}>
        <div className={`relative aspect-[3/4] w-full overflow-hidden bg-white shadow-2xl ${showSpread ? "rounded-l-md" : "rounded-md"}`}><canvas ref={canvasLeftRef} className={`${usingPdf && !isBlocked(page) ? "block" : "hidden"} h-full w-full object-contain`} aria-label={`${title}, page ${page}`} /><img src={usingPdf ? undefined : currentImage} alt={`${title}, page ${page}`} className={`${usingPdf ? "hidden" : "block"} h-full w-full object-cover ${isBlocked(page) ? "opacity-0" : ""}`} />{!usingPdf && !pdfLoading && !hasPreview && !isBlocked(page) && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-[#746665]">Aucun aperçu n’est encore disponible.</div>}{isBlocked(page) && <LockedPage onPurchase={onPurchase} />}</div>
        {showSpread && <div className="relative hidden aspect-[3/4] w-full overflow-hidden rounded-r-md bg-white shadow-2xl md:block"><canvas ref={canvasRightRef} className={`${usingPdf && !isBlocked(rightPage) ? "block" : "hidden"} h-full w-full object-contain`} aria-label={`${title}, page ${rightPage}`} /><img src={usingPdf ? undefined : nextImage} alt={`${title}, page ${rightPage}`} className={`${usingPdf ? "hidden" : "block"} h-full w-full object-cover`} />{isBlocked(rightPage) && <LockedPage onPurchase={onPurchase} />}</div>}
        {turning && <div className={`pointer-events-none absolute inset-y-0 ${turnDirection === "next" ? "right-0" : "left-0"} w-1/2 bg-gradient-to-l from-white/45 to-transparent`} />}{pdfLoading && <div className="absolute inset-0 grid place-items-center rounded-md bg-white/90 p-6 text-center text-sm text-[#746665]">Chargement de l’aperçu PDF…</div>}<span className="absolute bottom-3 left-3 rounded-full bg-[#1b1c1c]/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{pageLabel}</span>
      </div></div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5bdbb] bg-white px-4 py-3 sm:px-6"><span className="text-xs text-[#746665]">{pdfError || "Aperçu généré depuis le PDF de l’édition sélectionnée."}</span><div className="flex items-center gap-2"><button type="button" onClick={() => goTo(previousPage(page), "prev")} disabled={page === 1 || turning} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c3c1] text-[#2b2525] disabled:opacity-40" aria-label="Page précédente"><span className="material-symbols-outlined">chevron_left</span></button><span className="min-w-24 text-center text-xs font-bold text-[#2b2525]">{pageLabel}</span><button type="button" onClick={() => goTo(nextPage(page), "next")} disabled={page >= maxStart || turning} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c3c1] text-[#2b2525] disabled:opacity-40" aria-label="Page suivante"><span className="material-symbols-outlined">chevron_right</span></button></div></footer>
    </div>
  </div>;
}

function LockedPage({ onPurchase }: { onPurchase: () => void }) { return <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-6 text-center"><span className="material-symbols-outlined text-5xl text-[#9e001f]">lock</span><h3 className="mt-4 text-xl font-bold text-[#2b2525]">Acheter pour lire tout le numéro</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#746665]">Les sept premières pages sont accessibles gratuitement. La lecture est protégée à partir de la page 8.</p><button type="button" onClick={onPurchase} className="mt-5 min-h-11 rounded-xl bg-[#9e001f] px-6 text-sm font-bold text-white">Choisir une version</button></div>; }

export function getPreviewPages(magazine: { previewImages?: string[]; cover: string }) { return magazine.previewImages?.length ? magazine.previewImages.slice(0, 10) : [magazine.cover]; }
