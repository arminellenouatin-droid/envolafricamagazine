"use client";
import React, { useState } from "react";
import { RankingCandidate } from "./LiveRealtimeEngine";

interface LiveFloatingRankingProps {
  candidates: RankingCandidate[];
  activeSpeakerId?: string | null;
  onSelectCandidate?: (candidate: RankingCandidate) => void;
}

export default function LiveFloatingRanking({
  candidates,
  activeSpeakerId,
  onSelectCandidate,
}: LiveFloatingRankingProps) {
  const [collapsed, setCollapsed] = useState(false);

  const topCandidates = candidates.slice(0, 5);

  return (
    <aside
      aria-label="Classement en direct"
      className="absolute left-3 top-20 z-20 flex flex-col transition-all duration-300 pointer-events-auto"
    >
      {/* Bouton de repli pour mobile */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="mb-1.5 flex items-center gap-1 self-start rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#F4D976] shadow-lg hover:bg-black/80"
      >
        <span>🏆 Top 5</span>
        <span className="material-symbols-outlined text-[13px]">
          {collapsed ? "expand_more" : "expand_less"}
        </span>
      </button>

      {!collapsed && (
        <div className="w-[185px] sm:w-[210px] rounded-2xl border border-white/15 bg-black/60 p-2 sm:p-2.5 backdrop-blur-xl shadow-2xl space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37]/90">
            <span>Rang & Candidat</span>
            <span>Points</span>
          </div>

          <div className="space-y-1">
            {topCandidates.map((candidate, idx) => {
              const isSpeaker =
                candidate.id === activeSpeakerId || candidate.isLiveSpeaker;

              return (
                <div
                  key={candidate.id}
                  onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
                  className={`group relative flex items-center justify-between rounded-xl p-1.5 transition cursor-pointer ${
                    isSpeaker
                      ? "bg-gradient-to-r from-[#D4AF37]/30 via-[#F4D976]/15 to-transparent border border-[#D4AF37]/60 shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                      : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Numéro de rang */}
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        idx === 0
                          ? "bg-[#D4AF37] text-black font-extrabold shadow-sm"
                          : idx === 1
                          ? "bg-slate-300 text-black font-bold"
                          : idx === 2
                          ? "bg-amber-700 text-white font-bold"
                          : "text-white/60 font-semibold"
                      }`}
                    >
                      {candidate.pos || idx + 1}
                    </span>

                    {/* Avatar avec bordure dorée pulsante si en direct */}
                    <div className="relative shrink-0">
                      <div
                        className={`h-7 w-7 sm:h-8 sm:w-8 overflow-hidden rounded-full border ${
                          isSpeaker
                            ? "border-[#F4D976] ring-2 ring-[#D4AF37] ring-offset-1 ring-offset-black animate-pulse"
                            : "border-white/20"
                        }`}
                      >
                        {candidate.photoUrl ? (
                          <img
                            src={candidate.photoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#1B2A6B] text-[10px] font-bold text-[#D4AF37]">
                            {candidate.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Badge doré EN DIRECT si actif */}
                      {isSpeaker && (
                        <span className="absolute -bottom-1 -left-1 rounded-full bg-gradient-to-r from-[#F4D976] to-[#D4AF37] px-1 text-[7px] font-black uppercase tracking-tight text-black shadow-md">
                          LIVE
                        </span>
                      )}
                    </div>

                    {/* Nom */}
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-white/95 leading-tight">
                        {candidate.name}
                      </p>
                      {isSpeaker && (
                        <span className="text-[9px] font-black text-[#F4D976] flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#F4D976] animate-ping" />
                          En direct
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score & Flèches d'évolution */}
                  <div className="flex items-center gap-1 shrink-0 text-right pl-1">
                    <span className="font-mono text-[11px] font-bold text-white/90">
                      {candidate.votes.toLocaleString()}
                    </span>
                    {candidate.change === "up" && (
                      <span
                        title="Progresse"
                        className="material-symbols-outlined text-[14px] text-green-400 font-black animate-bounce"
                      >
                        arrow_upward
                      </span>
                    )}
                    {candidate.change === "down" && (
                      <span
                        title="Recule"
                        className="material-symbols-outlined text-[14px] text-red-400 font-black"
                      >
                        arrow_downward
                      </span>
                    )}
                    {candidate.change === "stable" && (
                      <span className="text-[10px] text-white/30 font-bold">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
