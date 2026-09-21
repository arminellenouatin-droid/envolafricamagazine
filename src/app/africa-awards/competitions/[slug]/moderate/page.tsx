"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LiveModeratorStream, { SanctionedUser } from "@/components/africa-awards/live/LiveModeratorStream";
import {
  LiveRealtimeSession,
  LiveMessageItem,
  checkIsFlagged,
} from "@/components/africa-awards/live/LiveRealtimeEngine";

export default function ModeratorLivePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [competition, setCompetition] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [spectators, setSpectators] = useState(142);
  const [elapsedSeconds, setElapsedSeconds] = useState(1340);
  const [messages, setMessages] = useState<LiveMessageItem[]>([]);
  const [sanctionedUsers, setSanctionedUsers] = useState<SanctionedUser[]>([
    {
      userId: "user-spam-1",
      userName: "Troll99",
      type: "muted",
      timestamp: "14:22",
      reason: "Spam répétitif",
    },
  ]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const realtimeRef = useRef<LiveRealtimeSession | null>(null);

  // Timer du direct
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Chargement de la compétition et session
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const compRes = await fetch(`/api/awards/competitions?slug=${slug}`).then((r) => r.json());
        if (!active) return;
        setCompetition(compRes.competition || null);

        const liveRes = await fetch(`/api/awards/live?competition_id=${encodeURIComponent(slug)}`).then((r) => r.json());
        if (!active) return;
        setSession(liveRes.session || null);

        // Messages initiaux
        setMessages([
          {
            id: "msg-mod-1",
            user: "Koffi Mensah",
            userId: "u-101",
            text: "Force à Aminata, tu es la meilleure candidate de la soirée !! 🌟",
            time: "14:20",
          },
          {
            id: "msg-mod-2",
            user: "Fatou Diop",
            userId: "u-102",
            text: "Le jury est trop sévère je trouve, son pitch était très solide.",
            time: "14:21",
          },
          {
            id: "msg-mod-3",
            user: "Anonyme23",
            userId: "u-103",
            text: "Arnaque totale ce concours, ils ont déjà choisi leur gagnante d'avance bande de voleurs",
            time: "14:22",
            isFlagged: true,
          },
          {
            id: "msg-mod-4",
            user: "Bakary Samaké",
            userId: "u-104",
            text: "Je viens d'envoyer une couronne royale pour soutenir le projet ! 👑",
            time: "14:23",
          },
          {
            id: "msg-mod-5",
            user: "SpamBot404",
            userId: "u-105",
            text: "Gagnez 500.000 FCFA par jour sans rien faire cliquez ici bit.ly/fraud",
            time: "14:23",
            isFlagged: true,
          },
        ]);
      } catch {
        // Mode démo autonome
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [slug]);

  // Connexion Realtime WebSocket
  useEffect(() => {
    const sessionId = session?.id || `mod_live_${slug}`;
    const rt = new LiveRealtimeSession(sessionId);
    realtimeRef.current = rt;

    rt.connect((count) => {
      setSpectators((prev) => Math.max(prev, count + 120));
    });

    // Commentaires entrants en direct
    rt.on("comment", (payload) => {
      const text = payload.content || "";
      const isSensitive = checkIsFlagged(text);
      const newMsg: LiveMessageItem = {
        id: payload.id || String(Date.now() + Math.random()),
        user: payload.user_name || "Spectateur",
        userId: payload.user_id,
        text,
        time: new Date().toLocaleTimeString().slice(0, 5),
        isFlagged: isSensitive,
      };
      setMessages((prev) => [...prev.slice(-60), newMsg]);
    });

    // Sanctions reçues en temps réel
    rt.on("mod_action", (payload) => {
      if (payload.action === "delete_comment" && payload.comment_id) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.comment_id));
      } else if (payload.action === "hide_comment" && payload.comment_id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.comment_id ? { ...m, isHidden: true } : m))
        );
      } else if (["mute", "ban", "warn"].includes(payload.action)) {
        setSanctionedUsers((prev) => [
          ...prev.filter((u) => u.userId !== payload.target_user_id),
          {
            userId: payload.target_user_id,
            userName: payload.target_user_name || "Utilisateur",
            type: payload.action as any,
            timestamp: new Date().toLocaleTimeString().slice(0, 5),
            reason: payload.reason,
          },
        ]);
      } else if (payload.action === "unban") {
        setSanctionedUsers((prev) => prev.filter((u) => u.userId !== payload.target_user_id));
      }
    });

    return () => {
      rt.disconnect();
    };
  }, [session?.id, slug]);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Actions de modération
  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    showNotification("Message supprimé avec succès");

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_comment",
          session_id: session.id,
          comment_id: messageId,
        }),
      }).catch(() => {});
    }
  };

  const handleHideMessage = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isHidden: true } : m))
    );
    showNotification("Message masqué du flux public");

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hide_comment",
          session_id: session.id,
          comment_id: messageId,
        }),
      }).catch(() => {});
    }
  };

  const handleWarnUser = async (userId: string, userName: string) => {
    const reason = "Non-respect de la charte de bienséance Africa Awards";
    setSanctionedUsers((prev) => [
      ...prev.filter((u) => u.userId !== userId),
      {
        userId,
        userName,
        type: "warned",
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        reason,
      },
    ]);
    showNotification(`Avertissement envoyé à ${userName}`);

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "warn",
          session_id: session.id,
          target_user_id: userId,
          target_user_name: userName,
          reason,
        }),
      }).catch(() => {});
    }
  };

  const handleMuteUser = async (userId: string, userName: string) => {
    setSanctionedUsers((prev) => [
      ...prev.filter((u) => u.userId !== userId),
      {
        userId,
        userName,
        type: "muted",
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        reason: "Silence temporaire appliqué",
      },
    ]);
    showNotification(`${userName} a été mis en sourdine`);

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mute",
          session_id: session.id,
          target_user_id: userId,
          target_user_name: userName,
        }),
      }).catch(() => {});
    }
  };

  const handleBanUser = async (userId: string, userName: string) => {
    setSanctionedUsers((prev) => [
      ...prev.filter((u) => u.userId !== userId),
      {
        userId,
        userName,
        type: "banned",
        timestamp: new Date().toLocaleTimeString().slice(0, 5),
        reason: "Bannissement définitif du Live",
      },
    ]);
    // Supprimer tous les messages de cet utilisateur
    setMessages((prev) => prev.filter((m) => m.userId !== userId));
    showNotification(`${userName} a été banni du direct`);

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ban",
          session_id: session.id,
          target_user_id: userId,
          target_user_name: userName,
        }),
      }).catch(() => {});
    }
  };

  const handleUnsanctionUser = async (userId: string) => {
    setSanctionedUsers((prev) => prev.filter((u) => u.userId !== userId));
    showNotification("Sanction levée avec succès");

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unban",
          session_id: session.id,
          target_user_id: userId,
        }),
      }).catch(() => {});
    }
  };

  const handleAlertHost = async (reason: string) => {
    showNotification(`Alerte prioritaire envoyée à la régie : "${reason}"`);

    if (session?.id) {
      await fetch("/api/awards/live/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "alert_host",
          session_id: session.id,
          reason,
        }),
      }).catch(() => {});
    }

    if (realtimeRef.current) {
      realtimeRef.current.sendModAlert(reason);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070A] text-white flex flex-col">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#D4AF37] text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span>🛡️</span>
          <span>{notice}</span>
        </div>
      )}

      {/* Header Régie / Navigation */}
      <div className="bg-[#0D0E15] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/africa-awards/competitions/${slug}/live`}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
            title="Voir le live spectateur"
          >
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase tracking-wider">
                Console Modérateur
              </span>
              <span className="text-white/40 text-xs">•</span>
              <span className="text-xs text-white/70 font-medium truncate max-w-[200px] md:max-w-xs">
                {competition?.title || "Compétition Gala Live"}
              </span>
            </div>
            <p className="text-[11px] text-white/40">Surveillance temps réel & assainissement du chat</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href={`/africa-awards/competitions/${slug}/live`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition"
          >
            <span>📱</span>
            <span>Vue Spectateur</span>
          </Link>
        </div>
      </div>

      {/* Mini Bar Vidéo Compacte (Conforme Stitch) */}
      <div className="bg-[#12131A] border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Vignette vidéo de scène */}
          <div className="relative w-20 h-12 md:w-28 md:h-16 rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80"
              alt="Scène"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-600/90 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Scène Principale</span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Flux optimal
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-white/60">
              <span className="flex items-center gap-1">
                👥 <strong className="text-white font-bold">{spectators.toLocaleString()}</strong> spectateurs
              </span>
              <span>•</span>
              <span className="font-mono text-[#D4AF37]">⏱️ {formatTimer(elapsedSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Raccourci vers la liste des sanctions */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-amber-400">{sanctionedUsers.length} sous sanction</div>
            <div className="text-[10px] text-white/40">Mute, ban, avertissements</div>
          </div>
        </div>
      </div>

      {/* Corps Principal : Stream de modération interactif ultra-rapide */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 flex flex-col">
        <LiveModeratorStream
          messages={messages}
          sanctionedUsers={sanctionedUsers}
          onDeleteMessage={handleDeleteMessage}
          onHideMessage={handleHideMessage}
          onWarnUser={handleWarnUser}
          onMuteUser={handleMuteUser}
          onBanUser={handleBanUser}
          onUnsanctionUser={handleUnsanctionUser}
          onAlertHost={handleAlertHost}
        />
      </div>
    </div>
  );
}
