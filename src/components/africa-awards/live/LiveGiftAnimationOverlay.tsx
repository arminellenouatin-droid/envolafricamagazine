"use client";
import React, { useEffect, useState } from "react";

export interface GiftAnimationItem {
  id: string;
  senderName: string;
  candidateName: string;
  giftIcon: string;
  giftName: string;
  amountXof?: number;
  type: "gift" | "donation" | "announcement";
  announcementText?: string;
}

interface LiveGiftAnimationOverlayProps {
  currentAnimation: GiftAnimationItem | null;
  onAnimationEnd: () => void;
}

export default function LiveGiftAnimationOverlay({
  currentAnimation,
  onAnimationEnd,
}: LiveGiftAnimationOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (currentAnimation) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onAnimationEnd();
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [currentAnimation, onAnimationEnd]);

  if (!currentAnimation || !visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden">
      {/* 1. Animation Grand Cadeau Traversant en Diagonale */}
      {currentAnimation.type === "gift" && (
        <div className="relative w-full max-w-lg animate-diagonal-slide">
          {/* Faisceau lumineux doré de fond */}
          <div className="absolute inset-0 -skew-y-3 bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent blur-md h-24" />

          {/* Bannière principale */}
          <div className="relative mx-auto flex items-center justify-between rounded-3xl border-2 border-[#F4D976] bg-black/80 px-6 py-4 shadow-[0_0_50px_rgba(212,175,55,0.7)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <span className="text-5xl animate-bounce filter drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">
                {currentAnimation.giftIcon}
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#F4D976]">
                  Cadeau Virtuel Débloqué !
                </p>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  <strong className="text-amber-300 font-black">
                    {currentAnimation.senderName}
                  </strong>{" "}
                  a offert {currentAnimation.giftName} à{" "}
                  <strong className="text-[#F4D976] font-black">
                    {currentAnimation.candidateName}
                  </strong>
                </p>
              </div>
            </div>

            {/* Effet d'étincelles */}
            <div className="flex items-center text-xl text-yellow-300 animate-pulse">
              ✨✨
            </div>
          </div>
        </div>
      )}

      {/* 2. Animation Don & Étincelles */}
      {currentAnimation.type === "donation" && (
        <div className="relative w-full max-w-md animate-scale-glow">
          <div className="mx-auto rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-r from-[#0B0B0F] via-[#1A1A2E] to-[#0B0B0F] p-5 shadow-[0_0_60px_rgba(212,175,55,0.8)] text-center backdrop-blur-xl">
            <div className="text-4xl animate-bounce">🪙✨</div>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-[#D4AF37]">
              Grand Soutien Confirmé
            </p>
            <h3 className="mt-1 font-serif text-xl font-black text-white">
              {currentAnimation.senderName}
            </h3>
            <p className="mt-1 text-sm text-white/90">
              vient d’offrir{" "}
              <span className="text-[#F4D976] font-extrabold text-lg">
                {(currentAnimation.amountXof || 0).toLocaleString("fr-FR")} F CFA
              </span>{" "}
              à {currentAnimation.candidateName}
            </p>
          </div>
        </div>
      )}

      {/* 3. Bannière Annonce Animateur (Broadcast Mégaphone) */}
      {currentAnimation.type === "announcement" && (
        <div className="absolute top-20 w-full max-w-md px-4 animate-in slide-in-from-top duration-300">
          <div className="rounded-2xl border border-[#D4AF37] bg-gradient-to-r from-red-950/90 via-[#0B0B0F]/95 to-red-950/90 p-4 text-center shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
              <span className="text-base">📢</span>
              <span>Annonce de l’animateur</span>
            </div>
            <p className="mt-1.5 text-sm font-bold text-white leading-snug">
              {currentAnimation.announcementText}
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes diagonalSlide {
          0% {
            opacity: 0;
            transform: translate(-100%, 80px) rotate(-6deg) scale(0.8);
          }
          15% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1.05);
          }
          85% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(100%, -80px) rotate(6deg) scale(0.8);
          }
        }
        @keyframes scaleGlow {
          0% {
            opacity: 0;
            transform: scale(0.6);
          }
          15% {
            opacity: 1;
            transform: scale(1.08);
          }
          30% {
            transform: scale(1);
          }
          85% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-40px);
          }
        }
        .animate-diagonal-slide {
          animation: diagonalSlide 4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-scale-glow {
          animation: scaleGlow 4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}
