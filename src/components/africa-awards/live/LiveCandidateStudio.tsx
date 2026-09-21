"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LiveMessageItem } from "./LiveRealtimeEngine";

export interface CandidateLiveProfile {
  id: string;
  name: string;
  photoUrl?: string;
  category?: string;
  competitionTitle: string;
  competitionSlug: string;
  votes: number;
  points: number;
  giftsCount: number;
  donationsAmountXof: number;
  currentRank: number;
  rankChange: "up" | "down" | "stable";
}

interface LiveCandidateStudioProps {
  candidate: CandidateLiveProfile;
  isOnStage: boolean;
  onToggleRequestStage: () => void;
  spectatorCount: number;
  messages: LiveMessageItem[];
  hostDirective?: string | null;
  onSendReaction?: (emoji: string) => void;
}

export default function LiveCandidateStudio({
  candidate,
  isOnStage,
  onToggleRequestStage,
  spectatorCount,
  messages,
  hostDirective,
  onSendReaction,
}: LiveCandidateStudioProps) {
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialisation de la caméra locale selfie
  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Camera inaccessible ou non autorisée, utilisation du flux photo.", err);
        setCameraError("Caméra non détectée ou permission refusée (mode photo actif).");
      }
    }

    if (!cameraOff) {
      setupCamera();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraOff]);

  // Chronomètre de temps de parole quand le candidat est sur scène
  useEffect(() => {
    let timer: any = null;
    if (isOnStage) {
      timer = setInterval(() => setSpeakingTime((prev) => prev + 1), 1000);
    } else {
      setSpeakingTime(0);
    }
    return () => clearInterval(timer);
  }, [isOnStage]);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => (t.enabled = micMuted));
    }
    setMicMuted(!micMuted);
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    }
    setCameraOff(!cameraOff);
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative h-[100dvh] w-full max-w-[480px] mx-auto overflow-hidden bg-black text-white selection:bg-[#D4AF37] selection:text-black">
      {/* 1. FLUX VIDÉO RETOUR SELFIE DU CANDIDAT */}
      <div className="absolute inset-0">
        {!cameraOff && !cameraError ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover -scale-x-100"
          />
        ) : (
          <div className="relative h-full w-full">
            {candidate.photoUrl ? (
              <img
                src={candidate.photoUrl}
                alt=""
                className="h-full w-full object-cover filter brightness-75"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#1E1B4B] via-[#0B0B0F] to-black">
                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#D4AF37]/20 border-2 border-[#F4D976] text-3xl font-black text-[#F4D976]">
                    {candidate.name.slice(0, 2).toUpperCase()}
                  </div>
                  <p className="mt-3 font-bold text-sm text-white/80">Flux caméra inactif</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Halo doré si le candidat est EN DIRECT SUR SCÈNE */}
        {isOnStage && (
          <div className="pointer-events-none absolute inset-0 border-4 border-[#F4D976] shadow-[inset_0_0_50px_rgba(212,175,55,0.6)] animate-pulse z-10" />
        )}
      </div>

      {/* 2. EN-TÊTE DU STUDIO CANDIDAT */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/85 via-black/40 to-transparent backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Badge statut direct */}
          {isOnStage ? (
            <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">
                EN DIRECT • {formatSec(speakingTime)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                En coulisses
              </span>
            </div>
          )}

          {/* Compteur spectateurs */}
          <div className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white/90 border border-white/10">
            <span className="material-symbols-outlined text-[14px] text-red-400">
              visibility
            </span>
            <span>{spectatorCount}</span>
          </div>
        </div>

        {/* Lien retour dashboard */}
        <Link
          href="/africa-awards/candidate/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          title="Quitter le studio candidat"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </Link>
      </header>

      {/* 3. TICKET DIRECTIVE DE L'ANIMATEUR (SI PRÉSENTE) */}
      {hostDirective && (
        <div className="absolute top-16 inset-x-3 z-30 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-500 bg-black/90 p-3 text-xs text-amber-200 shadow-xl backdrop-blur-md">
            <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0">
              campaign
            </span>
            <div className="leading-tight">
              <strong className="text-[#F4D976] uppercase text-[9px] block">
                Consigne de la régie animateur :
              </strong>
              <span>{hostDirective}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. HUD PERSONNEL EN DIRECT : STATISTIQUES PERSONNELLES */}
      <div className="absolute top-28 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        {/* Mon Rang */}
        <div className="flex items-center gap-2 rounded-2xl bg-black/70 border border-[#D4AF37]/50 p-2 text-xs backdrop-blur-md shadow-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D4AF37] text-black font-black text-xs">
            #{candidate.currentRank}
          </div>
          <div>
            <div className="text-[9px] font-black uppercase tracking-wider text-[#F4D976]">
              Mon Rang Actuel
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-white">
              <span>{candidate.votes.toLocaleString("fr-FR")} votes</span>
              {candidate.rankChange === "up" && (
                <span className="text-green-400 text-xs font-black">↑</span>
              )}
              {candidate.rankChange === "down" && (
                <span className="text-red-400 text-xs font-black">↓</span>
              )}
            </div>
          </div>
        </div>

        {/* Mes Cadeaux & Dons Reçus */}
        <div className="flex items-center gap-3 rounded-2xl bg-black/70 border border-white/15 p-2 text-xs backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1">
            <span>🎁</span>
            <span className="font-bold text-[#F4D976]">
              {candidate.giftsCount}
            </span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1">
            <span>🪙</span>
            <span className="font-bold text-emerald-400">
              {candidate.donationsAmountXof.toLocaleString("fr-FR")} F
            </span>
          </div>
        </div>
      </div>

      {/* 5. FLUX CHAT DES ENCOURAGEMENTS */}
      <div className="absolute bottom-24 left-3 right-20 z-20 pointer-events-auto">
        <div
          className="max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-none"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 20%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 20%, black 100%)",
          }}
        >
          {messages.slice(-15).map((m) => (
            <div
              key={m.id}
              className={`rounded-xl px-2.5 py-1 text-xs backdrop-blur-md inline-block max-w-full ${
                m.isGift
                  ? "bg-[#D4AF37]/30 border border-[#F4D976]/40 text-[#F4D976]"
                  : "bg-black/60 border border-white/10 text-white"
              }`}
            >
              <strong className="text-[#F4D976] mr-1">{m.user}:</strong>
              <span>{m.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. COLONNE RÉACTIONS CANDIDAT À DROITE */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col gap-2.5 items-center">
        {["❤️", "🙏", "🔥", "👑"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSendReaction && onSendReaction(emoji)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-lg transition transform hover:scale-125 active:scale-95 shadow-md"
            title={`Envoyer ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* 7. BARRE INFÉRIEURE : CONTRÔLES MICRO/CAMÉRA & ACTION MONTER SUR SCÈNE */}
      <footer className="absolute bottom-0 inset-x-0 z-30 p-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-3">
        {/* Contrôles Microphone & Caméra */}
        <div className="flex items-center gap-2">
          {/* Micro */}
          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 shadow-lg ${
              micMuted
                ? "bg-red-600 border-red-500 text-white"
                : "bg-white/15 border-white/25 text-white hover:bg-white/25"
            }`}
            title={micMuted ? "Activer mon micro" : "Couper mon micro"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {micMuted ? "mic_off" : "mic"}
            </span>
          </button>

          {/* Caméra */}
          <button
            type="button"
            onClick={toggleCam}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 shadow-lg ${
              cameraOff
                ? "bg-red-600 border-red-500 text-white"
                : "bg-white/15 border-white/25 text-white hover:bg-white/25"
            }`}
            title={cameraOff ? "Activer ma caméra" : "Couper ma caméra"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {cameraOff ? "videocam_off" : "videocam"}
            </span>
          </button>
        </div>

        {/* Bouton d'action Scène : Demander à monter / Quitter */}
        <button
          type="button"
          onClick={onToggleRequestStage}
          className={`flex-1 h-12 rounded-full px-5 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-2xl transition active:scale-95 ${
            isOnStage
              ? "bg-white/15 hover:bg-white/25 border border-white/30 text-white"
              : "bg-gradient-to-r from-[#F4D976] via-[#D4AF37] to-[#AA7C11] text-black shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:brightness-110"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isOnStage ? "logout" : "podium"}
          </span>
          <span>
            {isOnStage ? "Quitter la scène" : "Demander à monter sur scène"}
          </span>
        </button>
      </footer>
    </div>
  );
}
