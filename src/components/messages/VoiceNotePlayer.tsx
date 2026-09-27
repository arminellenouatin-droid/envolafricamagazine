"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceNotePlayerProps {
  url: string;
  duration?: number;
  isMe?: boolean;
}

export default function VoiceNotePlayer({ url, duration = 0, isMe = false }: VoiceNotePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  // Générer des barres de forme d'onde déterministes basées sur l'URL
  const bars = useRef<number[]>(
    Array.from({ length: 26 }, (_, i) => {
      const code = (url.charCodeAt(i % url.length) || 40) + i * 7;
      return 20 + (code % 70); // hauteur en pourcentage (20% à 90%)
    })
  ).current;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * totalDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatSecs = (secs: number) => {
    const s = Math.floor(secs || 0);
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const progressRatio = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
  const activeBarIndex = Math.floor(progressRatio * bars.length);

  return (
    <div className="flex items-center gap-3 py-1 min-w-[210px] max-w-[300px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Bouton Play / Pause rond */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Mettre en pause" : "Écouter la note vocale"}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isMe
            ? "bg-[#00a884] hover:bg-[#009374] text-white"
            : "bg-[#006874] hover:bg-[#00545e] text-white"
        }`}
      >
        <span className="material-symbols-outlined text-2xl font-bold">
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>

      {/* Forme d'onde et durée */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        {/* Barres d'onde interactives */}
        <div
          onClick={handleSeek}
          className="flex items-center gap-[2.5px] h-7 cursor-pointer px-0.5 select-none"
          title="Avancer dans l'audio"
        >
          {bars.map((height, idx) => {
            const isPlayed = idx <= activeBarIndex;
            return (
              <span
                key={idx}
                style={{ height: `${height}%` }}
                className={`w-[3px] rounded-full transition-colors ${
                  isPlayed
                    ? isMe
                      ? "bg-[#00a884]"
                      : "bg-[#006874]"
                    : isMe
                    ? "bg-[#00a884]/35"
                    : "bg-gray-300"
                }`}
              />
            );
          })}
        </div>

        {/* Temps et Sélecteur de vitesse */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
          <span>{formatSecs(currentTime > 0 ? currentTime : totalDuration)}</span>

          <button
            type="button"
            onClick={cycleSpeed}
            aria-label={`Vitesse de lecture ${playbackRate}x`}
            className="px-1.5 py-0.5 rounded-full bg-black/5 hover:bg-black/10 font-sans font-bold text-[9px] text-gray-700 transition"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
