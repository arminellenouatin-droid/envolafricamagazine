"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Ne s'exécute que côté client
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Vérifier si l'application est déjà installée en mode standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) return;

    // Vérifier si l'utilisateur a déjà vu ou refusé l'installation (première visite)
    const storedChoice = localStorage.getItem("eam_pwa_installed_or_dismissed");
    if (storedChoice) return;

    // Détection téléphone ou tablette
    const ua = navigator.userAgent || "";
    const isMobileDevice =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth <= 1024);

    if (!isMobileDevice) return;

    const isAppleDevice = /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isAppleDevice);

    // Écouter l'événement standard Chrome/Android/Edge
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Pour iOS Safari ou navigateurs sans beforeinstallprompt automatique : afficher après un court délai pour première visite
    const timer = setTimeout(() => {
      if (isMobileDevice && !storedChoice) {
        setShowPrompt(true);
      }
    }, 2500);

    // Écouter l'événement d'installation confirmée
    const handleAppInstalled = () => {
      localStorage.setItem("eam_pwa_installed_or_dismissed", "installed");
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem("eam_pwa_installed_or_dismissed", "dismissed");
    setShowPrompt(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          localStorage.setItem("eam_pwa_installed_or_dismissed", "installed");
          setShowPrompt(false);
        } else {
          localStorage.setItem("eam_pwa_installed_or_dismissed", "dismissed");
          setShowPrompt(false);
        }
      } catch {
        // En cas d'erreur de prompt, fermer
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Fallback
      alert("Pour installer Envol Africa, ouvrez le menu de votre navigateur et sélectionnez 'Ajouter à l'écran d'accueil'.");
      dismiss();
    }
  };

  if (!showPrompt) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-modal="true"
      className="fixed inset-x-0 bottom-0 z-[999] p-3 sm:p-5 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-3xl border border-[#006874]/30 bg-gradient-to-br from-[#071b36] via-[#082843] to-[#041424] p-4 sm:p-5 text-white shadow-2xl backdrop-blur-lg">
        {/* Header avec Logo Favicon du site */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white p-2 shadow-lg ring-2 ring-[#8ee0c0]/30">
              <img
                src="/favicon.png"
                alt="Logo Envol Africa"
                className="h-10 w-10 object-contain"
                width={40}
                height={40}
              />
            </div>
            <div>
              <span className="inline-block rounded-full bg-[#8ee0c0]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8ee0c0]">
                Application Officielle
              </span>
              <h3 id="pwa-install-title" className="mt-0.5 font-display text-base sm:text-lg font-bold text-white">
                Installer Envol Africa
              </h3>
              <p className="text-xs text-white/70">
                sur votre téléphone ou tablette
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Explications & Avantages */}
        <p className="mt-3 text-xs leading-relaxed text-white/80">
          Accédez directement au kiosque des magazines, aux opportunités d&apos;affaires, offres d&apos;emploi et au réseau WAB sans passer par le navigateur.
        </p>

        {/* Guide d'installation iOS Safari si demandé */}
        {showIosGuide && (
          <div className="mt-3.5 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs text-white">
            <p className="font-bold text-[#8ee0c0] flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Comment installer sur iPhone / iPad :
            </p>
            <ol className="space-y-1.5 pl-5 list-decimal text-white/90 text-[11px] leading-relaxed">
              <li>
                Appuyez sur le bouton de <strong>Partage</strong> en bas de Safari (l&apos;icône carré avec une flèche vers le haut <span className="inline-block px-1 py-0.5 rounded bg-white/20 font-mono">⎋</span>).
              </li>
              <li>
                Faites défiler vers le bas et touchez <strong>« Sur l&apos;écran d&apos;accueil »</strong> (<span className="inline-block px-1 rounded bg-white/20 font-bold">＋</span>).
              </li>
              <li>
                Appuyez sur <strong>Ajouter</strong> en haut à droite.
              </li>
            </ol>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="mt-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8ee0c0] to-[#00a896] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-[#071b36] shadow-md transition hover:brightness-105 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Installer l&apos;application</span>
          </button>

          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
