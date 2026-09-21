"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface LiveTopBarProps {
  competitionTitle: string;
  competitionLogo?: string;
  spectators: number;
  potAmountXof: number;
  startedAt?: string | null;
  onClose?: () => void;
  closeHref?: string;
}

export default function LiveTopBar({
  competitionTitle,
  competitionLogo,
  spectators,
  potAmountXof,
  startedAt,
  onClose,
  closeHref = "/africa-awards/competitions",
}: LiveTopBarProps) {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - start) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      if (hours > 0) {
        setElapsed(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      } else {
        setElapsed(
          `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-md border-b border-white/10">
      {/* Gauche: Logo + Nom compétition */}
      <div className="flex items-center gap-2.5 max-w-[42%] sm:max-w-[48%] truncate">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F4D976] via-[#D4AF37] to-[#8C6B14] p-0.5 shadow-[0_0_12px_rgba(212,175,55,0.4)]">
          {competitionLogo ? (
            <img
              src={competitionLogo}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0B0B0F] text-[11px] font-black text-[#F4D976]">
              AA
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600 border border-black"></span>
          </span>
        </div>
        <div className="truncate">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              LIVE
            </span>
            <span className="truncate text-xs font-bold text-white/95 sm:text-sm drop-shadow-sm">
              {competitionTitle}
            </span>
          </div>
          <span className="text-[10px] text-[#D4AF37]/90 font-medium tracking-wide">
            Cérémonie officielle
          </span>
        </div>
      </div>

      {/* Centre/Droite: Compteur spectateurs, Chrono, Cagnotte dorée */}
      <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
        {/* Compteur spectateurs avec œil */}
        <div className="flex items-center gap-1 rounded-full bg-black/50 border border-white/15 px-2.5 py-1 text-white/90 backdrop-blur shadow-sm">
          <span className="material-symbols-outlined text-[15px] text-red-400 animate-pulse">
            visibility
          </span>
          <span className="font-bold tracking-tight">
            {spectators > 999 ? `${(spectators / 1000).toFixed(1)}k` : spectators}
          </span>
        </div>

        {/* Chrono */}
        <div className="hidden xs:flex items-center gap-1 rounded-full bg-black/50 border border-white/15 px-2.5 py-1 text-white/80 backdrop-blur font-mono font-semibold">
          <span className="material-symbols-outlined text-[14px] text-[#D4AF37]">
            schedule
          </span>
          <span>{elapsed}</span>
        </div>

        {/* Cagnotte dorée avec trophée */}
        <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D4AF37]/25 via-[#F4D976]/20 to-[#D4AF37]/25 border border-[#D4AF37]/50 px-3 py-1 text-[#F4D976] shadow-[0_0_15px_rgba(212,175,55,0.25)] backdrop-blur">
          <span className="text-[14px]">🏆</span>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1 leading-none">
            <span className="text-[9px] uppercase tracking-wider text-[#D4AF37]/80 font-bold hidden sm:inline">
              Cagnotte:
            </span>
            <span className="font-black tracking-tight text-xs sm:text-sm">
              {potAmountXof.toLocaleString("fr-FR")} F
            </span>
          </div>
        </div>

        {/* Bouton Quitter */}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le direct"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : (
          <Link
            href={closeHref}
            aria-label="Fermer le direct"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition active:scale-95 ml-1"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </Link>
        )}
      </div>
    </header>
  );
}
