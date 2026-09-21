"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LiveCandidateStudio, {
  CandidateLiveProfile,
} from "@/components/africa-awards/live/LiveCandidateStudio";
import {
  LiveRealtimeSession,
  LiveMessageItem,
} from "@/components/africa-awards/live/LiveRealtimeEngine";

export default function CandidateLivePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [candidate, setCandidate] = useState<CandidateLiveProfile>({
    id: id || "cand-1",
    name: "Aminata Traoré",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
    category: "Entrepreneuriat & Innovation Tech",
    competitionTitle: "Africa Awards 2026 — Édition Célébration",
    competitionSlug: "africa-awards-2026",
    votes: 4890,
    points: 12450,
    giftsCount: 48,
    donationsAmountXof: 245000,
    currentRank: 2,
    rankChange: "up",
  });

  const [isOnStage, setIsOnStage] = useState(false);
  const [spectatorCount, setSpectatorCount] = useState(142);
  const [hostDirective, setHostDirective] = useState<string | null>(
    "Soyez prête : la régie vous donne la parole pour votre pitch de 60 secondes !"
  );
  const [messages, setMessages] = useState<LiveMessageItem[]>([
    {
      id: "cand-msg-1",
      user: "Bakary Samaké",
      text: "Courage Aminata, toute la diaspora est fière de toi ! 🔥",
      time: "14:24",
    },
    {
      id: "cand-msg-2",
      user: "Fatou Diop",
      text: "Ton application va transformer l'agriculture en Afrique de l'Ouest ! 👑",
      time: "14:25",
    },
    {
      id: "cand-msg-3",
      user: "Marc G.",
      text: "a envoyé 💎 Diamant d’Or pour soutenir ta victoire !",
      time: "14:26",
      isGift: true,
      giftIcon: "💎",
      giftName: "Diamant d’Or",
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const realtimeRef = useRef<LiveRealtimeSession | null>(null);

  // 1. Tenter de charger les données réelles du candidat si disponibles
  useEffect(() => {
    let active = true;

    async function loadCandidate() {
      try {
        const res = await fetch(`/api/awards/candidates?id=${encodeURIComponent(id)}`).then((r) =>
          r.json()
        );
        if (active && res?.candidate) {
          const c = res.candidate;
          setCandidate((prev) => ({
            ...prev,
            id: c.id,
            name: c.name || prev.name,
            photoUrl: c.photo_url || prev.photoUrl,
            category: c.category_name || prev.category,
            votes: c.votes_count ?? prev.votes,
            points: c.points ?? prev.points,
            currentRank: c.rank ?? prev.currentRank,
          }));
        }
      } catch {
        // Mode autonome
      }
    }

    loadCandidate();
    return () => {
      active = false;
    };
  }, [id]);

  // 2. Connexion Realtime WebSocket pour recevoir les directives et les cadeaux
  useEffect(() => {
    const sessionId = candidate.competitionSlug ? `cand_session_${candidate.competitionSlug}` : `cand_session_live`;
    const rt = new LiveRealtimeSession(sessionId);
    realtimeRef.current = rt;

    rt.connect((count) => {
      setSpectatorCount((prev) => Math.max(prev, count + 120));
    });

    // Écoute des commentaires / encouragements
    rt.on("comment", (payload) => {
      const newMsg: LiveMessageItem = {
        id: payload.id || String(Date.now() + Math.random()),
        user: payload.user_name || "Supporter",
        userId: payload.user_id,
        text: payload.content || "",
        time: new Date().toLocaleTimeString().slice(0, 5),
      };
      setMessages((prev) => [...prev.slice(-30), newMsg]);
    });

    // Écoute des cadeaux
    rt.on("gift", (payload) => {
      const isForMe =
        !payload.candidate_name ||
        payload.candidate_name.toLowerCase().includes(candidate.name.toLowerCase());

      if (isForMe) {
        const amount = Number(payload.amount_xof || 500);
        setCandidate((prev) => ({
          ...prev,
          giftsCount: prev.giftsCount + 1,
          donationsAmountXof: prev.donationsAmountXof + amount,
          points: prev.points + Math.round(amount / 10),
        }));

        setToastMessage(`🎁 Nouveau cadeau reçu : ${payload.gift_name || "Cadeau"} de ${payload.user_name || "un supporter"} !`);
        setTimeout(() => setToastMessage(null), 4000);
      }

      const giftMsg: LiveMessageItem = {
        id: String(Date.now()),
        user: payload.user_name || "Supporter",
        text: `a offert ${payload.gift_icon || "🎁"} ${payload.gift_name} à ${payload.candidate_name || candidate.name}`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        isGift: true,
        giftIcon: payload.gift_icon,
        giftName: payload.gift_name,
      };
      setMessages((prev) => [...prev.slice(-30), giftMsg]);
    });

    // Écoute des directives / annonces de la régie
    rt.on("announcement", (payload) => {
      if (payload.text) {
        setHostDirective(`DIRECTIVE RÉGIE : ${payload.text}`);
        setToastMessage(`📢 Nouvelle directive de l'animateur`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    });

    // Écoute de l'attribution de la parole par la régie
    rt.on("speaker_change", (payload) => {
      if (payload.speaker_id === candidate.id) {
        setIsOnStage(true);
        setToastMessage("🎤 L'animateur vous a donné la parole ! Vous êtes en direct sur scène !");
        setTimeout(() => setToastMessage(null), 5000);
      }
    });

    return () => {
      rt.disconnect();
    };
  }, [candidate.competitionSlug, candidate.id, candidate.name]);

  // Basculer la demande de montée sur scène
  const handleToggleRequestStage = () => {
    const nextState = !isOnStage;
    setIsOnStage(nextState);

    if (nextState) {
      setToastMessage("Demande envoyée à la régie — Vous montez sur scène !");
      if (realtimeRef.current) {
        realtimeRef.current.sendCandidateStageRequest({
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          status: "wants_stage",
        });
      }
    } else {
      setToastMessage("Vous êtes retourné dans votre loge virtuelle.");
      if (realtimeRef.current) {
        realtimeRef.current.sendCandidateStageRequest({
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          status: "left_stage",
        });
      }
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Réaction rapide du candidat
  const handleSendReaction = (emoji: string) => {
    if (realtimeRef.current) {
      realtimeRef.current.sendReaction();
    }
    setToastMessage(`Réaction ${emoji} envoyée au public !`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#07070A] text-white flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#D4AF37] text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Studio Candidat */}
      <div className="bg-[#0D0E15] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/africa-awards/candidate/dashboard"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
            title="Retour au dashboard"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-bold uppercase tracking-wider">
                Studio Candidat Direct
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-xs text-white/80 font-semibold">{candidate.name}</span>
            </div>
            <p className="text-[11px] text-white/40 truncate max-w-[220px] sm:max-w-md">
              {candidate.competitionTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/africa-awards/competitions/${candidate.competitionSlug}/live`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition"
          >
            <span>📱</span>
            <span>Voir le Live Public</span>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>DIRECT</span>
          </div>
        </div>
      </div>

      {/* Studio Selfie Candidat avec caméra et HUD interactif */}
      <div className="flex-1 flex flex-col justify-center items-center p-3 sm:p-5">
        <div className="w-full max-w-md">
          <LiveCandidateStudio
            candidate={candidate}
            isOnStage={isOnStage}
            onToggleRequestStage={handleToggleRequestStage}
            spectatorCount={spectatorCount}
            messages={messages}
            hostDirective={hostDirective}
            onSendReaction={handleSendReaction}
          />
        </div>
      </div>
    </div>
  );
}
