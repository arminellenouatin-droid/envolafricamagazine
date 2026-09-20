"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FlipMode = "single" | "spread";

type FlipbookProps = {
  title: string;
  cover: string;
  pages?: string[];
  pdfUrl?: string;
  previewUrl?: string;
  language?: string;
  numero?: number;
  description?: string;
  date?: string;
  year?: number;
  onClose: () => void;
  onPurchase: () => void;
};

export default function PreviewFlipbook({
  title,
  cover,
  pages = [],
  pdfUrl,
  previewUrl,
  language = "fr",
  numero,
  description,
  date,
  year,
  onClose,
  onPurchase,
}: FlipbookProps) {
  const [page, setPage] = useState(1);
  const [pdf, setPdf] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const [pageRendering, setPageRendering] = useState(false);
  const [mode, setMode] = useState<FlipMode>("single");
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");
  const [turning, setTurning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [touchStartCoords, setTouchStartCoords] = useState<{ x: number; y: number } | null>(null);

  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const renderTaskLeftRef = useRef<any>(null);
  const renderTaskRightRef = useRef<any>(null);

  // Resolved PDF target URL: fallback to the project's official edition PDF if none specified
  const targetPdfUrl = pdfUrl || (pages.length === 0 ? "/magazines/23/numero-23.pdf" : undefined);
  const maxPage = 8;
  const isBlocked = (p: number) => p >= 8;
  const rightPage = page + 1;
  const showSpread = mode === "spread" && page > 1 && page < 8;

  // Detect screen width and update mode automatically
  useEffect(() => {
    const updateMode = () => {
      const isDesktop = window.innerWidth >= 768;
      const isLandscapeMobile = window.innerWidth > window.innerHeight && window.innerWidth >= 640;
      setMode(isDesktop || isLandscapeMobile ? "spread" : "single");
    };
    updateMode();
    window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  const handleModeChange = (newMode: FlipMode) => {
    if (newMode === mode) return;
    if (newMode === "spread") {
      if (page > 1 && page < 8 && page % 2 !== 0) {
        setPage(page - 1);
      }
    }
    setMode(newMode);
  };

  // Load PDF directly with pdfjs-dist
  useEffect(() => {
    let cancelled = false;
    if (!targetPdfUrl) {
      setPdfLoading(false);
      return;
    }

    setPdfLoading(true);
    setPdfError("");

    import("pdfjs-dist")
      .then(async (pdfjs) => {
        // Double security: try local worker first, fallback to CDN if needed
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        } catch {
          pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";
        }

        try {
          const loadingTask = pdfjs.getDocument({
            url: targetPdfUrl,
            withCredentials: false,
            cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/",
            cMapPacked: true,
          });
          const loadedPdf = await loadingTask.promise;
          if (!cancelled) {
            setPdf(loadedPdf);
            setPdfLoading(false);
          }
        } catch (loadErr: any) {
          console.warn("Local worker load failed, trying CDN worker fallback...", loadErr);
          try {
            pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.min.mjs";
            const retryTask = pdfjs.getDocument({
              url: targetPdfUrl,
              withCredentials: false,
            });
            const loadedPdf = await retryTask.promise;
            if (!cancelled) {
              setPdf(loadedPdf);
              setPdfLoading(false);
            }
          } catch (retryErr: any) {
            if (!cancelled) {
              setPdfError("Impossible de charger le PDF.");
              setPdfLoading(false);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPdfError("Moteur PDF indisponible.");
          setPdfLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [targetPdfUrl]);

  // Render PDF pages on Canvas
  useEffect(() => {
    let cancelled = false;
    if (!pdf) return;

    const renderPageToCanvas = async (
      pageNumber: number,
      canvas: HTMLCanvasElement | null,
      isLeft: boolean
    ) => {
      if (!canvas || isBlocked(pageNumber) || pageNumber > pdf.numPages) return;
      try {
        setPageRendering(true);
        const pdfPage = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const unscaledViewport = pdfPage.getViewport({ scale: 1 });
        const containerWidth = canvas.parentElement?.clientWidth || 540;
        const scale = Math.max(1.0, (containerWidth / unscaledViewport.width) * dpr);
        const viewport = pdfPage.getViewport({ scale });

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        // Cancel previous render task on this canvas if active
        if (isLeft && renderTaskLeftRef.current) {
          try { renderTaskLeftRef.current.cancel(); } catch {}
        }
        if (!isLeft && renderTaskRightRef.current) {
          try { renderTaskRightRef.current.cancel(); } catch {}
        }

        const renderTask = pdfPage.render({ canvasContext: context, viewport });
        if (isLeft) renderTaskLeftRef.current = renderTask;
        else renderTaskRightRef.current = renderTask;

        await renderTask.promise;
        if (!cancelled) setPageRendering(false);
      } catch {
        if (!cancelled) setPageRendering(false);
      }
    };

    void renderPageToCanvas(page, canvasLeftRef.current, true);
    if (showSpread) {
      void renderPageToCanvas(rightPage, canvasRightRef.current, false);
    }

    return () => {
      cancelled = true;
    };
  }, [pdf, page, rightPage, showSpread]);

  // Realistic paper turn sound using Web Audio API
  const playTurnSound = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.12;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
      filter.Q.value = 1.1;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.13);
      setTimeout(() => { void ctx.close().catch(() => {}); }, 250);
    } catch {
      // Handled silently
    }
  }, [soundEnabled]);

  // Navigation logic: single steps by 1, spread steps by 2
  const nextPage = useCallback((current: number) => {
    if (mode === "spread") {
      if (current === 1) return 2;
      if (current < 8) return Math.min(8, current + 2);
      return 8;
    }
    return Math.min(8, current + 1);
  }, [mode]);

  const previousPage = useCallback((current: number) => {
    if (mode === "spread") {
      if (current === 8) return 6;
      if (current === 2) return 1;
      if (current > 2) return Math.max(1, current - 2);
      return 1;
    }
    return Math.max(1, current - 1);
  }, [mode]);

  const goTo = useCallback((next: number, direction: "next" | "prev") => {
    const clamped = Math.max(1, Math.min(maxPage, next));
    if (clamped === page || turning) return;
    setTurnDirection(direction);
    setTurning(true);
    playTurnSound();
    setPage(clamped);
    window.setTimeout(() => setTurning(false), 460);
  }, [page, turning, playTurnSound]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goTo(nextPage(page), "next");
      if (event.key === "ArrowLeft") goTo(previousPage(page), "prev");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, page, turning, nextPage, previousPage, goTo]);

  // Mobile Touch Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartCoords || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartCoords.x;
    const deltaY = e.changedTouches[0].clientY - touchStartCoords.y;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        goTo(nextPage(page), "next");
      } else {
        goTo(previousPage(page), "prev");
      }
    }
    setTouchStartCoords(null);
  };

  const pageLabel =
    page === 1
      ? "Couverture"
      : page >= 8
      ? "Page 8 — Protégée"
      : showSpread
      ? `Pages ${page}–${rightPage} / 7 gratuites`
      : `Page ${page} / 7 gratuites`;

  const navMarkers =
    mode === "spread"
      ? [
          { p: 1, label: "Couv." },
          { p: 2, label: "2–3" },
          { p: 4, label: "4–5" },
          { p: 6, label: "6–7" },
          { p: 8, label: "Acheter" },
        ]
      : [
          { p: 1, label: "1" },
          { p: 2, label: "2" },
          { p: 3, label: "3" },
          { p: 4, label: "4" },
          { p: 5, label: "5" },
          { p: 6, label: "6" },
          { p: 7, label: "7" },
          { p: 8, label: "8 🔒" },
        ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1b1c1c]/90 p-0 sm:p-4 md:p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flipbook-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full max-h-[100dvh] sm:max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-none sm:rounded-2xl bg-[#242121] shadow-2xl">
        {/* Top Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#3d3635] bg-[#1d1b1b] px-3 py-2.5 sm:px-6 sm:py-3 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ff8093]">
              Aperçu officiel · {language.toUpperCase()}
            </p>
            <h2 id="flipbook-title" className="truncate text-xs sm:text-sm font-bold text-white">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1 page / 2 pages switch (desktop) */}
            <div className="hidden rounded-full bg-[#2b2727] p-1 sm:flex border border-[#443d3d]">
              <button
                type="button"
                onClick={() => handleModeChange("single")}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  mode === "single"
                    ? "bg-[#9e001f] text-white shadow-sm"
                    : "text-[#c2b4b3] hover:text-white"
                }`}
              >
                1 page
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("spread")}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  mode === "spread"
                    ? "bg-[#9e001f] text-white shadow-sm"
                    : "text-[#c2b4b3] hover:text-white"
                }`}
              >
                2 pages
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full text-[#c2b4b3] hover:bg-white/10 hover:text-white transition"
              aria-label={soundEnabled ? "Désactiver le son de tournage" : "Activer le son de tournage"}
              title={soundEnabled ? "Son activé" : "Son coupé"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {soundEnabled ? "volume_up" : "volume_off"}
              </span>
            </button>

            {/* Direct purchase CTA in header */}
            <button
              type="button"
              onClick={onPurchase}
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[#9e001f] px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-[#c8102e] transition"
            >
              <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
              <span>Choisir une version</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full text-[#c2b4b3] hover:bg-white/10 hover:text-white transition"
              aria-label="Fermer l’aperçu"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </header>

        {/* Reader Center Viewport */}
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#161414] p-2 sm:p-4 md:p-6 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop Left/Right Side Floating Arrows */}
          <button
            type="button"
            onClick={() => goTo(previousPage(page), "prev")}
            disabled={page === 1 || turning}
            aria-label="Page précédente"
            className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-xl hover:bg-[#9e001f] disabled:opacity-0 disabled:pointer-events-none transition"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>

          <button
            type="button"
            onClick={() => goTo(nextPage(page), "next")}
            disabled={page >= maxPage || turning}
            aria-label="Page suivante"
            className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-xl hover:bg-[#9e001f] disabled:opacity-0 disabled:pointer-events-none transition"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>

          {/* Book Wrapper */}
          <div
            className={`relative flex h-full max-h-[82vh] w-full items-center justify-center ${
              showSpread ? "max-w-[1080px]" : "max-w-[540px]"
            } ${turning ? `flipbook-turn-${turnDirection}` : ""}`}
          >
            {/* Left Page (or Single Page) */}
            <div
              className={`relative aspect-[3/4] h-full max-h-[82vh] w-full overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${
                showSpread ? "rounded-l-lg border-r border-[#d4cfce]" : "rounded-lg"
              }`}
            >
              {/* Inner spine shadow in spread mode */}
              {showSpread && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black/20 to-transparent" />
              )}

              {/* PDF Canvas for Left Page */}
              <canvas
                ref={canvasLeftRef}
                className={`h-full w-full object-contain bg-white ${
                  !isBlocked(page) && !pdfLoading && !pdfError ? "block" : "hidden"
                }`}
                aria-label={`${title}, page ${page}`}
              />

              {/* Page 1 Cover image while PDF loads */}
              {page === 1 && (pdfLoading || pdfError) && (
                <img
                  src={cover}
                  alt={`${title}, couverture`}
                  className="h-full w-full object-cover"
                />
              )}

              {/* Loading indicator for pages 2 to 7 (never show cover in background!) */}
              {page > 1 && !isBlocked(page) && (pdfLoading || pageRendering) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center text-[#746665]">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#e5bdbb] border-t-[#9e001f]" />
                  <p className="mt-3 text-xs font-medium">Chargement de la page {page}…</p>
                </div>
              )}

              {/* Error fallback if PDF cannot be loaded */}
              {pdfError && !isBlocked(page) && page > 1 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center text-[#746665]">
                  <span className="material-symbols-outlined text-4xl text-[#9e001f]">menu_book</span>
                  <p className="mt-2 text-xs font-medium">Aperçu en cours d&apos;optimisation</p>
                  <p className="mt-1 text-[11px] text-[#9c8e8d]">La page {page} sera disponible sous peu.</p>
                </div>
              )}

              {/* Page 8: Exact Paywall Screen requested by user */}
              {isBlocked(page) && <LockedPage onPurchase={onPurchase} />}
            </div>

            {/* Right Page (Only in Spread Mode) */}
            {showSpread && (
              <div className="relative hidden aspect-[3/4] h-full max-h-[82vh] w-full overflow-hidden rounded-r-lg bg-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] md:block">
                {/* Inner spine shadow in spread mode */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black/20 to-transparent" />

                {/* PDF Canvas for Right Page */}
                <canvas
                  ref={canvasRightRef}
                  className={`h-full w-full object-contain bg-white ${
                    !isBlocked(rightPage) && !pdfLoading && !pdfError ? "block" : "hidden"
                  }`}
                  aria-label={`${title}, page ${rightPage}`}
                />

                {/* Loading indicator for Right Page */}
                {!isBlocked(rightPage) && (pdfLoading || pageRendering) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center text-[#746665]">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#e5bdbb] border-t-[#9e001f]" />
                    <p className="mt-3 text-xs font-medium">Chargement de la page {rightPage}…</p>
                  </div>
                )}

                {/* Page 8 Paywall on Right Page */}
                {isBlocked(rightPage) && <LockedPage onPurchase={onPurchase} />}
              </div>
            )}

            {/* Page turning animation shadow */}
            {turning && (
              <div
                className={`pointer-events-none absolute inset-y-0 ${
                  turnDirection === "next" ? "right-0" : "left-0"
                } w-1/2 bg-gradient-to-l from-white/35 to-transparent z-30`}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation Footer */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-[#3d3635] bg-[#1d1b1b] px-3 py-2.5 sm:px-6 sm:py-3 text-white">
          <div className="flex items-center justify-between gap-3">
            {/* Left Status */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#302b2b] px-3 py-1 text-[11px] font-bold text-[#e6dcdb]">
                <span className="material-symbols-outlined text-[14px] text-[#ff8093]">auto_stories</span>
                <span>{pageLabel}</span>
              </span>
              <span className="hidden lg:inline text-[11px] text-[#9c8e8d] truncate">
                {pdfLoading ? "Chargement du PDF…" : "Aperçu officiel · 7 pages offertes"}
              </span>
            </div>

            {/* Quick Page Jump Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {navMarkers.map((marker) => {
                const isActive =
                  mode === "spread"
                    ? page === marker.p || (marker.p > 1 && marker.p < 8 && rightPage === marker.p + 1 && page === marker.p)
                    : page === marker.p;
                return (
                  <button
                    key={marker.p}
                    type="button"
                    onClick={() => goTo(marker.p, marker.p > page ? "next" : "prev")}
                    className={`h-7 rounded-md px-2.5 text-[10px] font-bold transition ${
                      isActive
                        ? "bg-[#9e001f] text-white shadow"
                        : "bg-[#2d2828] text-[#c2b4b3] hover:bg-[#3d3636] hover:text-white"
                    }`}
                  >
                    {marker.label}
                  </button>
                );
              })}
            </div>

            {/* Right Steppers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => goTo(previousPage(page), "prev")}
                disabled={page === 1 || turning}
                className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-[#4d4444] bg-[#272323] text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-[#9e001f] hover:border-[#9e001f] transition active:scale-95"
                aria-label="Page précédente"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>

              <button
                type="button"
                onClick={() => goTo(nextPage(page), "next")}
                disabled={page >= maxPage || turning}
                className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-[#4d4444] bg-[#272323] text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-[#9e001f] hover:border-[#9e001f] transition active:scale-95"
                aria-label="Page suivante"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Mobile swipe hint */}
          <div className="flex items-center justify-between sm:hidden text-[10px] text-[#9c8e8d] pt-1 border-t border-[#2e2828]">
            <span>Glissez l&apos;écran pour tourner les pages</span>
            <button
              type="button"
              onClick={onPurchase}
              className="font-bold text-[#ff8093] hover:underline"
            >
              Choisir une version →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Paywall Screen (Page 8)
// Displays exact message and button requested by user
// -------------------------------------------------------------
function LockedPage({ onPurchase }: { onPurchase: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#ffdad8] text-[#9e001f] shadow-sm">
        <span className="material-symbols-outlined text-3xl">lock</span>
      </div>
      <h3 className="mt-4 font-serif text-xl sm:text-2xl font-bold text-[#2b2525]">
        Acheter pour lire tout le numéro
      </h3>
      <p className="mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-[#746665]">
        Les sept premières pages sont accessibles gratuitement. La lecture est protégée à partir de la page 8
      </p>
      <button
        type="button"
        onClick={onPurchase}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#9e001f] px-8 text-sm font-bold text-white shadow-lg hover:bg-[#c8102e] transition active:scale-95"
      >
        choisir une version
      </button>
    </div>
  );
}

export function getPreviewPages(magazine: { previewImages?: string[]; cover: string }) {
  return magazine.previewImages?.length ? magazine.previewImages.slice(0, 10) : [magazine.cover];
}
