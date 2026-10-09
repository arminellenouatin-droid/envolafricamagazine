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
 * Supprime les cookies sur le chemin `/`, sans chemin, sur le domaine actuel et les domaines racines.
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
  document.cookie = `googtrans=${target}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Vérifie si la page est actuellement altérée par Google Translate.
 */
function isPageTranslated(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("translated-ltr") ||
    document.documentElement.classList.contains("translated-rtl") ||
    Boolean(document.querySelector(".goog-te-combo:not([value='fr'])")) ||
    document.cookie.includes("googtrans=/fr/")
  );
}

/**
 * Protège les éléments d'icônes contre la traduction intempestive sans observer tout le DOM.
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

    // Observation continue des nœuds ajoutés pour immuniser 100% des icônes (y compris lazy/dynamiques)
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

    // Nettoyer l'indicateur de rechargement pour le français une fois la page stabilisée
    const persisted = readPersistedVisitorLocale();
    if (persisted.language === "fr") {
      clearAllGoogleTranslateCookies();
      try {
        sessionStorage.removeItem("ea_fr_reloading");
      } catch {}
    }

    /**
     * Applique la langue souhaitée au moteur Google Translate avec protection contre les courses.
     */
    const applyLanguage = (requestedLang: string, fromUserAction = false) => {
      const target = normalizeLanguage(requestedLang);
      currentLangRef.current = target;
      pendingTargetRef.current = target;

      // --- CAS PARTICULIER : RETOUR VERS LE FRANÇAIS (LANGUE SOURCE) ---
      if (target === "fr") {
        clearAllGoogleTranslateCookies();
        const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (select && select.value !== "fr") {
          select.value = "fr";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // Si la page a déjà été traduite dans le DOM (nœuds modifiés par Google Translate),
        // un reload unique contrôlé garantit un retour à 100% au DOM original sans résidus.
        if (fromUserAction && isPageTranslated()) {
          const isReloading = sessionStorage.getItem("ea_fr_reloading");
          if (!isReloading) {
            sessionStorage.setItem("ea_fr_reloading", "true");
            window.location.reload();
            return;
          }
        }
        return;
      }

      // --- CAS D'UNE LANGUE ÉTRANGÈRE (EN, ES, PT, AR, SW) ---
      setGoogleTranslateCookie(target);

      // Si le select Google Translate est déjà dans le DOM
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        if (select.value !== target) {
          select.value = target;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        return;
      }

      // Sinon, initialiser Google Translate si ce n'est pas déjà en cours
      if (!isScriptLoadingRef.current && !isInitializedRef.current) {
        isScriptLoadingRef.current = true;

        window.googleTranslateElementInit = () => {
          isInitializedRef.current = true;
          isScriptLoadingRef.current = false;

          if (window.google?.translate?.TranslateElement) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: "fr",
                includedLanguages: "fr,en,es,pt,ar,sw",
                autoDisplay: false,
              },
              "google_translate_element"
            );

            // Attendre l'apparition du select pour appliquer la dernière cible demandée
            let attempts = 0;
            const checkTimer = window.setInterval(() => {
              attempts++;
              const el = document.querySelector<HTMLSelectElement>(".goog-te-combo");
              if (el) {
                window.clearInterval(checkTimer);
                const activeTarget = pendingTargetRef.current;
                if (activeTarget && activeTarget !== "fr") {
                  el.value = activeTarget;
                  el.dispatchEvent(new Event("change", { bubbles: true }));
                }
              } else if (attempts >= 40) {
                window.clearInterval(checkTimer);
              }
            }, 100);
          }
        };

        if (!document.getElementById("google-translate-script")) {
          const script = document.createElement("script");
          script.id = "google-translate-script";
          script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
          script.async = true;
          script.defer = true;
          document.body.appendChild(script);
        }
      }
    };

    // Initialisation au chargement selon la langue persistée
    if (persisted.language && persisted.language !== "fr") {
      applyLanguage(persisted.language, false);
    }

    // Réaction réactive à l'événement ea-locale-updated
    const onLocaleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<VisitorLocale>).detail;
      if (detail?.language) {
        applyLanguage(detail.language, Boolean(detail.isManual || detail.languageSource === "manual"));
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
        iframe.skiptranslate,
        .goog-te-spinner-pos {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          border: 0 !important;
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
