"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LiveHostGrid, { HostParticipant } from "@/components/africa-awards/live/LiveHostGrid";
import LiveHostControls from "@/components/africa-awards/live/LiveHostControls";
import LiveHostPreviewPip from "@/components/africa-awards/live/LiveHostPreviewPip";
import {
  LiveRealtimeSession,
  LiveMessageItem,
  RankingCandidate,
} from "@/components/africa-awards/live/LiveRealtimeEngine";

export default function HostLiveStudioPage() {
  const params = useParams();
  const id = params.id as string; // competition id or session id

  const [isLive, setIsLive] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [participants, setParticipants] = useState<HostParticipant[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [spectators, setSpectators] = useState(142);
  const [potAmount, setPotAmount] = useState(250000);
  const [totalVotes, setTotalVotes] = useState(18950);
  const [commentsPerMin, setCommentsPerMin] = useState(24);
  const [messages, setMessages] = useState<LiveMessageItem[]>([]);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [showOverlayStats, setShowOverlayStats] = useState(true);
  const [modAlertNotice, setModAlertNotice] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const realtimeRef = useRef<LiveRealtimeSession | null>(null);

  // 1. Chargement des données de compétition et candidats
  const loadData = async () => {
    try {
      const [compRes, candRes, liveRes] = await Promise.all([
        fetch(`/api/awards/competitions?id=${id}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/awards/candidates?competition_id=${id}`).then((r) => r.json()).catch(() => ({})),
        fetch(`/api/awards/live?competition_id=${id}`).then((r) => r.json()).catch(() => ({})),
      ]);

      if (compRes.competition) setCompetition(compRes.competition);
      if (candRes.candidates) setCandidates(candRes.candidates);

      if (liveRes.session) {
        setSession(liveRes.session);
        setIsLive(liveRes.session.status === "live");
      }

      if (liveRes.events && Array.isArray(liveRes.events)) {
        const msgs = liveRes.events
          .filter((e: any) => e.event_type === "comment")
          .map((e: any) => ({
            id: e.id,
            user: e.payload?.user_name || "Spectateur",
            text: e.payload?.content || "",
            time: new Date(e.created_at).toLocaleTimeString().slice(0, 5),
          }));
        if (msgs.length > 0) setMessages(msgs);
      }
    } catch (e) {
      console.warn("Erreur chargement régie animateur", e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // 2. Initialisation des participants sur scène
  useEffect(() => {
    if (candidates.length > 0 && participants.length === 0) {
      const initialParts: HostParticipant[] = [
        {
          id: "host_01",
          name: "Moi (Animateur)",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
          role: "host",
          state: "on_stage",
          micMuted: false,
          camMuted: false,
          isSpeaker: true,
        },
        ...candidates.slice(0, 3).map((c, i) => ({
          id: c.id,
          name: c.display_name,
          avatar: c.photo_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200",
          role: "candidate" as const,
          state: i < 2 ? ("on_stage" as const) : ("waiting" as const),
          micMuted: false,
          camMuted: false,
          votes: c.votes || 0,
        })),
      ];
      setParticipants(initialParts);
      setActiveSpeakerId("host_01");
    }
  }, [candidates]);

  // 3. Synchronisation Realtime de la régie
  useEffect(() => {
    if (session?.id && !realtimeRef.current) {
      const rt = new LiveRealtimeSession(session.id);
      rt.connect((count) => setSpectators(count + 120));

      rt.on("comment", (payload) => {
        const newM: LiveMessageItem = {
          id: payload.id || String(Date.now()),
          user: payload.user_name || "Spectateur",
          text: payload.content || "",
          time: new Date().toLocaleTimeString().slice(0, 5),
        };
        setMessages((prev) => [...prev.slice(-30), newM]);
        setCommentsPerMin((c) => Math.min(120, c + 1));
      });

      rt.on("gift", (payload) => {
        setPotAmount((p) => p + Number(payload.amount_xof || 100));
        setTotalVotes((v) => v + Number(payload.points || 10));
      });

      // Alerte prioritaire reçue du modérateur !
      rt.on("mod_alert", (payload) => {
        setModAlertNotice(payload.alert_reason || "Intervention requise par le modérateur !");
      });

      realtimeRef.current = rt;
    }

    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
        realtimeRef.current = null;
      }
    };
  }, [session?.id]);

  // Actions Animateur
  const handleToggleLive = async () => {
    const nextAction = isLive ? "end" : "start";
    const res = await fetch("/api/awards/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: nextAction,
        competition_id: competition?.id || id,
        session_id: session?.id,
      }),
    }).then((r) => r.json()).catch(() => ({}));

    if (res.session) {
      setSession(res.session);
      setIsLive(res.session.status === "live");
      setNotice(isLive ? "Le direct est maintenant arrêté." : "Le direct est maintenant en cours !");
    }
  };

  const handleSelectSpeaker = (participantId: string) => {
    setActiveSpeakerId(participantId);
    setParticipants((prev) =>
      prev.map((p) => ({ ...p, isSpeaker: p.id === participantId }))
    );

    if (realtimeRef.current) {
      realtimeRef.current.broadcast("speaker_change", { speaker_id: participantId });
    }
  };

  const handleToggleMic = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, micMuted: !p.micMuted } : p))
    );
  };

  const handleToggleCam = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, camMuted: !p.camMuted } : p))
    );
  };

  const handleRemoveParticipant = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, state: "waiting" } : p))
    );
    if (activeSpeakerId === participantId) {
      setActiveSpeakerId("host_01");
    }
  };

  const handleInviteCandidateOnStage = (candidate: RankingCandidate) => {
    setParticipants((prev) => {
      const exists = prev.find((p) => p.id === candidate.id);
      if (exists) {
        return prev.map((p) => (p.id === candidate.id ? { ...p, state: "on_stage" } : p));
      }
      return [
        ...prev,
        {
          id: candidate.id,
          name: candidate.name,
          avatar: candidate.photoUrl,
          role: "candidate",
          state: "on_stage",
          micMuted: false,
          camMuted: false,
          votes: candidate.votes,
        },
      ];
    });
  };

  const handleSendAnnouncement = (text: string) => {
    if (realtimeRef.current) {
      realtimeRef.current.broadcast("announcement", { announcement: text });
    }
    setNotice(`Annonce diffusée à tous les spectateurs : « ${text} »`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePinComment = (messageId: string) => {
    const isAlreadyPinned = pinnedMessageId === messageId;
    const nextPinnedId = isAlreadyPinned ? null : messageId;
    setPinnedMessageId(nextPinnedId);

    if (realtimeRef.current) {
      realtimeRef.current.broadcast("pin_comment", { pinned_comment_id: nextPinnedId || undefined });
    }
  };

  const waitingCandidates: RankingCandidate[] = useMemo(() => {
    const onStageIds = new Set(
      participants.filter((p) => p.state === "on_stage").map((p) => p.id)
    );
    return candidates
      .filter((c) => !onStageIds.has(c.id))
      .map((c, i) => ({
        id: c.id,
        name: c.display_name,
        photoUrl: c.photo_url,
        votes: c.votes || 0,
        pos: i + 1,
        change: "stable",
      }));
  }, [candidates, participants]);

  const activeSpeakerCandidate =
    participants.find((p) => p.id === activeSpeakerId) || participants[0];

  return (
    <div className="min-h-screen bg-[#07070A] text-white p-3 sm:p-6 select-none font-sans">
      {/* En-tête de la régie animateur */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6B14] p-0.5 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="material-symbols-outlined text-black font-black text-xl">
              podium
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white animate-pulse">
                RÉGIE LIVE
              </span>
              <h1 className="font-serif text-lg sm:text-xl font-bold text-white">
                Studio Animateur — {competition?.title || `Compétition ${id.slice(0, 8)}`}
              </h1>
            </div>
            <p className="text-xs text-[#A8A6A0]">
              Contrôle complet du direct, battle multi-participants et diffusion des annonces.
            </p>
          </div>
        </div>

        {/* Liens rapides vers la vue spectateur et modération */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href={`/africa-awards/competitions/${competition?.slug || id}/live`}
            target="_blank"
            className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 border border-white/15 text-white/90 transition"
          >
            <span className="material-symbols-outlined text-[15px] text-[#F4D976]">
              open_in_new
            </span>
            <span>Vue Spectateur</span>
          </Link>
          <Link
            href={`/africa-awards/competitions/${competition?.slug || id}/moderate`}
            target="_blank"
            className="flex items-center gap-1 rounded-full bg-red-950/60 hover:bg-red-900 border border-red-500/30 px-3.5 py-1.5 text-red-300 transition"
          >
            <span className="material-symbols-outlined text-[15px]">shield</span>
            <span>Console Modérateur</span>
          </Link>
        </div>
      </header>

      {/* BANNIÈRE D'ALERTE MODÉRATEUR PRIORITAIRE (SI DÉCLENCHÉE) */}
      {modAlertNotice && (
        <div className="mt-4 rounded-2xl border-2 border-red-500 bg-red-950/80 p-4 shadow-[0_0_30px_rgba(220,38,38,0.7)] flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-red-400 animate-bounce">
              warning
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-300">
                Alerte Urgente du Modérateur
              </p>
              <p className="text-sm font-bold text-white">{modAlertNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModAlertNotice(null)}
            className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold text-white"
          >
            Acquitter
          </button>
        </div>
      )}

      {/* Message de notification statut régie */}
      {notice && (
        <div className="mt-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 p-3 text-xs text-[#F4D976] font-bold">
          {notice}
        </div>
      )}

      {/* ===================================================================
          LAYOUT PRINCIPAL RÉGIE : SCÈNE BATTLE + CONTRÔLES + PANNEAU LATÉRAL
          =================================================================== */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* COLONNE GAUCHE : BATTLE GRID & CONTRÔLES RÉGIE */}
        <div className="space-y-5">
          {/* 1. GRILLE BATTLE MULTI-PARTICIPANTS */}
          <div className="rounded-3xl border border-white/15 bg-[#0D0D14] p-4 sm:p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F4D976] text-xl">
                  grid_view
                </span>
                <h2 className="font-bold text-sm text-white">
                  Scène Multi-Participants (Battle Mode)
                </h2>
              </div>
              <span className="text-[11px] text-[#A8A6A0]">
                Cliquez sur un participant pour lui attribuer la parole
              </span>
            </div>

            <LiveHostGrid
              participants={participants}
              activeSpeakerId={activeSpeakerId}
              onSelectSpeaker={handleSelectSpeaker}
              onToggleMic={handleToggleMic}
              onToggleCam={handleToggleCam}
              onRemoveParticipant={handleRemoveParticipant}
            />
          </div>

          {/* 2. BARRE DE CONTRÔLE RÉGIE PROFESSIONNELLE */}
          <LiveHostControls
            isLive={isLive}
            onToggleLive={handleToggleLive}
            waitingCandidates={waitingCandidates}
            onInviteCandidate={handleInviteCandidateOnStage}
            onInviteViewer={(viewer) => {
              alert(`Invitation envoyée au spectateur : ${viewer}`);
            }}
            onSendAnnouncement={handleSendAnnouncement}
            showOverlayStats={showOverlayStats}
            onToggleOverlayStats={() => setShowOverlayStats(!showOverlayStats)}
          />

          {/* 3. TABLEAU DE BORD DE STATISTIQUES DU DIRECT EN TEMPS RÉEL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-white/15 bg-gradient-to-br from-[#0E1528] to-[#07070A] p-4 shadow-xl">
            {/* Spectateurs */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-3">
              <div className="flex items-center gap-1 text-[11px] text-red-400 font-bold uppercase">
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                <span>Spectateurs</span>
              </div>
              <div className="mt-1 text-2xl font-black font-mono text-white">
                {spectators}
              </div>
              <div className="text-[10px] text-green-400 font-bold">En direct</div>
            </div>

            {/* Votes cumulés */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-3">
              <div className="flex items-center gap-1 text-[11px] text-[#F4D976] font-bold uppercase">
                <span className="material-symbols-outlined text-[14px]">how_to_vote</span>
                <span>Votes en cours</span>
              </div>
              <div className="mt-1 text-2xl font-black font-mono text-[#F4D976]">
                {totalVotes.toLocaleString("fr-FR")}
              </div>
              <div className="text-[10px] text-white/50">Certifiés Moneroo</div>
            </div>

            {/* Cagnotte */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-3">
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold uppercase">
                <span className="text-[14px]">🏆</span>
                <span>Cagnotte</span>
              </div>
              <div className="mt-1 text-2xl font-black font-mono text-emerald-400">
                {potAmount.toLocaleString("fr-FR")} F
              </div>
              <div className="text-[10px] text-white/50">Grand prix affiché</div>
            </div>

            {/* Rythme commentaires/min */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-3">
              <div className="flex items-center gap-1 text-[11px] text-blue-400 font-bold uppercase">
                <span className="material-symbols-outlined text-[14px]">speed</span>
                <span>Cadence chat</span>
              </div>
              <div className="mt-1 text-2xl font-black font-mono text-white">
                {commentsPerMin}/min
              </div>
              <div className="text-[10px] text-white/50">Interactions public</div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : RETOUR PIP SPECTATEUR + CHAT AVEC ÉPINGLAGE */}
        <div className="space-y-5">
          {/* 1. MINI-PREVIEW RETOUR SPECTATEUR (PiP) */}
          <LiveHostPreviewPip
            competitionTitle={competition?.title || "Compétition"}
            activeSpeakerCandidate={activeSpeakerCandidate as any}
            spectators={spectators}
            potAmountXof={potAmount}
          />

          {/* 2. FLUX COMMENTAIRES AVEC FONCTION ÉPINGLER */}
          <div className="rounded-3xl border border-white/15 bg-[#0D0D14] p-4 shadow-xl flex flex-col h-[460px]">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-bold uppercase tracking-wider text-white/80">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#F4D976]">
                  forum
                </span>
                <span>Chat Spectateurs ({messages.length})</span>
              </div>
              <span className="text-[10px] text-[#D4AF37]">Cliquez sur 📌 pour épingler</span>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1">
              {messages.map((msg) => {
                const isPinned = pinnedMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-2.5 text-xs transition border ${
                      isPinned
                        ? "bg-[#D4AF37]/25 border-[#F4D976] shadow-[0_0_12px_rgba(212,175,55,0.3)]"
                        : "bg-black/50 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F4D976]">{msg.user}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40">{msg.time}</span>
                        <button
                          type="button"
                          onClick={() => handlePinComment(msg.id)}
                          title={isPinned ? "Désépingler ce commentaire" : "Épingler en haut du chat public"}
                          className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                            isPinned
                              ? "bg-[#D4AF37] text-black font-black"
                              : "bg-white/10 hover:bg-white/20 text-white/70"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            push_pin
                          </span>
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-white/95 leading-relaxed">{msg.text}</p>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <p className="text-center text-xs text-[#A8A6A0] py-16">
                  En attente des premiers commentaires de spectateurs...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
