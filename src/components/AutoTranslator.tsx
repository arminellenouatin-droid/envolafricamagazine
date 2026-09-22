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

function getCookieDomains(): string[] {
  if (typeof window === "undefined") return [];
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  const domains: string[] = ["", hostname, `.${hostname}`];
  if (parts.length >= 2) {
    const rootDomain = parts.slice(-2).join(".");
    domains.push(`.${rootDomain}`);
  }
  return Array.from(new Set(domains));
}

function setGoogleTranslateCookie(lang: string) {
  if (typeof window === "undefined") return;
  const target = lang && lang !== "fr" ? `/fr/${lang}` : "";
  const maxAge = target ? 60 * 60 * 24 * 30 : 0;
  const expires = target ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const domains = getCookieDomains();

  domains.forEach((d) => {
    const domainClause = d ? `; domain=${d}` : "";
    document.cookie = `googtrans=${target}; path=/; max-age=${maxAge}${expires}; SameSite=Lax${domainClause}`;
  });
}

function protectAllIcons() {
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
  useEffect(() => {
    // Protection permanente de toutes les icônes contre la traduction intempestive (ex: "public" -> "AUDIENCE")
    protectAllIcons();
    const observer = new MutationObserver(() => protectAllIcons());
    observer.observe(document.body, { childList: true, subtree: true });

    const applyLanguage = (lang: string, triggerReload = false) => {
      const target = lang.toLowerCase().split("-")[0] || "fr";

      if (target === "fr") {
        setGoogleTranslateCookie("");
        const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (select && select.value !== "fr") {
          select.value = "fr";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (triggerReload) {
          window.location.reload();
        }
        return;
      }

      setGoogleTranslateCookie(target);

      // Si le widget est déjà présent, changer la valeur
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (select) {
        if (select.value !== target) {
          select.value = target;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (triggerReload) {
          window.location.reload();
        }
        return;
      }

      // Sinon, initialiser le script Google Translate
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
          const checkTimer = window.setInterval(() => {
            const el = document.querySelector<HTMLSelectElement>(".goog-te-combo");
            if (el) {
              window.clearInterval(checkTimer);
              el.value = target;
              el.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }, 100);
          window.setTimeout(() => window.clearInterval(checkTimer), 4000);
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

    // Initialiser au chargement selon les préférences persistées
    const initial = readPersistedVisitorLocale();
    if (initial.language && initial.language !== "fr") {
      applyLanguage(initial.language, false);
    }

    // Réagir aux changements manuels de langue demandés par l'utilisateur
    const onLocaleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<VisitorLocale>).detail;
      if (detail?.language) {
        applyLanguage(detail.language, Boolean(detail.isManual));
      }
    };

    window.addEventListener("ea-locale-updated", onLocaleUpdate);
    return () => {
      observer.disconnect();
      window.removeEventListener("ea-locale-updated", onLocaleUpdate);
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} aria-hidden="true" />
      <style jsx global>{`
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        iframe.skiptranslate {
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
        .material-icons {
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
