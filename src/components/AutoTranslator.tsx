"use client";

import { useEffect } from "react";
import { readPersistedVisitorLocale, type VisitorLocale } from "@/lib/visitor-locale";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay?: boolean;
            layout?: number;
          },
          elementId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function setGoogleTranslateCookie(lang: string) {
  const target = lang && lang !== "fr" ? `/fr/${lang}` : "";
  const maxAge = target ? 60 * 60 * 24 * 30 : 0;
  const expires = target ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  document.cookie = `googtrans=${target}; path=/; max-age=${maxAge}${expires}; SameSite=Lax`;

  try {
    const hostParts = window.location.hostname.split(".");
    if (hostParts.length >= 2) {
      const rootDomain = "." + hostParts.slice(-2).join(".");
      document.cookie = `googtrans=${target}; domain=${rootDomain}; path=/; max-age=${maxAge}${expires}; SameSite=Lax`;
    }
  } catch {}
}

function triggerComboChange(targetLang: string) {
  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (select) {
    select.value = targetLang;
    select.dispatchEvent(new Event("change"));
  }
}

export default function AutoTranslator() {
  useEffect(() => {
    const applyLanguage = (lang: string) => {
      const current = lang.toLowerCase().split("-")[0] || "fr";

      if (current === "fr") {
        setGoogleTranslateCookie("");
        const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (select && select.value !== "fr") {
          select.value = "fr";
          select.dispatchEvent(new Event("change"));
        }
        return;
      }

      setGoogleTranslateCookie(current);

      // Si le widget est déjà présent, changer la valeur
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        if (select.value !== current) {
          select.value = current;
          select.dispatchEvent(new Event("change"));
        }
        return;
      }

      // Sinon, charger le script Google Translate
      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "fr",
              includedLanguages: "fr,en,es,pt,ar,sw",
              autoDisplay: false,
            },
            "google_translate_element"
          );
          // Attendre que la combo soit insérée pour sélectionner la langue
          const checkTimer = window.setInterval(() => {
            const el = document.querySelector<HTMLSelectElement>(".goog-te-combo");
            if (el) {
              window.clearInterval(checkTimer);
              el.value = current;
              el.dispatchEvent(new Event("change"));
            }
          }, 150);
          window.setTimeout(() => window.clearInterval(checkTimer), 5000);
        }
      };

      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      }
    };

    // Initialiser selon la langue sauvegardée ou détectée
    const initial = readPersistedVisitorLocale();
    if (initial.language && initial.language !== "fr") {
      applyLanguage(initial.language);
    }

    // Réagir immédiatement à toute mise à jour de la langue (détection ou choix manuel)
    const onLocaleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<VisitorLocale>).detail;
      if (detail?.language) {
        applyLanguage(detail.language);
      }
    };

    window.addEventListener("ea-locale-updated", onLocaleUpdate);
    return () => window.removeEventListener("ea-locale-updated", onLocaleUpdate);
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} aria-hidden="true" />
      <style jsx global>{`
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
        }
        body {
          top: 0px !important;
          position: static !important;
        }
        .skiptranslate:not(.mobile-bottom-nav):not(.mobile-header-stack) {
          display: none !important;
        }
        #goog-gt-tt,
        .goog-te-balloon-frame {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
    </>
  );
}
