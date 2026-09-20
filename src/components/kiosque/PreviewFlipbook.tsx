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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [mode, setMode] = useState<FlipMode>("single");
  const [turnDirection, setTurnDirection] = useState<"next" | "prev">("next");
  const [turning, setTurning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [protectedImageLoaded, setProtectedImageLoaded] = useState(false);
  const [protectedImageFailed, setProtectedImageFailed] = useState(false);
  const [touchStartCoords, setTouchStartCoords] = useState<{ x: number; y: number } | null>(null);

  const canvasLeftRef = useRef<HTMLCanvasElement>(null);
  const canvasRightRef = useRef<HTMLCanvasElement>(null);
  const renderTaskLeftRef = useRef<any>(null);
  const renderTaskRightRef = useRef<any>(null);

  // Readable images provided directly in the data
  const readablePages = pages && pages.length > 0 ? pages.slice(0, 8) : [];
  const hasImagePages = readablePages.length >= 2;

  // Max free preview pages is 7, page 8 is the paywall/locked page
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

  // When switching between modes, ensure the page index is valid
  const handleModeChange = (newMode: FlipMode) => {
    if (newMode === mode) return;
    if (newMode === "spread") {
      // In spread mode, align odd interior pages to even pairs (3 -> 2, 5 -> 4, 7 -> 6)
      if (page > 1 && page < 8 && page % 2 !== 0) {
        setPage(page - 1);
      }
    }
    setMode(newMode);
  };

  // Reset protected image states when page or url changes
  useEffect(() => {
    setProtectedImageLoaded(false);
    setProtectedImageFailed(false);
  }, [page, previewUrl]);

  // Load PDF.js only if no image pages are provided and a pdfUrl exists
  useEffect(() => {
    let cancelled = false;
    if (hasImagePages || !pdfUrl || previewUrl) {
      setPdfLoading(false);
      return;
    }

    setPdfLoading(true);
    setPdfError("");
    setPdf(null);

    import("pdfjs-dist")
      .then(async (pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        try {
          const loaded = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise;
          if (!cancelled) setPdf(loaded);
        } catch {
          if (!cancelled) setPdfError("Le PDF n’a pas pu être chargé. L’aperçu éditorial reste consultable.");
        } finally {
          if (!cancelled) setPdfLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPdfLoading(false);
          setPdfError("Moteur PDF indisponible. L’aperçu éditorial reste consultable.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, previewUrl, hasImagePages]);

  // Render PDF pages on canvas
  useEffect(() => {
    let cancelled = false;
    if (!pdf) return;

    const render = async (pageNumber: number, canvas: HTMLCanvasElement | null, isLeft: boolean) => {
      if (!canvas || isBlocked(pageNumber) || pageNumber > pdf.numPages) return;
      try {
        const pdfPage = await pdf.getPage(pageNumber);
        if (cancelled) return;
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const targetWidth = canvas.parentElement?.clientWidth || 560;
        const scale = Math.min(2.0, Math.max(1.0, targetWidth / baseViewport.width));
        const viewport = pdfPage.getViewport({ scale });
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Cancel any pending render task on this canvas
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
      } catch {
        // Handled silently for smooth navigation
      }
    };

    void render(page, canvasLeftRef.current, true);
    if (showSpread) void render(rightPage, canvasRightRef.current, false);

    return () => {
      cancelled = true;
    };
  }, [pdf, page, rightPage, showSpread]);

  // Paper turn sound using Web Audio API
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
      // Audio can fail silently if user hasn't interacted yet
    }
  }, [soundEnabled]);

  // Navigation logic
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

  // Touch Swipe for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartCoords({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartCoords || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartCoords.x;
    const deltaY = e.changedTouches[0].clientY - touchStartCoords.y;

    // Detect horizontal swipe (at least 40px and dominant over vertical scroll)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        goTo(nextPage(page), "next");
      } else {
        goTo(previousPage(page), "prev");
      }
    }
    setTouchStartCoords(null);
  };

  // Rendering Source Determination
  const usingPdf = Boolean(pdfUrl && pdf && !pdfError && !previewUrl && !hasImagePages);
  const usingProtectedPreview = Boolean(previewUrl && !protectedImageFailed);
  const previewImage = (p: number) =>
    previewUrl ? `${previewUrl}${previewUrl.includes("?") ? "&" : "?"}page=${p}` : undefined;

  // Image references for Tier 1
  const currentImage = readablePages[page - 1] || (page === 1 ? cover : "");
  const nextImage = readablePages[rightPage - 1] || "";

  // Page Labels
  const pageLabel =
    page === 1
      ? "Couverture"
      : page >= 8
      ? "Page 8 — Protégée"
      : showSpread
      ? `Pages ${page}–${rightPage} / 7 gratuites`
      : `Page ${page} / 7 gratuites`;

  // Quick navigation markers
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
              Aperçu interactif · {language.toUpperCase()}
            </p>
            <h2 id="flipbook-title" className="truncate text-xs sm:text-sm font-bold text-white">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1 page / 2 pages switch (visible on desktop) */}
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
              <span>Acheter l’édition</span>
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
              {/* Inner Spine shadow effect in spread mode */}
              {showSpread && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black/20 to-transparent" />
              )}

              {/* Tier 1: Cut Images */}
              {hasImagePages && !isBlocked(page) && (
                <img
                  src={currentImage}
                  alt={`${title}, page ${page}`}
                  className="h-full w-full object-contain bg-white"
                />
              )}

              {/* Tier 2: PDF Canvas */}
              {usingPdf && !isBlocked(page) && (
                <canvas
                  ref={canvasLeftRef}
                  className="h-full w-full object-contain bg-white"
                  aria-label={`${title}, page ${page}`}
                />
              )}

              {/* Tier 3: Protected Server Preview Image */}
              {usingProtectedPreview && !isBlocked(page) && (
                <img
                  src={previewImage(page)}
                  alt={`${title}, page ${page}`}
                  onLoad={() => setProtectedImageLoaded(true)}
                  onError={() => {
                    setProtectedImageFailed(true);
                  }}
                  className={`h-full w-full object-contain bg-white ${
                    protectedImageLoaded ? "block" : "hidden"
                  }`}
                />
              )}

              {/* Tier 4: Editorial Magazine Page Fallback */}
              {!hasImagePages && !usingPdf && (!usingProtectedPreview || protectedImageFailed) && !isBlocked(page) && (
                page === 1 ? (
                  <div className="relative h-full w-full bg-[#1b1c1c]">
                    <img
                      src={cover}
                      alt={`${title}, couverture`}
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 p-3 backdrop-blur-md text-white text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0b27e]">
                        Édition Officielle · Envol Africa
                      </p>
                      <p className="text-xs font-semibold truncate mt-0.5">{title}</p>
                    </div>
                  </div>
                ) : (
                  <EditorialPage
                    pageNumber={page}
                    title={title}
                    numero={numero}
                    description={description}
                    date={date}
                    year={year}
                    onPurchase={onPurchase}
                  />
                )
              )}

              {/* Paywall Locked Page on Page 8 */}
              {isBlocked(page) && <LockedPage onPurchase={onPurchase} />}
            </div>

            {/* Right Page (Only in Spread Mode) */}
            {showSpread && (
              <div className="relative hidden aspect-[3/4] h-full max-h-[82vh] w-full overflow-hidden rounded-r-lg bg-white shadow-[0_20px_50px_rgba(0,0,0,0.6)] md:block">
                {/* Inner Spine shadow effect in spread mode */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black/20 to-transparent" />

                {/* Tier 1: Cut Images */}
                {hasImagePages && !isBlocked(rightPage) && (
                  <img
                    src={nextImage || currentImage}
                    alt={`${title}, page ${rightPage}`}
                    className="h-full w-full object-contain bg-white"
                  />
                )}

                {/* Tier 2: PDF Canvas */}
                {usingPdf && !isBlocked(rightPage) && (
                  <canvas
                    ref={canvasRightRef}
                    className="h-full w-full object-contain bg-white"
                    aria-label={`${title}, page ${rightPage}`}
                  />
                )}

                {/* Tier 3: Protected Server Preview Image */}
                {usingProtectedPreview && !isBlocked(rightPage) && (
                  <img
                    src={previewImage(rightPage)}
                    alt={`${title}, page ${rightPage}`}
                    className="h-full w-full object-contain bg-white"
                  />
                )}

                {/* Tier 4: Editorial Magazine Page Fallback */}
                {!hasImagePages && !usingPdf && (!usingProtectedPreview || protectedImageFailed) && !isBlocked(rightPage) && (
                  <EditorialPage
                    pageNumber={rightPage}
                    title={title}
                    numero={numero}
                    description={description}
                    date={date}
                    year={year}
                    onPurchase={onPurchase}
                  />
                )}

                {/* Paywall Locked Page on Right Page */}
                {isBlocked(rightPage) && <LockedPage onPurchase={onPurchase} />}
              </div>
            )}

            {/* Page turning gradient flash */}
            {turning && (
              <div
                className={`pointer-events-none absolute inset-y-0 ${
                  turnDirection === "next" ? "right-0" : "left-0"
                } w-1/2 bg-gradient-to-l from-white/35 to-transparent z-30`}
              />
            )}

            {/* PDF Loading Indicator */}
            {pdfLoading && (
              <div className="absolute inset-0 z-30 grid place-items-center rounded-lg bg-black/75 p-6 text-center text-white backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-[#9e001f]" />
                  <p className="text-xs font-medium">Chargement du PDF haute définition…</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Interactive Footer & Navigation Bar */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-[#3d3635] bg-[#1d1b1b] px-3 py-2.5 sm:px-6 sm:py-3 text-white">
          <div className="flex items-center justify-between gap-3">
            {/* Left Status */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#302b2b] px-3 py-1 text-[11px] font-bold text-[#e6dcdb]">
                <span className="material-symbols-outlined text-[14px] text-[#ff8093]">auto_stories</span>
                <span>{pageLabel}</span>
              </span>
              <span className="hidden lg:inline text-[11px] text-[#9c8e8d] truncate">
                {pdfError ? pdfError : "Aperçu certifié · 7 pages offertes"}
              </span>
            </div>

            {/* Quick Page Jump Thumbnails / Dots */}
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
                    className={`h-7 rounded-md px-2 text-[10px] font-bold transition ${
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

            {/* Right Prev/Next Steppers */}
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

          {/* Mobile hint */}
          <div className="flex items-center justify-between sm:hidden text-[10px] text-[#9c8e8d] pt-1 border-t border-[#2e2828]">
            <span>Glissez l&apos;écran pour tourner les pages</span>
            <button
              type="button"
              onClick={onPurchase}
              className="font-bold text-[#ff8093] hover:underline"
            >
              Acheter l&apos;édition →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// High-Fidelity Editorial Page Fallback (Tier 4)
// Renders when pre-cut image scans are not yet available
// -------------------------------------------------------------
function EditorialPage({
  pageNumber,
  title,
  numero,
  description,
  date,
  year,
  onPurchase,
}: {
  pageNumber: number;
  title: string;
  numero?: number;
  description?: string;
  date?: string;
  year?: number;
  onPurchase: () => void;
}) {
  const currentNum = numero || 25;
  const currentYear = year || 2026;

  switch (pageNumber) {
    case 2:
      return (
        <div className="flex h-full w-full flex-col justify-between bg-[#fbf9f8] p-5 sm:p-7 md:p-8 text-[#2b2525]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5bdbb] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9e001f]">
                ENVOL AFRICA · N°{currentNum}
              </span>
              <span className="text-[10px] text-[#746665] uppercase">Page 02 · Éditorial & Sommaire</span>
            </div>

            <div className="mt-4 rounded-lg bg-[#f4eded] p-4 border-l-4 border-[#9e001f]">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#9e001f]">
                Le mot du rédacteur en chef
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#4a403f] italic font-serif">
                « L&apos;Afrique n&apos;est plus seulement une promesse d&apos;avenir, elle est le moteur des
                transformations actuelles. À travers ce numéro {currentNum}, notre rédaction vous livre
                des analyses rigoureuses, des reportages de terrain et des perspectives inédites sur les
                pôles de croissance qui redessinent la carte continentale. »
              </p>
            </div>

            <h4 className="mt-5 text-xs font-bold uppercase tracking-[.14em] text-[#2b2525]">
              Au Sommaire de cette édition
            </h4>

            <ul className="mt-3 space-y-2.5 text-xs">
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-[#eadad8] pb-1.5">
                <div>
                  <strong className="text-[#9e001f]">04 · GRAND DOSSIER :</strong>
                  <span className="ml-1 text-[#4a403f] font-medium">{title}</span>
                </div>
                <span className="font-mono text-[11px] text-[#746665] shrink-0">p. 04</span>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-[#eadad8] pb-1.5">
                <div>
                  <strong className="text-[#9e001f]">18 · ÉCONOMIE :</strong>
                  <span className="ml-1 text-[#4a403f]">ZLECAf et corridors logistiques régionaux</span>
                </div>
                <span className="font-mono text-[11px] text-[#746665] shrink-0">p. 18</span>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-[#eadad8] pb-1.5">
                <div>
                  <strong className="text-[#9e001f]">36 · FINANCE :</strong>
                  <span className="ml-1 text-[#4a403f]">Banques panafricaines et montée en puissance de la FinTech</span>
                </div>
                <span className="font-mono text-[11px] text-[#746665] shrink-0">p. 36</span>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-[#eadad8] pb-1.5">
                <div>
                  <strong className="text-[#9e001f]">54 · TECH & AGRI :</strong>
                  <span className="ml-1 text-[#4a403f]">Intelligence artificielle et souveraineté alimentaire</span>
                </div>
                <span className="font-mono text-[11px] text-[#746665] shrink-0">p. 54</span>
              </li>
              <li className="flex items-start justify-between gap-3 border-b border-dashed border-[#eadad8] pb-1.5">
                <div>
                  <strong className="text-[#9e001f]">72 · ENTRETIEN :</strong>
                  <span className="ml-1 text-[#4a403f]">Rencontre avec les capitaines d&apos;industrie africains</span>
                </div>
                <span className="font-mono text-[11px] text-[#746665] shrink-0">p. 72</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-[#e5bdbb] pt-2 text-center text-[10px] text-[#746665]">
            Envol Africa Magazine · Publication Trimestrielle Internationale · {currentYear}
          </div>
        </div>
      );

    case 3:
      return (
        <div className="flex h-full w-full flex-col justify-between bg-[#ffffff] p-5 sm:p-7 md:p-8 text-[#2b2525]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5bdbb] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9e001f]">
                GRAND ANGLE · INDICATEURS CLÉS
              </span>
              <span className="text-[10px] text-[#746665] uppercase">Page 03</span>
            </div>

            <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold leading-tight text-[#1b1c1c]">
              La dynamique continentale en 4 chiffres majeurs
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#faf6f5] p-3 border border-[#f0dedd]">
                <p className="text-lg sm:text-2xl font-black text-[#9e001f]">+4.3%</p>
                <p className="mt-1 text-[11px] font-bold text-[#2b2525]">Croissance moyenne</p>
                <p className="mt-0.5 text-[10px] text-[#746665]">Prévision consolidée zone UEMOA & CEMAC</p>
              </div>

              <div className="rounded-lg bg-[#faf6f5] p-3 border border-[#f0dedd]">
                <p className="text-lg sm:text-2xl font-black text-[#9e001f]">3 400 Mds$</p>
                <p className="mt-1 text-[11px] font-bold text-[#2b2525]">Marché ZLECAf</p>
                <p className="mt-0.5 text-[10px] text-[#746665]">PIB combiné des 54 pays signataires</p>
              </div>

              <div className="rounded-lg bg-[#faf6f5] p-3 border border-[#f0dedd]">
                <p className="text-lg sm:text-2xl font-black text-[#9e001f]">72%</p>
                <p className="mt-1 text-[11px] font-bold text-[#2b2525]">Paiements mobiles</p>
                <p className="mt-0.5 text-[10px] text-[#746665]">Taux d&apos;inclusion financière active</p>
              </div>

              <div className="rounded-lg bg-[#faf6f5] p-3 border border-[#f0dedd]">
                <p className="text-lg sm:text-2xl font-black text-[#9e001f]">18 Mds$</p>
                <p className="mt-1 text-[11px] font-bold text-[#2b2525]">Investissements Verts</p>
                <p className="mt-0.5 text-[10px] text-[#746665]">Projets solaires, hydrogène et batteries</p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#5c5150]">
              Les réformes structurelles engagées portent leurs fruits : la transformation locale des matières
              premières s&apos;accélère et positionne l&apos;Afrique comme un partenaire stratégique incontournable.
            </p>
          </div>

          <div className="border-t border-[#e5bdbb] pt-2 text-center text-[10px] text-[#746665]">
            Source : Analyses économiques et statistiques exclusives Envol Africa · {currentYear}
          </div>
        </div>
      );

    case 4:
      return (
        <div className="flex h-full w-full flex-col justify-between bg-[#fbf9f8] p-5 sm:p-7 md:p-8 text-[#2b2525]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5bdbb] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9e001f]">
                DOSSIER SPÉCIAL · ENQUÊTE
              </span>
              <span className="text-[10px] text-[#746665] uppercase">Page 04</span>
            </div>

            <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold leading-tight text-[#1b1c1c]">
              {title}
            </h3>

            <p className="mt-3 text-xs leading-relaxed text-[#4a403f] font-serif italic border-l-2 border-[#9e001f] pl-3">
              {description ||
                "Une immersion exclusive au cœur des stratégies qui propulsent les économies africaines vers de nouveaux sommets de compétitivité."}
            </p>

            <div className="mt-4 space-y-2.5 text-xs leading-relaxed text-[#5c5150]">
              <p>
                <strong className="text-[#1b1c1c]">L&apos;essor des chaînes de valeur régionales :</strong> À
                travers le continent, les barrières douanières s&apos;estompent progressivement pour laisser place
                à une nouvelle ère industrielle. Les investissements dans les infrastructures de transport
                et les hubs technologiques créent des synergies sans précédent entre pays voisins.
              </p>
              <p>
                De Dakar à Nairobi, de Kigali à Abidjan, les décideurs publics et privés conjuguent leurs
                efforts pour sécuriser des approvisionnements locaux et stimuler l&apos;emploi qualifié des jeunes diplômés.
              </p>
            </div>
          </div>

          <div className="rounded bg-[#f0eded] p-2.5 text-center text-[10px] text-[#746665]">
            Suite de l&apos;enquête dans les pages 05 et 06 de cet aperçu
          </div>
        </div>
      );

    case 5:
      return (
        <div className="flex h-full w-full flex-col justify-between bg-[#ffffff] p-5 sm:p-7 md:p-8 text-[#2b2525]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5bdbb] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9e001f]">
                STRATÉGIE & DÉVELOPPEMENT
              </span>
              <span className="text-[10px] text-[#746665] uppercase">Page 05</span>
            </div>

            <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold leading-tight text-[#1b1c1c]">
              Trois piliers pour accélérer la compétitivité
            </h3>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-[#faf6f5] p-3 border-l-3 border-[#9e001f]">
                <h4 className="text-xs font-bold text-[#1b1c1c]">1. La souveraineté industrielle</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5c5150]">
                  Transformer sur place le cacao, le coton, les minerais et les énergies renouvelables
                  pour capturer la valeur ajoutée sur le sol africain.
                </p>
              </div>

              <div className="rounded-lg bg-[#faf6f5] p-3 border-l-3 border-[#9e001f]">
                <h4 className="text-xs font-bold text-[#1b1c1c]">2. L&apos;interopérabilité financière</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5c5150]">
                  Le système panafricain de paiement et de règlement (PAPSS) permet désormais les transactions
                  en monnaies locales sans conversion intermédiaire en devises tierces.
                </p>
              </div>

              <div className="rounded-lg bg-[#faf6f5] p-3 border-l-3 border-[#9e001f]">
                <h4 className="text-xs font-bold text-[#1b1c1c]">3. Le vivier des talents et startups</h4>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5c5150]">
                  Une nouvelle génération d&apos;ingénieurs et entrepreneurs développe des solutions
                  spécifiques aux besoins locaux, de l&apos;AgriTech à la MedTech.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e5bdbb] pt-2 text-center text-[10px] text-[#746665]">
            Envol Africa Magazine · Dossier Stratégies & Entreprises
          </div>
        </div>
      );

    case 6:
      return (
        <div className="flex h-full w-full flex-col justify-between bg-[#fbf9f8] p-5 sm:p-7 md:p-8 text-[#2b2525]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5bdbb] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9e001f]">
                LE GRAND ENTRETIEN
              </span>
              <span className="text-[10px] text-[#746665] uppercase">Page 06</span>
            </div>

            <div className="mt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9e001f]">
                Regards Croisés · Décideurs
              </span>
              <h3 className="font-serif text-lg font-bold leading-tight text-[#1b1c1c] mt-0.5">
                « Construire des coalitions économiques panafricaines durables »
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#4a403f]">
              <div className="rounded bg-white p-3 shadow-xs border border-[#eee]">
                <p className="font-bold text-[#9e001f]">
                  Q : Comment convaincre les investisseurs internationaux de miser sur l&apos;Afrique ?
                </p>
                <p className="mt-1.5 leading-relaxed text-[#5c5150]">
                  « En mettant en avant nos résultats concrets : des taux de rentabilité élevés, une jeunesse
                  ultra-connectée et des marchés en pleine expansion. La perception du risque évolue dès que
                  les partenaires découvrent nos réussites sur le terrain. »
                </p>
              </div>

              <div className="rounded bg-white p-3 shadow-xs border border-[#eee]">
                <p className="font-bold text-[#9e001f]">
                  Q : Quel rôle pour les médias économiques comme Envol Africa ?
                </p>
                <p className="mt-1.5 leading-relaxed text-[#5c5150]">
                  « Apporter une information certifiée, indépendante et valoriser les réussites qui inspirent.
                  C&apos;est la clé pour créer la confiance et attirer les capitaux. »
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e5bdbb] pt-2 text-center text-[10px] text-[#746665]">
            Propos recueillis par la rédaction centrale d&apos;Envol Africa
          </div>
        </div>
      );

    case 7:
      return (
        <div className="flex h-full w-full flex-col justify-between bg-[#ffffff] p-5 sm:p-7 md:p-8 text-[#2b2525]">
          <div>
            <div className="flex items-center justify-between border-b border-[#e5bdbb] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9e001f]">
                TRIBUNE & PERSPECTIVES
              </span>
              <span className="text-[10px] text-[#746665] uppercase">Page 07 · Fin de l&apos;Aperçu</span>
            </div>

            <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold leading-tight text-[#1b1c1c]">
              Cap sur les dix prochaines années : L&apos;audace d&apos;entreprendre
            </h3>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#5c5150]">
              <p>
                Le continent dispose des plus importantes réserves de minerais stratégiques pour la transition
                énergétique mondiale et d&apos;un potentiel agricole capable de nourrir le monde entier.
              </p>
              <p>
                Pour transformer cette richesse potentielle en prospérité partagée, la rigueur dans la gestion
                et la transparence des affaires doivent demeurer les maîtres-mots de tous les acteurs.
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-[#fff0f2] p-4 border border-[#fcd5da] text-center">
              <span className="material-symbols-outlined text-2xl text-[#9e001f]">lock_open</span>
              <h4 className="mt-1 text-xs font-bold text-[#9e001f] uppercase tracking-wider">
                Vous avez atteint la fin des 7 pages gratuites
              </h4>
              <p className="mt-1 text-[11px] text-[#5c403f]">
                Ce numéro contient <strong>124 pages</strong> de dossiers complets, d&apos;enquêtes exclusives et
                d&apos;annuaires professionnels.
              </p>
              <button
                type="button"
                onClick={onPurchase}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#9e001f] px-5 py-2 text-xs font-bold text-white hover:bg-[#c8102e] transition shadow"
              >
                <span>Débloquer tout le numéro</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="border-t border-[#e5bdbb] pt-2 text-center text-[10px] text-[#746665]">
            Envol Africa · L&apos;excellence éditoriale au service du continent
          </div>
        </div>
      );

    default:
      return null;
  }
}

// -------------------------------------------------------------
// Paywall Locked Page Component (Page 8)
// -------------------------------------------------------------
function LockedPage({ onPurchase }: { onPurchase: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#ffffff] to-[#faf5f5] px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#ffdad8] text-[#9e001f] shadow-md">
        <span className="material-symbols-outlined text-3xl">lock</span>
      </div>
      <h3 className="mt-4 font-serif text-xl sm:text-2xl font-bold text-[#2b2525]">
        Acheter pour lire tout le numéro
      </h3>
      <p className="mt-2 max-w-sm text-xs sm:text-sm leading-relaxed text-[#746665]">
        Les sept premières pages sont accessibles gratuitement en aperçu.
        Débloquez l&apos;intégralité des <strong>124 pages</strong> et profitez de la version numérique HD,
        papier ou audio.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onPurchase}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#9e001f] px-6 text-sm font-bold text-white shadow-lg hover:bg-[#c8102e] transition active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">shopping_cart</span>
          <span>Choisir une formule</span>
        </button>
      </div>
      <span className="mt-4 text-[10px] font-semibold text-[#a89b9a] uppercase tracking-wider">
        Paiement sécurisé par Mobile Money ou Carte Bancaire
      </span>
    </div>
  );
}

export function getPreviewPages(magazine: { previewImages?: string[]; cover: string }) {
  return magazine.previewImages?.length ? magazine.previewImages.slice(0, 10) : [magazine.cover];
}
