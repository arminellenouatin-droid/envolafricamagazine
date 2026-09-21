"use client";
import React, { useState, useRef, useEffect } from "react";
import { LiveMessageItem } from "./LiveRealtimeEngine";

interface LiveChatOverlayProps {
  messages: LiveMessageItem[];
  pinnedMessage?: LiveMessageItem | null;
  onSendMessage: (text: string) => void;
  onVoteClick: () => void;
  onDonateClick: () => void;
  onGiftClick: () => void;
  onJoinClick?: () => void;
  canJoin?: boolean;
}

export default function LiveChatOverlay({
  messages,
  pinnedMessage,
  onSendMessage,
  onVoteClick,
  onDonateClick,
  onGiftClick,
  onJoinClick,
  canJoin = false,
}: LiveChatOverlayProps) {
  const [inputText, setInputText] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll doux vers le bas quand un nouveau message arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="absolute left-0 right-0 bottom-0 z-20 flex flex-col justify-end p-3 sm:p-4 pointer-events-none">
      {/* 1. Zone du Chat défilant avec fondu vers le haut */}
      <div className="relative w-full max-w-[380px] sm:max-w-[420px] pointer-events-auto">
        {/* Commentaire Épinglé (si défini par l'animateur) */}
        {pinnedMessage && (
          <div className="mb-2 flex items-start gap-2 rounded-2xl border border-[#D4AF37]/50 bg-black/75 p-2.5 backdrop-blur-md shadow-lg animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-[16px] text-[#F4D976] shrink-0 mt-0.5">
              push_pin
            </span>
            <div className="text-xs leading-tight">
              <span className="font-bold text-[#F4D976] mr-1">
                {pinnedMessage.user} (Épinglé) :
              </span>
              <span className="text-white/95">{pinnedMessage.text}</span>
            </div>
          </div>
        )}

        {/* Conteneur avec masque de dégradé pour effet fondu des anciens messages */}
        <div
          className="max-h-[190px] sm:max-h-[220px] overflow-y-auto space-y-2 pr-2 scrollbar-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 18%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 18%, black 100%)",
          }}
        >
          {messages.slice(-30).map((msg) => {
            if (msg.isModerated || msg.isBanned) return null;

            return (
              <div
                key={msg.id}
                className={`inline-flex items-start gap-2 rounded-2xl px-3 py-1.5 backdrop-blur-md max-w-full text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                  msg.isGift
                    ? "bg-gradient-to-r from-[#D4AF37]/35 via-amber-900/40 to-black/60 border border-[#F4D976]/40 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
                    : msg.isDonation
                    ? "bg-gradient-to-r from-emerald-900/40 to-black/60 border border-emerald-500/40"
                    : "bg-black/45 border border-white/10"
                }`}
              >
                {/* Avatar miniature ou icône */}
                {msg.isGift ? (
                  <span className="text-sm shrink-0">{msg.giftIcon || "🎁"}</span>
                ) : msg.isDonation ? (
                  <span className="text-sm shrink-0">🪙</span>
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[9px] font-black text-[#F4D976]">
                    {msg.user.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="leading-snug break-words">
                  <span className="font-extrabold text-[#F4D976] mr-1.5">
                    {msg.user}
                  </span>
                  <span className="text-white/95">{msg.text}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* 2. Rangée des boutons d'action principaux */}
      <div className="mt-3 flex items-center gap-2 pointer-events-auto w-full max-w-[420px]">
        {/* BOUTON VOTER : Le plus proéminent et doré */}
        <button
          type="button"
          onClick={onVoteClick}
          aria-label="Voter pour un candidat"
          className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#AA7C11] px-4 text-xs font-black text-black shadow-[0_0_20px_rgba(212,175,55,0.45)] transition hover:brightness-110 active:scale-95 uppercase tracking-wide"
        >
          <span className="text-base">🗳️</span>
          <span>Voter</span>
        </button>

        {/* SOUTENIR (DON) */}
        <button
          type="button"
          onClick={onDonateClick}
          aria-label="Faire un don de soutien"
          className="h-11 px-3.5 flex items-center gap-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-white font-bold text-xs shadow-lg transition hover:bg-white/15 active:scale-95"
        >
          <span className="text-sm">💛</span>
          <span>Don</span>
        </button>

        {/* CADEAU */}
        <button
          type="button"
          onClick={onGiftClick}
          aria-label="Offrir un cadeau virtuel"
          className="h-11 px-3.5 flex items-center gap-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 backdrop-blur-md text-[#F4D976] font-bold text-xs shadow-lg transition hover:bg-[#D4AF37]/30 active:scale-95"
        >
          <span className="text-sm">🎁</span>
          <span>Cadeau</span>
        </button>

        {/* REJOINDRE LE LIVE (CAMÉRA) SI AUTORISÉ */}
        {canJoin && (
          <button
            type="button"
            onClick={onJoinClick}
            aria-label="Rejoindre le live"
            className="h-11 px-3.5 flex items-center gap-1 rounded-full bg-red-600 text-white font-bold text-xs shadow-lg transition hover:bg-red-500 active:scale-95 animate-pulse"
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            <span className="hidden xs:inline">Monter</span>
          </button>
        )}
      </div>

      {/* 3. Barre de saisie de commentaire */}
      <form
        onSubmit={handleSubmit}
        className="mt-2 flex items-center gap-2 pointer-events-auto w-full max-w-[420px]"
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-white/50">
            chat
          </span>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Envoyer un commentaire en direct…"
            className="h-10 w-full rounded-full border border-white/20 bg-black/55 pl-10 pr-4 text-xs text-white placeholder-white/50 backdrop-blur-md focus:border-[#D4AF37] focus:bg-black/80 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          aria-label="Envoyer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-black font-black transition hover:bg-[#F4D976] active:scale-95 disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
}
