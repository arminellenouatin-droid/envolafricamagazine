"use client";
import React, { useState } from "react";
import { RankingCandidate } from "./LiveRealtimeEngine";

interface LiveHostPreviewPipProps {
  competitionTitle: string;
  activeSpeakerCandidate?: RankingCandidate | null;
  spectators: number;
  potAmountXof: number;
}

export default function LiveHostPreviewPip({
  competitionTitle,
  activeSpeakerCandidate,
  spectators,
  potAmountXof,
}: LiveHostPreviewPipProps) {
  const [minimized, setMinimized] = useState(false);

  return (
    <aside
      aria-label="Aperçu retour spectateur"
      className="rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl p-2.5 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-[#F4D976]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span>Retour Spectateur (PiP)</span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(!minimized)}
          className="text-white/60 hover:text-white"
        >
          {minimized ? "Agrandir" : "Réduire"}
        </button>
      </div>

      {!minimized && (
        <div className="mt-2 relative w-full aspect-[9/16] max-w-[130px] sm:max-w-[150px] mx-auto rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-[#07070A] shadow-inner">
          {/* Vidéo de fond miniature */}
          {activeSpeakerCandidate?.photoUrl ? (
            <img
              src={activeSpeakerCandidate.photoUrl}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-950 to-black text-[10px] text-white/50">
              Scène Live
            </div>
          )}

          {/* En-tête miniature */}
          <div className="absolute top-1 inset-x-1 flex items-center justify-between text-[7px] text-white bg-black/60 px-1 py-0.5 rounded-full">
            <span className="font-bold truncate max-w-[50px]">{competitionTitle}</span>
            <span className="text-[#F4D976] font-mono font-bold">👁 {spectators}</span>
          </div>

          {/* Badge live speaker miniature */}
          <div className="absolute top-7 left-1 flex items-center gap-0.5 rounded-full bg-black/70 px-1 py-0.5 border border-[#F4D976]/40 text-[7px] text-[#F4D976]">
            <span>🏆</span>
            <span className="truncate max-w-[50px]">
              {activeSpeakerCandidate?.name || "Candidat"}
            </span>
          </div>

          {/* Boutons TikTok miniatures à droite */}
          <div className="absolute right-1 bottom-8 flex flex-col gap-1 items-center">
            <div className="h-4 w-4 rounded-full bg-red-600/80 flex items-center justify-center text-[7px] text-white">
              ❤
            </div>
            <div className="h-4 w-4 rounded-full bg-[#D4AF37] flex items-center justify-center text-[7px] text-black font-bold">
              🎁
            </div>
          </div>

          {/* Bas miniature */}
          <div className="absolute bottom-1 inset-x-1">
            <div className="h-3 rounded-full bg-[#D4AF37] text-black font-black text-[7px] flex items-center justify-center">
              Voter
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
