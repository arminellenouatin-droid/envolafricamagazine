"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgoraLiveEngine, type NetworkQuality, type RemoteParticipant } from "./engine";
import { canPublish, type LiveRole, type RosterEntry, type TokenPayload } from "../roles";

export type LiveStatus = "idle" | "connecting" | "live" | "reconnecting" | "ended" | "error";

type Options = {
  liveId: string;
  /** Rôle souhaité. Le serveur peut refuser (403) si tu n'y as pas droit. Par défaut : spectateur. */
  wantRole?: LiveRole;
  /** Rejoint automatiquement au montage (défaut : true). */
  autoJoin?: boolean;
};

async function requestToken(liveId: string, asRole: LiveRole): Promise<TokenPayload> {
  const res = await fetch("/api/live/agora/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liveId, asRole }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `http_${res.status}`);
  }
  return (await res.json()) as TokenPayload;
}

/**
 * Hook unique à brancher dans tes écrans EXISTANTS (spectateur / animateur / modérateur).
 * Il remplace uniquement la source vidéo ; le reste de l'écran ne change pas.
 */
export function useAgoraLive({ liveId, wantRole = "audience", autoJoin = true }: Options) {
  const [status, setStatus] = useState<LiveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<LiveRole>("audience");
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [network, setNetwork] = useState<NetworkQuality>({ uplink: 0, downlink: 0 });
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [localUid, setLocalUid] = useState<number | null>(null);

  const engineRef = useRef<AgoraLiveEngine | null>(null);
  const joiningRef = useRef(false);
  const wantRoleRef = useRef(wantRole);

  useEffect(() => {
    wantRoleRef.current = wantRole;
  }, [wantRole]);

  const join = useCallback(async () => {
    if (joiningRef.current || engineRef.current) return;
    joiningRef.current = true;
    setStatus("connecting");
    setError(null);
    try {
      const first = await requestToken(liveId, wantRoleRef.current);
      const engine = new AgoraLiveEngine(
        {
          onRemoteChange: setParticipants,
          onConnection: (s) => {
            if (s === "CONNECTED") setStatus("live");
            else if (s === "RECONNECTING") setStatus("reconnecting");
            else if (s === "DISCONNECTED" && engineRef.current) setStatus("ended");
          },
          onNetwork: setNetwork,
          onAutoplayBlocked: () => setAutoplayBlocked(true),
          onError: (code) => setError(code),
        },
        () => requestToken(liveId, wantRoleRef.current),
      );
      engineRef.current = engine;
      setRole(first.role);
      setLocalUid(first.uid);
      await engine.join(first);
      setStatus("live");

      // Correspondance uid ↔ utilisateur (pour afficher le bon candidat / animateur)
      fetch(`/api/live/agora/participants?liveId=${encodeURIComponent(liveId)}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { roster?: RosterEntry[] } | null) => j?.roster && setRoster(j.roster))
        .catch(() => undefined);
    } catch (e) {
      const code = (e as Error).message;
      setError(code);
      setStatus(code === "live_ended" ? "ended" : "error");
      await engineRef.current?.leave().catch(() => undefined);
      engineRef.current = null;
    } finally {
      joiningRef.current = false;
    }
  }, [liveId]);

  const leave = useCallback(async () => {
    const engine = engineRef.current;
    engineRef.current = null;
    await engine?.leave().catch(() => undefined);
    setParticipants([]);
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (autoJoin) void join();
    return () => {
      void leave();
    };
  }, [autoJoin, join, leave]);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    await engineRef.current?.setMic(next);
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    await engineRef.current?.setCam(next);
    setCamOn(next);
  }, [camOn]);

  const switchCamera = useCallback(() => engineRef.current?.switchCamera(), []);
  const attachLocal = useCallback((el: HTMLElement | null) => el && engineRef.current?.playLocal(el), []);
  const attachRemote = useCallback((uid: number, el: HTMLElement | null) => el && engineRef.current?.playRemote(uid, el), []);
  const resumeAudio = useCallback(() => {
    engineRef.current?.resumeAudio();
    setAutoplayBlocked(false);
  }, []);

  return useMemo(
    () => ({
      status, error, role, localUid, isPublisher: canPublish(role),
      participants, roster, network, autoplayBlocked,
      micOn, camOn,
      join, leave, toggleMic, toggleCam, switchCamera,
      attachLocal, attachRemote, resumeAudio,
    }),
    [status, error, role, localUid, participants, roster, network, autoplayBlocked, micOn, camOn,
      join, leave, toggleMic, toggleCam, switchCamera, attachLocal, attachRemote, resumeAudio],
  );
}

export type AgoraLive = ReturnType<typeof useAgoraLive>;
