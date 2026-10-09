"use client";

import { useEffect, useRef, useState } from "react";
import type { AdServeResponse } from "@/lib/ads/engine";

interface EvSlotProps {
  code: string;
  className?: string;
  category?: string;
  pageType?: string;
}

export default function EvSlot({ code, className = "", category, pageType }: EvSlotProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [adData, setAdData] = useState<AdServeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [impressionRecorded, setImpressionRecorded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMotif, setReportMotif] = useState("Contenu trompeur");
  const [reported, setReported] = useState(false);

  // 1. Déclenchement au scroll (IntersectionObserver Lazy Loading)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let observer: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchAd();
            observer?.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(el);
    } else {
      fetchAd();
    }

    return () => {
      observer?.disconnect();
    };
  }, [code, category, pageType]);

  const fetchAd = async () => {
    try {
      const res = await fetch("/api/ev/s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotCode: code,
          category,
          pageType,
          pageRef: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });

      if (!res.ok) {
        setAdData({ served: false, type: "empty", slot: { code, widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 } });
        return;
      }

      const data: AdServeResponse = await res.json();
      setAdData(data);
    } catch {
      setAdData({ served: false, type: "empty", slot: { code, widthDesktop: 728, heightDesktop: 90, widthMobile: 320, heightMobile: 50 } });
    } finally {
      setLoading(false);
    }
  };

  // 2. Mesure de visibilité réelle (≥ 50% pendant ≥ 1 seconde)
  useEffect(() => {
    if (!adData?.served || !adData.impressionToken || impressionRecorded || hidden) return;

    const el = containerRef.current;
    if (!el || !("IntersectionObserver" in window)) return;

    let timer: NodeJS.Timeout | null = null;

    const viewObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!timer) {
            timer = setTimeout(() => {
              recordImpression(adData.impressionToken!);
            }, 1000);
          }
        } else {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        }
      },
      { threshold: [0.5] }
    );

    viewObserver.observe(el);

    return () => {
      if (timer) clearTimeout(timer);
      viewObserver.disconnect();
    };
  }, [adData, impressionRecorded, hidden]);

  const recordImpression = async (token: string) => {
    if (impressionRecorded) return;
    setImpressionRecorded(true);
    try {
      await fetch("/api/ev/i", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          pageRef: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
    } catch {}
  };

  const handleReport = async () => {
    if (!adData?.creative?.id) return;
    try {
      await fetch("/api/ev/r", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creativeId: adData.creative.id,
          motif: reportMotif,
        }),
      });
      setReported(true);
      setTimeout(() => {
        setShowReportModal(false);
        setHidden(true);
      }, 1500);
    } catch {}
  };

  if (hidden) return null;

  // Hauteurs réservées pour éviter le CLS (Cumulative Layout Shift)
  const heightStyle = {
    minHeight: adData?.slot?.heightMobile ? `${adData.slot.heightMobile}px` : "70px",
  };

  return (
    <div
      ref={containerRef}
      style={heightStyle}
      className={`ev-slot-container relative my-6 w-full overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Squelette de chargement neutre */}
      {loading && (
        <div className="flex h-full min-h-[70px] w-full animate-pulse items-center justify-center rounded-2xl bg-[#f5eee5]/60 text-[10px] font-bold text-[#bfaea0]">
          ✦
        </div>
      )}

      {/* Rendu de l'annonce */}
      {!loading && adData?.served && adData.creative && (
        <div className="ev-box relative mx-auto overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-sm transition hover:shadow-md">
          {/* Header Métadonnées & Actions */}
          <div className="flex items-center justify-between border-b border-[#f3ebe1] bg-[#fbf7f2] px-3 py-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-[#eadfce] px-1.5 py-0.5 font-black uppercase tracking-wider text-[#5c3d19]">
                {adData.creative.badgeLabel || "Sponsorisé"}
              </span>
              <span className="text-[#806c58]">· Envol Ads</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="grid h-6 w-6 place-items-center rounded-full text-[#806c58] hover:bg-[#eadfce]/50"
                aria-label="Options de la publicité"
              >
                <span className="material-symbols-outlined text-[15px]">more_vert</span>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-[#eadfce] bg-white p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setHidden(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#5c3d19] hover:bg-[#fffaf0]"
                  >
                    <span className="material-symbols-outlined text-[15px]">visibility_off</span>
                    Masquer cette annonce
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">flag</span>
                    Signaler cette publicité
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contenu Cliquable */}
          <a
            href={adData.clickUrl || adData.creative.destinationUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3.5">
              {adData.creative.mediaUrl && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#eadfce] bg-[#f5eee5]">
                  <img
                    src={adData.creative.mediaUrl}
                    alt={adData.creative.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div>
                <h4 className="font-display text-sm font-black text-[#2a211a] hover:text-[#9e001f] transition">
                  {adData.creative.title}
                </h4>
                {adData.creative.text && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#725f4d]">
                    {adData.creative.text}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#9e001f] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#800019]">
                {adData.creative.buttonText || "En savoir plus"}
                <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
              </span>
            </div>
          </a>
        </div>
      )}

      {/* Modal de Signalement */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-[#eadfce] bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-black text-[#2a211a]">
              Signaler cette publicité
            </h3>
            <p className="mt-1 text-xs text-[#806c58]">
              Aidez-nous à préserver la qualité et l&apos;éthique de l&apos;écosystème Envol Africa.
            </p>

            {reported ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-800">
                ✓ Merci, votre signalement a été transmis à la modération.
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-2">
                  {[
                    "Contenu trompeur ou arnaque",
                    "Produit interdit ou illicite",
                    "Violence ou discours inapproprié",
                    "Problème technique ou lien brisé",
                    "Autre motif",
                  ].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setReportMotif(m)}
                      className={`w-full rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                        reportMotif === m
                          ? "border-[#9e001f] bg-[#fff5f5] text-[#9e001f]"
                          : "border-[#eadfce] bg-white text-[#5c3d19]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="rounded-full border border-[#eadfce] px-4 py-2 text-xs font-bold text-[#5c3d19]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleReport}
                    className="rounded-full bg-rose-700 px-5 py-2 text-xs font-black text-white hover:bg-rose-800"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
