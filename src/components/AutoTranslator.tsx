"use client";

import { useEffect, useRef } from "react";
import { readPersistedVisitorLocale, type VisitorLocale } from "@/lib/visitor-locale";
import { type SupportedLanguage, normalizeLanguage } from "@/lib/i18n";

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

/**
 * Nettoyage total et déterministe de tous les cookies de Google Translate (`googtrans`).
 */
function clearAllGoogleTranslateCookies() {
  if (typeof document === "undefined") return;
  const cookieNames = ["googtrans"];
  const paths = ["/", ""];
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const domains: string[] = ["", hostname, `.${hostname}`];
  if (parts.length >= 2) {
    domains.push(`.${parts.slice(-2).join(".")}`);
  }

  cookieNames.forEach((name) => {
    paths.forEach((path) => {
      domains.forEach((domain) => {
        const domainClause = domain ? `; domain=${domain}` : "";
        const pathClause = path ? `; path=${path}` : "";
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0${pathClause}${domainClause}; SameSite=Lax`;
      });
    });
  });
}

/**
 * Écrit le cookie officiel attendu par Google Translate.
 */
function setGoogleTranslateCookie(lang: SupportedLanguage) {
  if (typeof document === "undefined") return;
  if (lang === "fr") {
    clearAllGoogleTranslateCookies();
    return;
  }
  const target = `/fr/${lang}`;
  const maxAge = 60 * 60 * 24 * 365; // 1 an
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const domains: string[] = ["", hostname, `.${hostname}`];
  if (parts.length >= 2) {
    domains.push(`.${parts.slice(-2).join(".")}`);
  }

  domains.forEach((domain) => {
    const domainClause = domain ? `; domain=${domain}` : "";
    document.cookie = `googtrans=${target}; path=/; max-age=${maxAge}${domainClause}; SameSite=Lax`;
    document.cookie = `googtrans=${target}; max-age=${maxAge}${domainClause}; SameSite=Lax`;
  });
}

/**
 * Protège les éléments d'icônes contre la traduction intempestive.
 */
function protectIconsOnce() {
  if (typeof document === "undefined") return;
  const icons = document.querySelectorAll<HTMLElement>(
    ".material-symbols-outlined, .material-icons, [class*='material-symbols']"
  );
  icons.forEach((icon) => {
    if (!icon.classList.contains("notranslate")) {
      icon.classList.add("notranslate");
    }
    if (icon.getAttribute("translate") !== "no") {
      icon.setAttribute("translate", "no");
    }
  });
}

export default function AutoTranslator() {
  const currentLangRef = useRef<SupportedLanguage>("fr");
  const isScriptLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const pendingTargetRef = useRef<SupportedLanguage | null>(null);

  useEffect(() => {
    protectIconsOnce();

    // Observation continue des nœuds ajoutés pour immuniser 100% des icônes
    let iconObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      iconObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes.length > 0) {
            protectIconsOnce();
            break;
          }
        }
      });
      iconObserver.observe(document.body, { childList: true, subtree: true });
    }

    const triggerComboChange = (combo: HTMLSelectElement, target: SupportedLanguage) => {
      if (combo.value !== target) {
        combo.value = target;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    const ensureGoogleTranslateLoaded = (target: SupportedLanguage) => {
      pendingTargetRef.current = target;

      if (isInitializedRef.current && window.google?.translate?.TranslateElement) {
        const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (combo) {
          triggerComboChange(combo, target);
        }
        return;
      }

      if (isScriptLoadingRef.current) return;
      isScriptLoadingRef.current = true;

      window.googleTranslateElementInit = () => {
        isInitializedRef.current = true;
        isScriptLoadingRef.current = false;

        if (window.google?.translate?.TranslateElement) {
          try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "fr",
                includedLanguages: "fr,en,es,pt,ar,sw",
                autoDisplay: false,
              },
              "google_translate_element"
            );
          } catch (e) {
            console.warn("Init TranslateElement warning:", e);
          }

          let attempts = 0;
          const checkTimer = window.setInterval(() => {
            attempts++;
            const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
            if (combo) {
              window.clearInterval(checkTimer);
              const activeTarget = pendingTargetRef.current;
              if (activeTarget && activeTarget !== "fr") {
                triggerComboChange(combo, activeTarget);
              }
            } else if (attempts >= 50) {
              window.clearInterval(checkTimer);
            }
          }, 60);
        }
      };

      if (!document.getElementById("google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    };

    /**
     * Applique la langue souhaitée au moteur de traduction sans rechargement en boucle.
     * La traduction s'opère en direct dans le DOM.
     */
    const applyLanguage = (requestedLang: string) => {
      const target = normalizeLanguage(requestedLang);
      if (currentLangRef.current === target && !pendingTargetRef.current) {
        return;
      }
      currentLangRef.current = target;
      pendingTargetRef.current = target;

      // 1. RETOUR AU FRANÇAIS (Langue source du site)
      if (target === "fr") {
        clearAllGoogleTranslateCookies();
        const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (combo && combo.value !== "fr") {
          triggerComboChange(combo, "fr");
        }
        document.documentElement.classList.remove("translated-ltr", "translated-rtl");
        document.body.classList.remove("translated-ltr", "translated-rtl");
        return;
      }

      // 2. LANGUE ÉTRANGÈRE (en, es, pt, ar, sw)
      setGoogleTranslateCookie(target);

      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo) {
        triggerComboChange(combo, target);
      } else {
        ensureGoogleTranslateLoaded(target);
      }
    };

    // Chargement initial selon la langue persistée
    const persisted = readPersistedVisitorLocale();
    if (persisted.language && persisted.language !== "fr") {
      applyLanguage(persisted.language);
    } else {
      clearAllGoogleTranslateCookies();
    }

    // Réaction réactive aux changements (sélection manuelle ou auto-détection)
    const onLocaleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<VisitorLocale>).detail;
      if (detail?.language) {
        applyLanguage(detail.language);
      }
    };

    window.addEventListener("ea-locale-updated", onLocaleUpdate);
    return () => {
      iconObserver?.disconnect();
      window.removeEventListener("ea-locale-updated", onLocaleUpdate);
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} aria-hidden="true" />
      <style jsx global>{`
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.goog-te-banner-frame,
        .goog-te-spinner-pos {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          border: 0 !important;
        }
        iframe.skiptranslate:not(.goog-te-banner-frame) {
          opacity: 0 !important;
          position: absolute !important;
          top: -9999px !important;
          left: -9999px !important;
          width: 1px !important;
          height: 1px !important;
          pointer-events: none !important;
        }
        body {
          top: 0px !important;
          position: static !important;
        }
        .notranslate,
        [translate="no"],
        .material-symbols-outlined,
        .material-icons,
        [class*="material-symbols"] {
          -webkit-translate: no !important;
          translate: no !important;
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
