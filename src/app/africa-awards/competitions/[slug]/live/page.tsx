"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import LiveTopBar from "@/components/africa-awards/live/LiveTopBar";
import LiveFloatingRanking from "@/components/africa-awards/live/LiveFloatingRanking";
import LiveTikTokActions from "@/components/africa-awards/live/LiveTikTokActions";
import LiveGiftDrawer, { VirtualGift } from "@/components/africa-awards/live/LiveGiftDrawer";
import LiveGiftAnimationOverlay, { GiftAnimationItem } from "@/components/africa-awards/live/LiveGiftAnimationOverlay";
import LiveChatOverlay from "@/components/africa-awards/live/LiveChatOverlay";
import {
  LiveRealtimeSession,
  LiveMessageItem,
  RankingCandidate,
} from "@/components/africa-awards/live/LiveRealtimeEngine";

export default function SpectatorLivePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [competition, setCompetition] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [spectators, setSpectators] = useState(142);
  const [potAmount, setPotAmount] = useState(250000);
  const [reactionsCount, setReactionsCount] = useState(1850);
  const [messages, setMessages] = useState<LiveMessageItem[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<LiveMessageItem | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isGiftDrawerOpen, setIsGiftDrawerOpen] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<GiftAnimationItem | null>(null);
  const [isFollowingCandidate, setIsFollowingCandidate] = useState(false);
  const [videoSrcIndex, setVideoSrcIndex] = useState(0);

  const realtimeRef = useRef<LiveRealtimeSession | null>(null);

  // Vidéos de fond immersives de gala & cérémonies
  const STAGE_VIDEOS = useMemo(
    () => [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1080&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1080&q=80",
    ],
    []
  );

  // 1. Chargement initial de la compétition et des candidats
  useEffect(() => {
    let active = true;

    fetch(`/api/awards/competitions?slug=${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setCompetition(d.competition || null);
        if (d.competition) {
          fetch(`/api/awards/candidates?competition_id=${d.competition.id}`)
            .then((r) => r.json())
            .then((cd) => {
              if (active) setCandidates(cd.candidates || []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [slug]);

  // 2. Synchronisation de la session Live & Realtime
  useEffect(() => {
    let active = true;

    const syncLive = async () => {
      const res = await fetch(`/api/awards/live?competition_id=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .catch(() => null);

      if (!active || !res) return;
      setSession(res.session || null);

      if (res.session?.id && !realtimeRef.current) {
        // Connexion Realtime WebSocket
        const rt = new LiveRealtimeSession(res.session.id);
        rt.connect((count) => {
          if (active) setSpectators((prev) => Math.max(prev, count + 120));
        });

        // Écoute des réactions
        rt.on("reaction", () => {
          if (active) setReactionsCount((c) => c + 1);
        });

        // Écoute des commentaires
        rt.on("comment", (payload) => {
          if (!active) return;
          const newMsg: LiveMessageItem = {
            id: payload.id || String(Date.now() + Math.random()),
            user: payload.user_name || "Spectateur",
            userId: payload.user_id,
            text: payload.content || "",
            time: new Date().toLocaleTimeString().slice(0, 5),
          };
          setMessages((prev) => [...prev.slice(-40), newMsg]);
        });

        // Écoute des cadeaux
        rt.on("gift", (payload) => {
          if (!active) return;
          const giftAnim: GiftAnimationItem = {
            id: String(Date.now()),
            senderName: payload.user_name || "Un supporter",
            candidateName: payload.candidate_name || "Son favori",
            giftIcon: payload.gift_icon || "🎁",
            giftName: payload.gift_name || "Cadeau",
            type: "gift",
          };
          setCurrentAnimation(giftAnim);
          setPotAmount((p) => p + Number(payload.amount_xof || 100));

          const giftMsg: LiveMessageItem = {
            id: String(Date.now()),
            user: payload.user_name || "Supporter",
            text: `a offert ${payload.gift_icon || "🎁"} ${payload.gift_name} à ${payload.candidate_name}`,
            time: new Date().toLocaleTimeString().slice(0, 5),
            isGift: true,
            giftIcon: payload.gift_icon,
            giftName: payload.gift_name,
          };
          setMessages((prev) => [...prev.slice(-40), giftMsg]);
        });

        // Écoute des annonces de l'animateur
        rt.on("announcement", (payload) => {
          if (!active) return;
          setCurrentAnimation({
            id: String(Date.now()),
            senderName: "Animateur",
            candidateName: "",
            giftIcon: "📢",
            giftName: "Annonce",
            type: "announcement",
            announcementText: payload.announcement || "Annonce officielle du direct.",
          });
        });

        // Écoute du changement d'orateur
        rt.on("speaker_change", (payload) => {
          if (active && payload.speaker_id) {
            setActiveSpeakerId(payload.speaker_id);
          }
        });

        // Écoute d'épinglage de message
        rt.on("pin_comment", (payload) => {
          if (!active) return;
          if (payload.pinned_comment_id) {
            setMessages((prev) => {
              const target = prev.find((m) => m.id === payload.pinned_comment_id);
              if (target) setPinnedMessage(target);
              return prev;
            });
          } else {
            setPinnedMessage(null);
          }
        });

        realtimeRef.current = rt;
      }

      // Historique des messages déjà présents en base
      if (res.events && Array.isArray(res.events)) {
        const parsedMsgs: LiveMessageItem[] = res.events
          .filter((e: any) => ["comment", "gift", "donation"].includes(e.event_type))
          .map((e: any) => ({
            id: e.id,
            user: e.payload?.user_name || "Participant",
            userId: e.payload?.user_id,
            text: e.payload?.content || (e.event_type === "gift" ? `a offert ${e.payload?.gift_name}` : "a fait un don"),
            time: new Date(e.created_at).toLocaleTimeString().slice(0, 5),
            isGift: e.event_type === "gift",
            giftIcon: e.payload?.gift_icon,
            giftName: e.payload?.gift_name,
            isDonation: e.event_type === "donation",
            amountXof: e.payload?.amount_xof,
          }));

        if (parsedMsgs.length > 0) {
          setMessages((prev) => (prev.length === 0 ? parsedMsgs : prev));
        }

        const potTotal = res.events.reduce(
          (sum: number, e: any) => sum + Number(e.payload?.amount_xof || 0),
          250000
        );
        setPotAmount(potTotal);
      }
    };

    syncLive();
    const timer = setInterval(syncLive, 4000);

    return () => {
      active = false;
      clearInterval(timer);
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
        realtimeRef.current = null;
      }
    };
  }, [slug]);

  // Formatage du Top 5 dynamique
  const rankingList: RankingCandidate[] = useMemo(() => {
    if (!candidates || candidates.length === 0) {
      return [
        { id: "c1", name: "Aminata Traoré", votes: 4820, points: 520, pos: 1, change: "up", isLiveSpeaker: true, photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200" },
        { id: "c2", name: "Kofi Mensah", votes: 4310, points: 410, pos: 2, change: "down", photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200" },
        { id: "c3", name: "Fatou Diop", votes: 3950, points: 380, pos: 3, change: "up", photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200" },
        { id: "c4", name: "Samuel Eto", votes: 3100, points: 290, pos: 4, change: "stable", photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
        { id: "c5", name: "Aïcha Diallo", votes: 2840, points: 250, pos: 5, change: "up", photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200" },
      ];
    }

    return candidates
      .slice(0, 5)
      .map((c: any, i: number) => ({
        id: c.id,
        name: c.display_name || "Candidat",
        photoUrl: c.photo_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200",
        votes: c.votes || 0,
        points: c.votes ? Math.round(c.votes * 1.2) : 100,
        pos: i + 1,
        change: (i === 0 ? "up" : i === 1 ? "stable" : "up") as "up" | "down" | "stable",
        isLiveSpeaker: c.id === activeSpeakerId || i === 0,
      }))
      .sort((a, b) => b.votes - a.votes)
      .map((r, i) => ({ ...r, pos: i + 1 }));
  }, [candidates, activeSpeakerId]);

  const activeSpeaker =
    rankingList.find((c) => c.id === activeSpeakerId || c.isLiveSpeaker) || rankingList[0];

  // Actions utilisateur
  const handleSendReaction = (emoji: string) => {
    setReactionsCount((prev) => prev + 1);
    if (realtimeRef.current) {
      realtimeRef.current.broadcast("reaction", { reaction_type: emoji });
    }
  };

  const handleSendMessage = async (text: string) => {
    const tempId = String(Date.now());
    const newMsg: LiveMessageItem = {
      id: tempId,
      user: "Moi",
      text,
      time: new Date().toLocaleTimeString().slice(0, 5),
    };
    setMessages((prev) => [...prev.slice(-40), newMsg]);

    if (session?.id) {
      await fetch("/api/awards/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "event",
          session_id: session.id,
          event_type: "comment",
          payload: { content: text, user_name: "Spectateur" },
        }),
      }).catch(() => {});
    }

    if (realtimeRef.current) {
      realtimeRef.current.broadcast("comment", { content: text, user_name: "Spectateur" });
    }
  };

  const handleGiftSent = (gift: VirtualGift, candidate: RankingCandidate) => {
    const giftAnim: GiftAnimationItem = {
      id: String(Date.now()),
      senderName: "Vous",
      candidateName: candidate.name,
      giftIcon: gift.icon,
      giftName: gift.name,
      type: "gift",
    };
    setCurrentAnimation(giftAnim);
    setPotAmount((p) => p + gift.priceXof);

    if (realtimeRef.current) {
      realtimeRef.current.broadcast("gift", {
        gift_name: gift.name,
        gift_icon: gift.icon,
        amount_xof: gift.priceXof,
        candidate_name: candidate.name,
        user_name: "Supporter",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Live Africa Awards — ${competition?.title || "En direct"}`,
          text: `Rejoignez le live officiel de ${competition?.title || "la compétition"} et soutenez vos candidats en direct !`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert("Lien du direct copié dans le presse-papier !");
    }
  };

  return (
    <main className="relative h-[100dvh] w-full bg-[#050508] overflow-hidden flex items-center justify-center select-none font-sans">
      {/* Cadre de présentation centré : format portrait mobile natif */}
      <div className="relative h-full w-full max-w-[440px] max-h-[920px] bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] sm:rounded-[36px] sm:border sm:border-white/15">
        {/* ===================================================================
            1. FOND VIDÉO DU DIRECT (TikTok Portrait Plein Écran)
            =================================================================== */}
        <div className="absolute inset-0 z-0">
          {session?.mux_playback_id ? (
            <video
              className="h-full w-full object-cover"
              controls={false}
              autoPlay
              playsInline
              muted
              loop
              src={`https://stream.mux.com/${session.mux_playback_id}.m3u8`}
            />
          ) : (
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={activeSpeaker?.photoUrl || STAGE_VIDEOS[videoSrcIndex]}
                alt=""
                className="h-full w-full object-cover filter brightness-90 contrast-105 scale-105 transition-all duration-700"
              />
              {/* Filtre de grain et de lumière dorée façon gala */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/60" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-[100px] pointer-events-none" />
            </div>
          )}
        </div>

        {/* ===================================================================
            2. EN-TÊTE GLASSMORPHISM SUPÉRIEUR (LiveTopBar)
            =================================================================== */}
        <LiveTopBar
          competitionTitle={competition?.title || "Africa Awards Gala"}
          competitionLogo={competition?.banner_url}
          spectators={spectators}
          potAmountXof={potAmount}
          startedAt={session?.started_at}
          closeHref="/africa-awards/competitions"
        />

        {/* ===================================================================
            3. MINI-CLASSEMENT FLOTTANT TOP 5 (Côté Gauche)
            =================================================================== */}
        <LiveFloatingRanking
          candidates={rankingList}
          activeSpeakerId={activeSpeaker?.id}
          onSelectCandidate={(c) => {
            setActiveSpeakerId(c.id);
            setIsGiftDrawerOpen(true);
          }}
        />

        {/* ===================================================================
            4. COLONNE TIKTOK D'ACTIONS RAPIDES (Côté Droit)
            =================================================================== */}
        <LiveTikTokActions
          candidateId={activeSpeaker?.id}
          candidateName={activeSpeaker?.name}
          candidateAvatar={activeSpeaker?.photoUrl}
          reactionCount={reactionsCount}
          onSendReaction={handleSendReaction}
          onOpenGifts={() => setIsGiftDrawerOpen(true)}
          onShare={handleShare}
          isFollowing={isFollowingCandidate}
          onToggleFollow={() => setIsFollowingCandidate(!isFollowingCandidate)}
        />

        {/* ===================================================================
            5. FLUX CHAT DÉFILANT & RANGÉE DE BOUTONS D'ACTION (Bas)
            =================================================================== */}
        <LiveChatOverlay
          messages={messages}
          pinnedMessage={pinnedMessage}
          onSendMessage={handleSendMessage}
          onVoteClick={() => {
            if (activeSpeaker?.id) {
              router.push(`/africa-awards/vote/${activeSpeaker.id}`);
            } else {
              router.push(`/africa-awards/competitions/${slug}`);
            }
          }}
          onDonateClick={() => {
            setIsGiftDrawerOpen(true);
          }}
          onGiftClick={() => {
            setIsGiftDrawerOpen(true);
          }}
          onJoinClick={() => {
            alert("Votre demande d'intervention vidéo a été transmise à l'animateur.");
          }}
          canJoin={true}
        />

        {/* ===================================================================
            6. OVERLAYS ANIMÉS TEMPORAIRES (Cadeau géant, don, annonce)
            =================================================================== */}
        <LiveGiftAnimationOverlay
          currentAnimation={currentAnimation}
          onAnimationEnd={() => setCurrentAnimation(null)}
        />

        {/* ===================================================================
            7. TIROIR COULISSANT DES CADEAUX VIRTUELS (Bottom Sheet)
            =================================================================== */}
        <LiveGiftDrawer
          isOpen={isGiftDrawerOpen}
          onClose={() => setIsGiftDrawerOpen(false)}
          candidates={rankingList}
          selectedCandidateId={activeSpeaker?.id}
          competitionId={competition?.id || slug}
          onGiftSent={handleGiftSent}
        />
      </div>
    </main>
  );
}
