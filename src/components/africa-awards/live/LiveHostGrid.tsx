"use client";
import React from "react";

export interface HostParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: "host" | "candidate" | "viewer";
  isSpeaker?: boolean;
  micMuted?: boolean;
  camMuted?: boolean;
  state: "on_stage" | "waiting" | "removed";
  votes?: number;
}

interface LiveHostGridProps {
  participants: HostParticipant[];
  activeSpeakerId: string | null;
  onSelectSpeaker: (id: string) => void;
  onToggleMic: (id: string) => void;
  onToggleCam: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
}

export default function LiveHostGrid({
  participants,
  activeSpeakerId,
  onSelectSpeaker,
  onToggleMic,
  onToggleCam,
  onRemoveParticipant,
}: LiveHostGridProps) {
  const onStageParticipants = participants.filter((p) => p.state === "on_stage");

  return (
    <section aria-label="Scène Battle Multi-Participants" className="w-full">
      {/* Grille dynamique selon le nombre de participants sur scène */}
      <div
        className={`grid gap-2 sm:gap-3 ${
          onStageParticipants.length <= 1
            ? "grid-cols-1"
            : onStageParticipants.length === 2
            ? "grid-cols-2"
            : onStageParticipants.length <= 4
            ? "grid-cols-2"
            : "grid-cols-3"
        }`}
      >
        {onStageParticipants.map((p) => {
          const isSpeaker = p.id === activeSpeakerId || p.isSpeaker;

          return (
            <div
              key={p.id}
              className={`relative overflow-hidden rounded-2xl bg-[#0F0F16] transition-all duration-300 ${
                isSpeaker
                  ? "border-2 border-[#F4D976] shadow-[0_0_25px_rgba(212,175,55,0.45)] ring-2 ring-[#D4AF37]/40 ring-offset-2 ring-offset-black scale-[1.01]"
                  : "border border-white/10 opacity-75 grayscale-[35%] hover:opacity-100 hover:grayscale-0"
              }`}
              style={{ minHeight: onStageParticipants.length <= 2 ? "200px" : "140px" }}
            >
              {/* Fond visuel / Vidéo du participant */}
              {p.avatar && !p.camMuted ? (
                <img
                  src={p.avatar}
                  alt=""
                  className="h-full w-full object-cover aspect-[4/3] sm:aspect-video"
                />
              ) : (
                <div className="flex h-full w-full min-h-[140px] items-center justify-center bg-gradient-to-br from-[#1A1A2E] to-[#0A0A10]">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-black text-[#F4D976]">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    {p.camMuted && (
                      <span className="mt-1 text-[10px] text-white/50">Caméra coupée</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tag Statut & Nom en bas */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                  <button
                    type="button"
                    onClick={() => onSelectSpeaker(p.id)}
                    className={`truncate text-xs font-bold ${
                      isSpeaker ? "text-[#F4D976]" : "text-white"
                    } hover:underline`}
                  >
                    {p.name}
                  </button>
                  {p.role === "host" && (
                    <span className="rounded bg-[#1B2A6B] px-1 text-[8px] font-black uppercase tracking-wider text-blue-300">
                      Animateur
                    </span>
                  )}
                  {isSpeaker && (
                    <span className="rounded bg-red-600 px-1 text-[8px] font-black uppercase text-white animate-pulse">
                      PAROLE
                    </span>
                  )}
                </div>

                {/* Micro status icon */}
                <div className="flex items-center gap-1">
                  {p.micMuted ? (
                    <span className="material-symbols-outlined text-[14px] text-red-500 bg-black/60 rounded-full p-0.5">
                      mic_off
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[14px] text-green-400 bg-black/60 rounded-full p-0.5 animate-pulse">
                      mic
                    </span>
                  )}
                </div>
              </div>

              {/* Contrôles d'intervention rapides sur la vignette */}
              <div className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-black/60 backdrop-blur-md rounded-full p-1 border border-white/10">
                {/* Couper micro */}
                <button
                  type="button"
                  onClick={() => onToggleMic(p.id)}
                  title={p.micMuted ? "Rétablir le micro" : "Couper le micro"}
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                    p.micMuted ? "bg-red-600 text-white" : "bg-white/15 text-white/90 hover:bg-white/25"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {p.micMuted ? "mic_off" : "mic"}
                  </span>
                </button>

                {/* Couper caméra */}
                <button
                  type="button"
                  onClick={() => onToggleCam(p.id)}
                  title={p.camMuted ? "Rétablir la caméra" : "Couper la caméra"}
                  className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                    p.camMuted ? "bg-red-600 text-white" : "bg-white/15 text-white/90 hover:bg-white/25"
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {p.camMuted ? "videocam_off" : "videocam"}
                  </span>
                </button>

                {/* Retirer du direct */}
                {p.role !== "host" && (
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.id)}
                    title="Retirer du direct"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-700/80 hover:bg-red-600 text-white transition"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {onStageParticipants.length === 0 && (
          <div className="flex h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-black/40 text-center p-6">
            <span className="material-symbols-outlined text-4xl text-white/30">videocam_off</span>
            <p className="mt-2 text-sm font-bold text-white/80">Aucun candidat sur scène actuellement</p>
            <p className="text-xs text-[#A8A6A0]">Utilisez le bouton « Inviter un candidat » pour le faire monter en direct.</p>
          </div>
        )}
      </div>
    </section>
  );
}
