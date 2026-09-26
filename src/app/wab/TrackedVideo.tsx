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

  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // IntersectionObserver pour lecture automatique (autoplay) au défilement
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Visible à 50% ou plus : lecture automatique fluide
            video.play().catch(() => {
              // Autoplay bloqué par le navigateur si non muet
            });
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
  }, []);

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
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
          setIsPlaying(true);
          started.current = Date.now();
        }}
        onPause={() => {
          setIsPlaying(false);
          if (started.current) {
            send((Date.now() - started.current) / 1000);
            started.current = null;
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
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

      {/* Petit indicateur toast lors du basculement audio */}
      {showSoundToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-md animate-fade-in">
          {isMuted ? "🔇 Son désactivé" : "🔊 Son activé"}
        </div>
      )}
    </div>
  );
}
