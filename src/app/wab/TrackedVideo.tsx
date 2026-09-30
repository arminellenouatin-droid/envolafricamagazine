"use client";

import { useEffect, useRef, useState } from "react";

export default function TrackedVideo({
  postId,
  src,
  name,
}: {
  postId: string;
  src: string;
  name: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef<number | null>(null);
  const sent = useRef(false);

  // Par défaut : son activé (selon la demande de l'utilisateur), mémorisé par session
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("wab_video_muted");
      return saved === "true"; // true seulement si l'utilisateur a explicitement coupé le son
    }
    return false;
  });

  const [showSoundToast, setShowSoundToast] = useState(false);

  function send(seconds: number) {
    if (sent.current || seconds < 3) return;
    sent.current = true;
    const visitorId = localStorage.getItem("ea_visitor_id") || crypto.randomUUID();
    localStorage.setItem("ea_visitor_id", visitorId);
    fetch(`/api/wab/posts/${postId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, watchSeconds: Math.round(seconds) }),
    }).catch(() => undefined);
  }

  // Écouter si une autre vidéo commence à jouer pour mettre celle-ci en pause
  useEffect(() => {
    const handleOtherVideoPlaying = (e: Event) => {
      const customEvent = e as CustomEvent<{ postId: string }>;
      if (customEvent.detail?.postId !== postId && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    window.addEventListener("wab_video_playing", handleOtherVideoPlaying);
    return () => window.removeEventListener("wab_video_playing", handleOtherVideoPlaying);
  }, [postId]);

  // Écouter le déblocage audio global au premier geste utilisateur
  useEffect(() => {
    const unlockAudio = () => {
      if (videoRef.current && !isMuted && videoRef.current.muted) {
        videoRef.current.muted = false;
      }
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, [isMuted]);

  // IntersectionObserver pour lecture automatique (autoplay) au défilement avec son
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Visible à 50% ou plus : lecture automatique avec son
            video.muted = isMuted;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  window.dispatchEvent(new CustomEvent("wab_video_playing", { detail: { postId } }));
                })
                .catch(() => {
                  // Si le navigateur bloque l'autoplay avec son (avant le 1er clic utilisateur),
                  // on démarre en muet temporairement pour que la vidéo tourne
                  video.muted = true;
                  video.play().then(() => {
                    window.dispatchEvent(new CustomEvent("wab_video_playing", { detail: { postId } }));
                  }).catch(() => {});
                });
            }
          } else if (entry.intersectionRatio < 0.25) {
            // Sorti du champ de vision : pause automatique
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: [0.25, 0.5, 0.75],
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isMuted, postId]);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      sessionStorage.setItem("wab_video_muted", String(nextMuted));
    } catch {}

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          window.dispatchEvent(new CustomEvent("wab_video_playing", { detail: { postId } }));
        }).catch(() => {});
      }
    }
    setShowSoundToast(true);
    setTimeout(() => setShowSoundToast(false), 2000);
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-xl bg-black group">
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        muted={isMuted}
        aria-label={name}
        className="w-full max-h-[560px] object-contain mx-auto"
        onPlay={() => {
          started.current = Date.now();
        }}
        onPause={() => {
          if (started.current) {
            send((Date.now() - started.current) / 1000);
            started.current = null;
          }
        }}
        onEnded={() => {
          if (started.current) {
            send((Date.now() - started.current) / 1000);
          }
        }}
      />

      {/* Bouton rapide d'activation / désactivation du son */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
        className="absolute bottom-16 right-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105 active:scale-95"
      >
        <span className="material-symbols-outlined text-base">
          {isMuted ? "volume_off" : "volume_up"}
        </span>
        <span className="text-[11px] hidden sm:inline">
          {isMuted ? "Activer le son" : "Son actif"}
        </span>
      </button>

      {/* Bouton plein écran style TikTok */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
          window.dispatchEvent(new CustomEvent("wab_open_tiktok_feed", { detail: { postId, videoUrl: src } }));
        }}
        aria-label="Ouvrir en plein écran style TikTok"
        className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/80 hover:scale-105 active:scale-95"
      >
        <span className="material-symbols-outlined text-base">fullscreen</span>
        <span className="text-[11px] hidden sm:inline">Plein écran</span>
      </button>

      {/* Petit indicateur toast lors du basculement audio */}
      {showSoundToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-md animate-fade-in">
          {isMuted ? "🔇 Son désactivé" : "🔊 Son activé"}
        </div>
      )}
    </div>
  );
}
