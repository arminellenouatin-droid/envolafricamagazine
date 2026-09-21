"use client";
import React, { useState } from "react";
import Link from "next/link";

interface FloatingParticle {
  id: number;
  emoji: string;
  leftOffset: number;
}

interface LiveTikTokActionsProps {
  candidateId?: string;
  candidateName?: string;
  candidateAvatar?: string;
  reactionCount: number;
  onSendReaction: (emoji: string) => void;
  onOpenGifts: () => void;
  onShare: () => void;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

const EMOJIS = ["❤️", "🔥", "✨", "👑", "👏", "🏆"];

export default function LiveTikTokActions({
  candidateId,
  candidateName,
  candidateAvatar,
  reactionCount,
  onSendReaction,
  onOpenGifts,
  onShare,
  isFollowing = false,
  onToggleFollow,
}: LiveTikTokActionsProps) {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [likeScale, setLikeScale] = useState(false);

  const handleReactionClick = () => {
    setLikeScale(true);
    setTimeout(() => setLikeScale(false), 200);

    const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const newParticle: FloatingParticle = {
      id: Date.now() + Math.random(),
      emoji: randomEmoji,
      leftOffset: (Math.random() - 0.5) * 60,
    };

    setParticles((prev) => [...prev.slice(-15), newParticle]);
    onSendReaction(randomEmoji);

    // Auto remove after animation completes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1800);
  };

  return (
    <aside
      aria-label="Actions rapides direct"
      className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 pointer-events-auto select-none"
    >
      {/* Zone des cœurs flottants montants */}
      <div className="pointer-events-none absolute bottom-12 right-0 h-96 w-32 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute bottom-4 text-2xl filter drop-shadow-md animate-float-up"
            style={{
              right: `calc(50% + ${p.leftOffset}px)`,
              animation: "floatUp 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards",
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* 1. Avatar du candidat soutenu (raccourci profil) */}
      <div className="relative group">
        <Link
          href={candidateId ? `/africa-awards/candidates/${candidateId}` : "#"}
          className="block h-12 w-12 rounded-full border-2 border-[#F4D976] p-0.5 shadow-lg backdrop-blur-md bg-black/40 overflow-hidden transition transform hover:scale-110 active:scale-95"
          title={candidateName ? `Profil de ${candidateName}` : "Candidat favori"}
        >
          {candidateAvatar ? (
            <img
              src={candidateAvatar}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#1B2A6B] text-xs font-black text-[#D4AF37]">
              {candidateName ? candidateName.slice(0, 2).toUpperCase() : "AA"}
            </div>
          )}
        </Link>
        {/* Bouton Suivre + sous l'avatar */}
        {onToggleFollow && (
          <button
            type="button"
            onClick={onToggleFollow}
            aria-label={isFollowing ? "Ne plus suivre" : "Suivre le candidat"}
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full shadow-md transition ${
              isFollowing
                ? "bg-white text-black font-bold text-[10px]"
                : "bg-red-600 text-white font-black text-[12px] hover:bg-red-500"
            }`}
          >
            {isFollowing ? "✓" : "+"}
          </button>
        )}
      </div>

      {/* 2. Bouton Cœur / Réaction rapide */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleReactionClick}
          aria-label="Aimer et envoyer une réaction"
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/50 border border-white/20 backdrop-blur-md text-red-500 shadow-xl transition active:scale-90 ${
            likeScale ? "scale-125 text-red-400" : "hover:scale-105"
          }`}
        >
          <span className="material-symbols-outlined text-[26px] fill-current text-red-500">
            favorite
          </span>
        </button>
        <span className="mt-1 text-[10px] font-bold text-white/90 drop-shadow">
          {reactionCount > 999
            ? `${(reactionCount / 1000).toFixed(1)}k`
            : reactionCount}
        </span>
      </div>

      {/* 3. Bouton Cadeau doré (ouvre le tiroir de cadeaux virtuels) */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onOpenGifts}
          aria-label="Offrir un cadeau virtuel"
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#F4D976] via-[#D4AF37] to-[#8C6B14] p-0.5 shadow-[0_0_20px_rgba(212,175,55,0.45)] transition hover:scale-110 active:scale-90"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white">
            <span className="text-[22px]">🎁</span>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F4D976] opacity-80"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#D4AF37]"></span>
          </span>
        </button>
        <span className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#F4D976] drop-shadow">
          Cadeau
        </span>
      </div>

      {/* 4. Bouton Partager */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={onShare}
          aria-label="Partager ce direct"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 border border-white/20 backdrop-blur-md text-white shadow-xl transition hover:scale-105 active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px] text-white/90">
            share
          </span>
        </button>
        <span className="mt-0.5 text-[9px] font-semibold text-white/80 drop-shadow">
          Partager
        </span>
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.6) rotate(0deg);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-120px) scale(1.2) rotate(15deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-240px) scale(1.4) rotate(-15deg);
          }
        }
      `}</style>
    </aside>
  );
}
