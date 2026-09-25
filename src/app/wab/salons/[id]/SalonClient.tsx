"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Salon {
  id: string;
  hostUserId: string;
  host: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  replayUrl?: string;
  participants: number;
}

interface Message {
  id: string;
  author: string;
  content: string;
  giftType?: string;
  createdAt: string;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  emoji: string;
}

const VIRTUAL_GIFTS = [
  { id: "rose", name: "Rose Panafricaine", emoji: "🌹", price: 100 },
  { id: "cafe", name: "Café Éthiopien", emoji: "☕", price: 500 },
  { id: "couronne", name: "Couronne Royale", emoji: "👑", price: 2000 },
  { id: "lion", name: "Lion Panafricain", emoji: "🦁", price: 5000 },
  { id: "diamant", name: "Diamant Brut", emoji: "💎", price: 10000 },
];

const HEART_COLORS = ["#ff2a6d", "#05d9e8", "#ffc837", "#00ff87", "#9e001f", "#ff6b6b"];
const HEART_EMOJIS = ["❤️", "💖", "🔥", "👏", "✨", "💎"];

export default function SalonClient({ id }: { id: string }) {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isHost, setIsHost] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`eam_live_host_${id}`) === "true";
    }
    return false;
  });
  const [currentUserName, setCurrentUserName] = useState("Moi");
  const [isFollowing, setIsFollowing] = useState(false);

  // Live Stats
  const [likeCount, setLikeCount] = useState(1280);
  const [giftCount, setGiftCount] = useState(45);
  const [viewerCount, setViewerCount] = useState(142);

  // Floating Hearts Particles
  const [hearts, setHearts] = useState<HeartParticle[]>([]);

  // Gifts Drawer & Celebration Animation
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<{ emoji: string; name: string } | null>(null);

  // Camera & Mic state (Creator)
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modals
  const [showEndModal, setShowEndModal] = useState(false);
  const [liveSummary, setLiveSummary] = useState<{ duration: string; viewers: number; likes: number } | null>(null);

  // Chat scroll ref
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load & Polling
  const loadSalonData = async () => {
    try {
      const res = await fetch(`/api/wab/salons/${id}`);
      const data = await res.json();
      if (data.salon) {
        setSalon(data.salon);
        if (data.messages) setMessages(data.messages);
        if (data.salon.participants) setViewerCount(data.salon.participants);
      }
    } catch {}
  };

  useEffect(() => {
    loadSalonData();
    const interval = setInterval(loadSalonData, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // 2. Auth & Host Detection
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserName(`${data.user.prenom || ""} ${data.user.nom || ""}`.trim() || "Moi");
          if (salon && salon.hostUserId === data.user.id) {
            setIsHost(true);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`eam_live_host_${id}`, "true");
            }
          }
        }
      })
      .catch(() => {});
  }, [salon, id]);

  // 3. Camera Stream (Creator)
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("La caméra n'est pas disponible sur ce navigateur.");
      return;
    }
    setStartingCamera(true);
    setCameraError(null);

    // Arrêter le flux actif s'il existe
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      // Tenter d'abord avec caméra préférée (frontale sur mobile) + audio
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      streamRef.current = stream;
      setMediaStream(stream);
      setCameraActive(true);
      setMicActive(true);
    } catch (firstErr) {
      console.warn("Échec caméra complète, tentative vidéo simple sans audio...", firstErr);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        setMediaStream(fallbackStream);
        setCameraActive(true);
        setMicActive(false);
      } catch (err: any) {
        console.error("Impossible d'accéder à la caméra:", err);
        setCameraError(err?.message || "Accès à la caméra refusé. Vérifiez vos autorisations.");
      }
    } finally {
      setStartingCamera(false);
    }
  };

  const flipCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    await startCamera(nextMode);
  };

  // Démarrage automatique de la caméra pour l'hôte
  useEffect(() => {
    if (isHost) {
      startCamera(facingMode);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isHost]);

  // Attacher le flux vidéo à l'élément <video> dès qu'il est monté
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaStream) return;
    video.srcObject = mediaStream;
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Auto-play caméra en attente d'interaction :", err);
      });
    }
  }, [mediaStream, isHost, cameraActive]);

  // Scroll chat on new message
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // 4. Tap to Heart Animation
  const triggerHeart = (clientX?: number, clientY?: number) => {
    setLikeCount((prev) => prev + 1);

    const x = clientX !== undefined ? clientX : window.innerWidth * 0.8;
    const y = clientY !== undefined ? clientY : window.innerHeight * 0.7;

    const newHeart: HeartParticle = {
      id: Date.now() + Math.random(),
      x: x + (Math.random() * 40 - 20),
      y: y + (Math.random() * 40 - 20),
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
    };

    setHearts((prev) => [...prev.slice(-25), newHeart]);

    // Nettoyer après l'animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);
  };

  // 5. Send Message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");

    // Optimistic UI : affichage instantané dans le chat
    const tempId = "temp-" + Date.now();
    const tempMessage: Message = {
      id: tempId,
      author: currentUserName || "Moi",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/wab/salons/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, author: currentUserName }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      }
    } catch (err) {
      console.warn("Échec transmission message salon:", err);
    }
  };

  // 6. Send Virtual Gift
  const handleSendGift = async (gift: (typeof VIRTUAL_GIFTS)[0]) => {
    setShowGiftDrawer(false);
    setActiveGiftAnimation({ emoji: gift.emoji, name: gift.name });
    setGiftCount((prev) => prev + 1);

    // Burst hearts
    for (let i = 0; i < 6; i++) {
      setTimeout(() => triggerHeart(), i * 150);
    }

    setTimeout(() => {
      setActiveGiftAnimation(null);
    }, 2800);

    try {
      const res = await fetch(`/api/wab/salons/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `a envoyé un cadeau : ${gift.name} ${gift.emoji}`,
          giftType: gift.id,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {}
  };

  // 7. End Live (Host)
  const handleEndLive = async () => {
    try {
      await fetch(`/api/wab/salons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setShowEndModal(false);
      setLiveSummary({
        duration: "42 min 18s",
        viewers: viewerCount,
        likes: likeCount,
      });
    } catch {}
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#001325] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-sm">Connexion au Salon Live WAB...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black text-white overflow-hidden select-none flex flex-col"
      onClick={(e) => {
        // Taper sur l'écran génère un cœur (sauf si clic sur formulaire/boutons)
        const target = e.target as HTMLElement;
        if (!target.closest("button") && !target.closest("input") && !target.closest("a")) {
          triggerHeart(e.clientX, e.clientY);
        }
      }}
    >
      {/* ======================================================== */}
      {/* 1. FLUX VIDÉO EN ARRIÈRE-PLAN (Style TikTok Live)        */}
      {/* ======================================================== */}
      <div className="absolute inset-0 z-0">
        {isHost ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
            />
            {(!mediaStream || cameraError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center z-10">
                <span className="material-symbols-outlined text-5xl text-emerald-400 mb-3 animate-pulse">videocam</span>
                <p className="text-sm font-bold text-white mb-2">Activer votre flux caméra</p>
                <p className="text-xs text-slate-300 max-w-xs mb-4">
                  {cameraError || "Appuyez sur le bouton ci-dessous pour autoriser et démarrer la vidéo en direct."}
                </p>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  disabled={startingCamera}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-xl transition-transform active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  <span>{startingCamera ? "Connexion caméra…" : "Démarrer la caméra"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Flux spectateur immersif
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-[#00223a] to-black flex items-center justify-center">
            {/* Visualisation interactive du direct */}
            <div className="relative flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-emerald-400 shadow-2xl animate-pulse">
                  <img
                    src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop"
                    alt={salon.host}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] tracking-wider uppercase ring-2 ring-black">
                  LIVE
                </span>
              </div>
              <h2 className="mt-4 font-display font-black text-xl text-white drop-shadow">
                {salon.host}
              </h2>
              <p className="text-xs text-emerald-300 font-medium mt-1">
                {salon.title}
              </p>
            </div>
          </div>
        )}

        {/* Dégradé sombre pour lisibilité du chat et des commandes */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* 2. EN-TÊTE DU LIVE (Overlay Supérieur)                    */}
      {/* ======================================================== */}
      <div className="relative z-20 flex items-center justify-between p-3 sm:p-4 md:px-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Profil de l'Hôte */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1 border border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-700 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&auto=format&fit=crop"
              alt={salon.host}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 pr-1">
            <p className="text-xs font-bold leading-tight truncate max-w-[110px]">{salon.host}</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Live
              </span>
              <span className="text-[10px] text-gray-300">· {viewerCount} spectateurs</span>
            </div>
          </div>

          {!isHost && (
            <button
              type="button"
              onClick={() => setIsFollowing(!isFollowing)}
              className={`text-[11px] font-extrabold px-3 py-1 rounded-full transition-all ${
                isFollowing
                  ? "bg-white/20 text-white"
                  : "bg-[#9e001f] hover:bg-[#c8102e] text-white shadow-sm"
              }`}
            >
              {isFollowing ? "Suivi" : "+ Suivre"}
            </button>
          )}
        </div>

        {/* Boutons d'action Supérieurs */}
        <div className="flex items-center gap-2">
          {isHost && (
            <>
              <button
                type="button"
                onClick={toggleCamera}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border ${
                  cameraActive ? "bg-black/40 border-white/20" : "bg-red-600 border-red-400"
                }`}
                title="Caméra"
              >
                <span className="material-symbols-outlined text-lg">
                  {cameraActive ? "videocam" : "videocam_off"}
                </span>
              </button>

              <button
                type="button"
                onClick={flipCamera}
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border bg-black/40 border-white/20 text-white hover:bg-black/60 active:scale-90 transition-transform"
                title="Changer de caméra (avant/arrière)"
              >
                <span className="material-symbols-outlined text-lg">flip_camera_ios</span>
              </button>

              <button
                type="button"
                onClick={toggleMic}
                className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border ${
                  micActive ? "bg-black/40 border-white/20" : "bg-red-600 border-red-400"
                }`}
                title="Microphone"
              >
                <span className="material-symbols-outlined text-lg">
                  {micActive ? "mic" : "mic_off"}
                </span>
              </button>
            </>
          )}

          {/* Bouton Quitter / Terminer */}
          {isHost ? (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">call_end</span>
              <span>Arrêter</span>
            </button>
          ) : (
            <Link
              href="/wab/salons"
              className="h-9 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center gap-1.5 text-white hover:bg-black/80 text-xs font-bold shadow-lg transition-all active:scale-95"
              title="Fermer le direct et revenir au site"
            >
              <span className="material-symbols-outlined text-base">close</span>
              <span className="inline">Fermer</span>
            </Link>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. PARTICULES DE CŒURS FLOTTANTS (Style TikTok)           */}
      {/* ======================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
        {hearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute text-2xl transition-all duration-1000 ease-out transform"
            style={{
              left: `${heart.x}px`,
              top: `${heart.y}px`,
              animation: "floatUp 1.6s forwards ease-out",
            }}
          >
            {heart.emoji}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-90px) scale(1.3) rotate(-15deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-220px) scale(1.6) rotate(20deg);
          }
        }
      `}</style>

      {/* ======================================================== */}
      {/* 4. ANIMATION DE CADEAU VIRTUEL PLEIN ÉCRAN               */}
      {/* ======================================================== */}
      {activeGiftAnimation && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center animate-in zoom-in-50 duration-300">
          <div className="text-8xl md:text-9xl drop-shadow-2xl animate-bounce">
            {activeGiftAnimation.emoji}
          </div>
          <div className="mt-4 px-6 py-2 rounded-full bg-black/70 backdrop-blur-md border border-amber-400 text-amber-300 font-display font-black text-lg shadow-2xl">
            {currentUserName} a offert {activeGiftAnimation.name} !
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. OVERLAY CHAT EN DIRECT FLOTTANT (En bas à gauche)      */}
      {/* ======================================================== */}
      <div className="absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+3.75rem)] left-4 right-20 z-20 max-w-sm pointer-events-auto">
        <div
          ref={chatScrollRef}
          className="max-h-60 overflow-y-auto space-y-2 pr-2 no-scrollbar"
        >
          {/* Message de bienvenue */}
          <div className="bg-black/35 backdrop-blur-md rounded-2xl p-2.5 text-xs border border-white/10 leading-relaxed text-amber-300">
            <span className="font-bold">✨ Bienvenue dans le Salon WAB !</span> Respectez les participants et partagez vos opportunités professionnelles.
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`bg-black/45 backdrop-blur-md rounded-2xl px-3 py-2 text-xs border border-white/10 ${
                m.giftType
                  ? "border-amber-400/60 bg-amber-950/40 text-amber-200"
                  : "text-white"
              }`}
            >
              <span className="font-extrabold text-emerald-400 mr-2">{m.author} :</span>
              <span className="leading-snug">{m.content}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. BARRE D'INTERACTION INFERIEURE (Input, Cadeau, Cœurs) */}
      {/* ======================================================== */}
      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Champ de saisie commentaire */}
        <div className="flex-1 flex items-center bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ajouter un commentaire..."
            className="w-full bg-transparent text-xs text-white placeholder-white/60 focus:outline-none"
          />
          {inputText.trim() && (
            <button
              type="button"
              onClick={handleSendMessage}
              className="text-emerald-400 hover:text-emerald-300 ml-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          )}
        </div>

        {/* Bouton Cadeau Virtuel */}
        {!isHost && (
          <button
            type="button"
            onClick={() => setShowGiftDrawer(true)}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform shrink-0"
            title="Envoyer un cadeau"
          >
            <span className="text-xl">🎁</span>
          </button>
        )}

        {/* Bouton Cœur (Burst) */}
        <button
          type="button"
          onClick={() => triggerHeart()}
          className="relative w-11 h-11 rounded-full bg-[#ff2a6d] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform shrink-0"
          title="J'aime le live"
        >
          <span className="text-xl">❤️</span>
          <span className="absolute -top-2 -right-1 text-[9px] font-black bg-black/70 px-1.5 py-0.5 rounded-full border border-white/20">
            {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 7. TIROIR DES CADEAUX VIRTUELS (Bottom Drawer)           */}
      {/* ======================================================== */}
      {showGiftDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1b1c1c] border-t border-white/20 rounded-t-3xl p-6 max-w-lg mx-auto w-full animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <h3 className="font-display font-black text-sm text-white">
                  Envoyer un Cadeau en Direct
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGiftDrawer(false)}
                className="text-gray-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {VIRTUAL_GIFTS.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all hover:scale-105 active:scale-95 text-center group"
                >
                  <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">
                    {gift.emoji}
                  </span>
                  <span className="text-[11px] font-bold text-white line-clamp-1">
                    {gift.name}
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 mt-1">
                    {gift.price.toLocaleString("fr-FR")} XOF
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL CONFIRMATION ARRÊT DU LIVE                      */}
      {/* ======================================================== */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1b1c1c] border border-white/20 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <span className="material-symbols-outlined text-4xl text-red-500 mb-3">
              power_settings_new
            </span>
            <h3 className="font-display font-black text-lg text-white mb-2">
              Terminer le Salon en direct ?
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              La diffusion s'arrêtera pour l'ensemble des {viewerCount} spectateurs actuellement connectés.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10"
              >
                Continuer
              </button>
              <button
                type="button"
                onClick={handleEndLive}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white"
              >
                Arrêter le Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. MODAL BILAN APRES LIVE                                */}
      {/* ======================================================== */}
      {liveSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-[#1b1c1c] border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">emoji_events</span>
            </div>
            <h3 className="font-display font-black text-xl text-white mb-1">
              Direct Terminé !
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Félicitations pour votre salon professionnel sur WAB.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Spectateurs</span>
                <p className="text-lg font-black text-white">{liveSummary.viewers}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-[10px] text-gray-400 uppercase font-bold">J'aime reçus</span>
                <p className="text-lg font-black text-red-400">{liveSummary.likes}</p>
              </div>
            </div>

            <Link
              href="/wab/salons"
              className="block w-full py-3 rounded-full bg-[#9e001f] text-white font-bold text-xs"
            >
              Retour aux Salons
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
