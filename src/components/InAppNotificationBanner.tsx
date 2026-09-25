"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface InAppNotification {
  title: string;
  body: string;
  href: string;
  image?: string;
  icon?: string;
}

export default function InAppNotificationBanner() {
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Émission d'un son de carillon doux et élégant via Web Audio API (ne dépend d'aucun fichier distant)
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Première note : Sol (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      // Seconde note : Do aigu (880 Hz) avec léger décalage
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.55);
    } catch {
      // Ignorer silencieusement si l'audio n'est pas autorisé
    }
  }, []);

  const triggerNotification = useCallback((item: InAppNotification) => {
    if (!item.title && !item.body) return;
    setNotification(item);
    playNotificationSound();

    // Vibration sur mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([70, 40, 70]);
      } catch {}
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    // Masquer après 7 secondes d'affichage
    timerRef.current = setTimeout(() => {
      setNotification(null);
    }, 7000);
  }, [playNotificationSound]);

  useEffect(() => {
    // 1. Écouter les événements directs du client
    const handleCustomEvent = (event: Event) => {
      const custom = event as CustomEvent<InAppNotification>;
      if (custom.detail) {
        triggerNotification(custom.detail);
      }
    };
    window.addEventListener("eam_in_app_notification", handleCustomEvent);

    // 2. Écouter les messages du Service Worker (en cas de push reçu en arrière-plan)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "EAM_IN_APP_NOTIFICATION") {
        triggerNotification({
          title: event.data.title,
          body: event.data.body,
          href: event.data.href || "/",
          image: event.data.image,
          icon: event.data.icon,
        });
      }
    };

    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSwMessage);
    }

    return () => {
      window.removeEventListener("eam_in_app_notification", handleCustomEvent);
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerNotification]);

  if (!notification) return null;

  const handleOpen = () => {
    const target = notification.href || "/";
    setNotification(null);
    window.location.assign(target);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNotification(null);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={handleOpen}
      className="fixed top-2 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[99999] cursor-pointer rounded-2xl border border-white/20 bg-[#061524]/95 p-3.5 text-white shadow-[0_16px_45px_rgba(0,0,0,0.65)] backdrop-blur-xl animate-in slide-in-from-top duration-300 ease-out active:scale-[0.99] transition-transform"
    >
      {/* Poignée subtile de tiroir supérieur */}
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-white/20" />

      <div className="flex items-center gap-3">
        {/* Miniature / Image de la notification */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-inner">
          <img
            src={notification.image || notification.icon || "/mobile-header-logo.png"}
            alt="Notification"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/mobile-header-logo.png";
            }}
          />
          <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#061524]" />
        </div>

        {/* Contenu textuel */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="font-display text-xs font-black text-white truncate max-w-[200px]">
              {notification.title || "ENVOL AFRICA"}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider shrink-0">
              À l'instant
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-300 line-clamp-2">
            {notification.body}
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white shadow-md active:scale-95 transition-all"
          >
            Voir
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer la notification"
            className="grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
