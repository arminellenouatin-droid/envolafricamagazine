"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { AgoraLive } from "@/lib/live/agora/client/useAgoraLive";

type Props = {
  live: AgoraLive;
  /** UID de la vidéo principale (ex. l'animateur). Par défaut : le 1er participant qui publie. */
  mainUid?: number;
  className?: string;
  /** Tes overlays existants (votes, cadeaux, classement, chat…) : ils s'affichent PAR-DESSUS la vidéo. */
  children?: ReactNode;
};

function RemoteTile({ live, uid, className }: { live: AgoraLive; uid: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const user = live.participants.find((p) => p.uid === uid);
  const hasVideo = user?.hasVideo ?? false;
  useEffect(() => {
    if (ref.current && hasVideo) live.attachRemote(uid, ref.current);
  }, [live, uid, hasVideo]);
  return <div ref={ref} className={className} data-agora-uid={uid} />;
}

function LocalTile({ live, className }: { live: AgoraLive; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && live.status === "live") live.attachLocal(ref.current);
  }, [live, live.status]);
  return <div ref={ref} className={className} />;
}

/**
 * Remplace UNIQUEMENT la zone vidéo de tes écrans. Aucun style imposé : il remplit son parent
 * (donne-lui `position: relative` + une taille, comme ton lecteur actuel).
 */
export function AgoraStage({ live, mainUid, className, children }: Props) {
  const publishers = live.participants.filter((p) => p.hasVideo);
  const main = mainUid ?? publishers[0]?.uid;
  const others = publishers.filter((p) => p.uid !== main);

  return (
    <div className={className ?? "relative h-full w-full overflow-hidden bg-black"}>
      {/* Animateur / candidat qui publie : on se voit soi-même */}
      {live.isPublisher ? (
        <LocalTile live={live} className="absolute inset-0" />
      ) : main !== undefined ? (
        <RemoteTile live={live} uid={main} className="absolute inset-0" />
      ) : null}

      {/* Candidats sur scène : petites vignettes (flux basse qualité automatiquement) */}
      {others.length > 0 && (
        <div className="absolute right-2 top-2 z-10 flex max-h-[60%] flex-col gap-2 overflow-hidden">
          {others.slice(0, 4).map((p) => (
            <RemoteTile key={p.uid} live={live} uid={p.uid} className="h-24 w-16 overflow-hidden rounded-lg bg-black/60" />
          ))}
        </div>
      )}

      {live.status === "connecting" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-sm text-white">
          Connexion au direct…
        </div>
      )}
      {live.status === "reconnecting" && (
        <div className="absolute inset-x-0 top-0 z-20 bg-amber-500/90 py-1 text-center text-xs font-medium text-black">
          Connexion instable — reconnexion en cours…
        </div>
      )}
      {live.status === "ended" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 text-sm text-white">
          Le direct est terminé.
        </div>
      )}
      {live.status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center text-sm text-white">
          <span>Impossible de rejoindre le direct.</span>
          <button onClick={() => void live.join()} className="rounded-full bg-white px-4 py-2 font-medium text-black">
            Réessayer
          </button>
        </div>
      )}
      {live.autoplayBlocked && (
        <button
          onClick={live.resumeAudio}
          className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-lg"
        >
          🔊 Activer le son
        </button>
      )}

      {/* Tes écrans existants (votes, cadeaux, classement, chat) se posent ici, par-dessus la vidéo */}
      {children}
    </div>
  );
}
