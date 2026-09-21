"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem("eam_cookie_consent");
      if (consent === "granted") {
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
          window.gtag("consent", "update", {
            analytics_storage: "granted",
            ad_storage: "granted",
          });
        }
      } else if (!consent) {
        setVisible(true);
      }
    } catch {
      // Ignore si le stockage local est inaccessible
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("eam_cookie_consent", "granted");
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "granted",
        });
      }
    } catch {}
    setVisible(false);
  };

  const handleRefuse = () => {
    try {
      localStorage.setItem("eam_cookie_consent", "denied");
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
        });
      }
    } catch {}
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      role="region"
      aria-label="Gestion des cookies et respect de la vie privée"
      className="fixed bottom-3 left-3 right-3 z-[9999] mx-auto max-w-4xl animate-fadeIn rounded-2xl border border-[#5c4b4a] bg-[#1e1a1a] p-4 text-white shadow-2xl backdrop-blur-md md:bottom-5 md:left-6 md:right-6 md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-xs leading-relaxed text-[#e0d3d1] md:text-sm">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-white md:text-base">
            <span className="text-[#f0b27e]">🍪</span>
            <span>Respect de votre vie privée & Cookies</span>
          </div>
          <p>
            Envol Africa Magazine utilise des traceurs essentiels à son fonctionnement et des cookies d&apos;analyse
            d&apos;audience anonymisés (Google Analytics) pour mesurer la fréquentation et enrichir votre expérience éditoriale.
          </p>
          <p className="text-[11px] text-[#b8a6a4]">
            Vous pouvez accepter ou refuser à tout moment les cookies statistiques sans impacter votre navigation.{" "}
            <Link href="/cookies" className="font-semibold text-[#f0b27e] underline hover:text-white">
              En savoir plus
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1 md:flex-nowrap md:pt-0">
          <button
            type="button"
            onClick={handleRefuse}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-center font-sans text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95 md:flex-initial"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-[#9e001f] px-5 py-2.5 text-center font-sans text-xs font-bold text-white shadow-md transition hover:bg-[#b80528] active:scale-95 md:flex-initial"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
}
