"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface PinnedProduct {
  id: string;
  title: string;
  priceXof: number;
  image: string;
  supplier: string;
  vendorName?: string;
  installment?: boolean;
  months?: number;
  isFlash?: boolean;
  flashPriceXof?: number;
  flashDiscountPercent?: number;
  flashEndsAt?: string;
}

interface Salon {
  id: string;
  hostUserId: string;
  host: string;
  hostAvatarUrl?: string;
  title: string;
  description: string;
  theme?: string;
  visibility?: "public" | "followers" | "invite";
  coverUrl?: string;
  salesModeEnabled?: boolean;
  allowStageRequests?: boolean;
  pinnedProduct?: PinnedProduct | null;
  moderatorUserIds?: string[];
  mutedUserIds?: string[];
  bannedUserIds?: string[];
  startsAt: string;
  endsAt?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  replayUrl?: string;
  replayPublic?: boolean;
  participants: number;
  coHostUserId?: string;
  coHostName?: string;
  coHostAvatarUrl?: string;
  guestRequests?: Array<{
    userId: string;
    name: string;
    avatarUrl?: string;
    requestedAt: string;
    status: "pending" | "accepted" | "rejected";
  }>;
  stats?: {
    peakViewers: number;
    totalViews: number;
    totalCoinsReceived: number;
    totalSalesXof: number;
    durationSeconds?: number;
  };
}

interface Message {
  id: string;
  userId?: string;
  author: string;
  authorAvatarUrl?: string;
  content: string;
  giftType?: string;
  giftAmount?: number;
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
  { id: "rose", name: "Rose Panafricaine", emoji: "🌹", coins: 5, priceXof: 50 },
  { id: "cafe", name: "Café Éthiopien", emoji: "☕", coins: 25, priceXof: 250 },
  { id: "couronne", name: "Couronne Royale", emoji: "👑", coins: 100, priceXof: 1000 },
  { id: "lion", name: "Lion Panafricain", emoji: "🦁", coins: 500, priceXof: 5000 },
  { id: "diamant", name: "Diamant Brut", emoji: "💎", coins: 1000, priceXof: 10000 },
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

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState("Spectateur WAB");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);
  const [isCoHost, setIsCoHost] = useState(false);
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

  // Camera & Mic state (Creator & Co-host)
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [startingCamera, setStartingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Remote Stream for viewers (Host and Co-Host video streams)
  const [remoteHostStream, setRemoteHostStream] = useState<MediaStream | null>(null);
  const [remoteCoHostStream, setRemoteCoHostStream] = useState<MediaStream | null>(null);
  const [hostLatestFrame, setHostLatestFrame] = useState<string | null>(null);
  const remoteHostVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteCoHostVideoRef = useRef<HTMLVideoElement | null>(null);

  // Stage Requests (Co-Hosting / TikTok Dual Live)
  const [myStageRequestStatus, setMyStageRequestStatus] = useState<"none" | "pending" | "accepted">("none");
  const [pendingGuestRequests, setPendingGuestRequests] = useState<Array<{ userId: string; name: string; avatarUrl?: string }>>([]);

  // Live Shopping states (PRD Lot 4)
  const [pinnedProduct, setPinnedProduct] = useState<PinnedProduct | null>(null);
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [showHostProductsDrawer, setShowHostProductsDrawer] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [buyingProduct, setBuyingProduct] = useState(false);
  const [cartSuccessToast, setCartSuccessToast] = useState(false);
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  // WAB Coins & Virtual Gifts states (PRD Lot 3)
  const [myCoins, setMyCoins] = useState<number>(50);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const [giftQuantity, setGiftQuantity] = useState<number>(1);
  const [showTopContributorsDrawer, setShowTopContributorsDrawer] = useState(false);

  // Moderation & Reporting states (PRD Lot 2 & Lot 5)
  const [showReportModal, setShowReportModal] = useState<{ open: boolean; targetType: "salon" | "message" | "user"; targetId: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const [moderationModal, setModerationModal] = useState<{ open: boolean; user: { id: string; name: string; messageId?: string } } | null>(null);
  const [isModerator, setIsModerator] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Post-Live Replay & Timer
  const [publishReplay, setPublishReplay] = useState(true);
  const [liveDurationSeconds, setLiveDurationSeconds] = useState(0);

  // WebRTC Peer Connections & Supabase Channel
  const viewerIdRef = useRef<string>("");
  if (!viewerIdRef.current) {
    viewerIdRef.current = `v-${Math.random().toString(36).slice(2, 9)}`;
  }
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modals
  const [showEndModal, setShowEndModal] = useState(false);
  const [liveSummary, setLiveSummary] = useState<{ duration: string; viewers: number; likes: number } | null>(null);

  // Chat scroll ref
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load & Polling
  const loadSalonData = useCallback(async () => {
    try {
      const res = await fetch(`/api/wab/salons/${id}`);
      const data = await res.json();
      if (data.salon) {
        setSalon(data.salon);
        if (Array.isArray(data.messages)) {
          setMessages((prev) => {
            // Fusion intelligente sans perdre les messages reçus en temps réel
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = data.messages.filter((m: Message) => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
        }
        if (data.salon.participants) setViewerCount(data.salon.participants);

        // Si l'utilisateur actuel est le co-hôte
        if (currentUserId && data.salon.coHostUserId === currentUserId) {
          setIsCoHost(true);
        } else if (currentUserId && data.salon.coHostUserId !== currentUserId) {
          setIsCoHost(false);
        }

        // Mettre à jour les demandes en attente pour l'hôte
        if (Array.isArray(data.salon.guestRequests)) {
          const pending = data.salon.guestRequests.filter((r: any) => r.status === "pending");
          setPendingGuestRequests(pending);
        }
      }
    } catch {}
  }, [id, currentUserId]);

  useEffect(() => {
    loadSalonData();
    const interval = setInterval(loadSalonData, 4000);
    return () => clearInterval(interval);
  }, [loadSalonData]);

  // 2. Auth & Host Detection
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
          const fullName = `${data.user.prenom || ""} ${data.user.nom || ""}`.trim();
          const nameToUse = fullName || data.user.email?.split("@")[0] || "Membre WAB";
          setCurrentUserName(nameToUse);
          const av = data.user.avatar_url || data.user.photo_url || data.user.avatar;
          if (av) setCurrentUserAvatar(av);

          if (salon && salon.hostUserId === data.user.id) {
            setIsHost(true);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`eam_live_host_${id}`, "true");
            }
          }
        } else {
          // Pseudonyme invité stocké ou généré proprement
          const savedName = localStorage.getItem("wab_viewer_name");
          if (savedName) {
            setCurrentUserName(savedName);
          } else {
            const guestName = `Spectateur #${viewerIdRef.current.slice(2, 6)}`;
            setCurrentUserName(guestName);
            localStorage.setItem("wab_viewer_name", guestName);
          }
        }
      })
      .catch(() => {});
  }, [salon, id]);

  // 3. Camera Stream (Creator & Co-host)
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
      let stream: MediaStream | null = null;
      let audioEnabled = true;

      // Tentative 1 : mode spécifié (user/environment) + audio
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 720 }, height: { ideal: 1280 } },
          audio: true,
        });
      } catch {
        // Tentative 2 : vidéo générique + audio
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch {
          // Tentative 3 : vidéo sans audio
          audioEnabled = false;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: mode },
              audio: false,
            });
          } catch {
            // Tentative 4 : vidéo minimale
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            } catch (finalErr: any) {
              console.error("Échec définitif accès caméra :", finalErr);
              const errName = finalErr?.name || "";
              if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
                setCameraError("permission_denied");
              } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
                setCameraError("not_found");
              } else if (errName === "NotReadableError" || errName === "TrackStartError") {
                setCameraError("in_use");
              } else {
                setCameraError(finalErr?.message || "Accès à la caméra indisponible.");
              }
              return;
            }
          }
        }
      }

      if (stream) {
        streamRef.current = stream;
        setMediaStream(stream);
        setCameraActive(true);
        setMicActive(audioEnabled);
        setCameraError(null);

        // Mettre à jour les pistes dans les peer connections existantes
        peerConnectionsRef.current.forEach((pc) => {
          stream!.getTracks().forEach((track) => {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track).catch(() => {});
            } else {
              pc.addTrack(track, stream!);
            }
          });
        });
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
    if (isHost || isCoHost) {
      startCamera(facingMode);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isHost, isCoHost]);

  // Attacher le flux vidéo local à l'élément <video>
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
  }, [mediaStream, isHost, isCoHost, cameraActive]);

  // Attacher le flux vidéo distant hôte pour les spectateurs
  useEffect(() => {
    const video = remoteHostVideoRef.current;
    if (!video || !remoteHostStream) return;
    video.srcObject = remoteHostStream;
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Auto-play vidéo hôte en attente :", err);
      });
    }
  }, [remoteHostStream]);

  // Attacher le flux vidéo distant co-hôte
  useEffect(() => {
    const video = remoteCoHostVideoRef.current;
    if (!video || !remoteCoHostStream) return;
    video.srcObject = remoteCoHostStream;
    video.muted = false;
    video.play().catch(() => {});
  }, [remoteCoHostStream]);

  // 4. Capture périodique et diffusion de trame vidéo (Fallback instantané & anti-écran noir)
  useEffect(() => {
    if ((!isHost && !isCoHost) || !cameraActive || !mediaStream) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const targetWidth = 360;
      canvas.width = targetWidth;
      canvas.height = Math.round((targetWidth * video.videoHeight) / video.videoWidth) || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        const frameData = canvas.toDataURL("image/jpeg", 0.55);
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: isHost ? "host_frame" : "cohost_frame",
            payload: { frameData, from: currentUserId },
          });
        }
      } catch {}
    }, 1200);

    return () => clearInterval(interval);
  }, [isHost, isCoHost, cameraActive, mediaStream, currentUserId]);

  // 5. Connexion Supabase Realtime (Signalisation WebRTC, Chat, Cadeaux, Cœurs, Scène)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const ch = supabase.channel(`salon_live_${id}`, {
      config: {
        broadcast: { self: false },
        presence: { key: `viewer_${viewerIdRef.current}` },
      },
    });

    // 5.1 Spectateur rejoint le direct -> L'hôte crée l'offre WebRTC
    ch.on("broadcast", { event: "viewer_join" }, async ({ payload }: { payload: any }) => {
      const targetViewer = payload?.viewerId;
      if ((isHost || isCoHost) && streamRef.current && targetViewer) {
        try {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          });
          peerConnectionsRef.current.set(targetViewer, pc);

          streamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, streamRef.current!);
          });

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              ch.send({
                type: "broadcast",
                event: "live_ice",
                payload: { to: targetViewer, candidate: event.candidate.toJSON(), role: isHost ? "host" : "cohost" },
              });
            }
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          ch.send({
            type: "broadcast",
            event: "live_offer",
            payload: {
              to: targetViewer,
              fromRole: isHost ? "host" : "cohost",
              offer: { type: offer.type, sdp: offer.sdp },
            },
          });
        } catch (err) {
          console.warn("[Live Host] Erreur création offre viewer :", err);
        }
      }
    });

    // 5.2 Le spectateur reçoit l'offre WebRTC de l'hôte
    ch.on("broadcast", { event: "live_offer" }, async ({ payload }: { payload: any }) => {
      if (!isHost && payload?.to === viewerIdRef.current && payload.offer) {
        try {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          });
          viewerPcRef.current = pc;

          pc.ontrack = (event) => {
            if (event.streams[0]) {
              if (payload.fromRole === "cohost") {
                setRemoteCoHostStream(event.streams[0]);
              } else {
                setRemoteHostStream(event.streams[0]);
              }
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              ch.send({
                type: "broadcast",
                event: "live_ice",
                payload: { from: viewerIdRef.current, candidate: event.candidate.toJSON() },
              });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          ch.send({
            type: "broadcast",
            event: "live_answer",
            payload: {
              from: viewerIdRef.current,
              answer: { type: answer.type, sdp: answer.sdp },
            },
          });
        } catch (err) {
          console.warn("[Live Viewer] Erreur négociation réponse :", err);
        }
      }
    });

    // 5.3 L'hôte reçoit la réponse WebRTC du spectateur
    ch.on("broadcast", { event: "live_answer" }, async ({ payload }: { payload: any }) => {
      if ((isHost || isCoHost) && payload?.from && payload.answer) {
        const pc = peerConnectionsRef.current.get(payload.from);
        if (pc && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } catch (err) {
            console.warn("[Live Host] Erreur remote description réponse :", err);
          }
        }
      }
    });

    // 5.4 ICE Candidates
    ch.on("broadcast", { event: "live_ice" }, async ({ payload }: { payload: any }) => {
      if ((isHost || isCoHost) && payload?.from && payload.candidate) {
        const pc = peerConnectionsRef.current.get(payload.from);
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {}
        }
      } else if (!isHost && payload?.to === viewerIdRef.current && payload.candidate && viewerPcRef.current) {
        try {
          await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {}
      }
    });

    // 5.5 Réception des trames visuelles instantanées de l'hôte
    ch.on("broadcast", { event: "host_frame" }, ({ payload }: { payload: any }) => {
      if (!isHost && payload?.frameData) {
        setHostLatestFrame(payload.frameData);
      }
    });

    // 5.6 Chat en direct instantané
    ch.on("broadcast", { event: "live_chat_message" }, ({ payload }: { payload: any }) => {
      if (payload?.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    });

    // 5.7 Cadeaux virtuels reçus
    ch.on("broadcast", { event: "live_gift" }, ({ payload }: { payload: any }) => {
      if (payload) {
        setActiveGiftAnimation({ emoji: payload.emoji, name: payload.name });
        setGiftCount((g) => g + 1);
        setTimeout(() => setActiveGiftAnimation(null), 2800);
      }
    });

    // 5.8 Cœurs flottants TikTok reçus
    ch.on("broadcast", { event: "live_heart" }, () => {
      setLikeCount((prev) => prev + 1);
      const newHeart: HeartParticle = {
        id: Date.now() + Math.random(),
        x: Math.random() * 80 + 10,
        y: window.innerHeight - 140,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      };
      setHearts((prev) => [...prev.slice(-25), newHeart]);
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 1800);
    });

    // 5.9 Demande de montée sur scène reçue par l'hôte
    ch.on("broadcast", { event: "guest_stage_request" }, ({ payload }: { payload: any }) => {
      if (isHost && payload?.userId) {
        setPendingGuestRequests((prev) => {
          if (prev.some((r) => r.userId === payload.userId)) return prev;
          return [...prev, payload];
        });
      }
    });

    // 5.10 Demande de montée sur scène acceptée
    ch.on("broadcast", { event: "guest_stage_accepted" }, async ({ payload }: { payload: any }) => {
      if (payload?.targetUserId === currentUserId) {
        setMyStageRequestStatus("accepted");
        setIsCoHost(true);
        await startCamera(facingMode);
      }
      loadSalonData();
    });

    // 5.11 Fin de la session de scène pour l'invité
    ch.on("broadcast", { event: "guest_stage_left" }, () => {
      setIsCoHost(false);
      setMyStageRequestStatus("none");
      loadSalonData();
    });

    // 5.12 Produit épinglé en direct (Live Shopping PRD Lot 4)
    ch.on("broadcast", { event: "product_pinned" }, ({ payload }: { payload: any }) => {
      if (payload) {
        setPinnedProduct(payload);
      }
    });

    // 5.13 Produit désépinglé
    ch.on("broadcast", { event: "product_unpinned" }, () => {
      setPinnedProduct(null);
    });

    // 5.14 Sanction modération reçue
    ch.on("broadcast", { event: "participant_sanction" }, ({ payload }: { payload: any }) => {
      if (payload?.targetUserId === currentUserId) {
        if (payload.action === "mute") {
          setIsMuted(true);
          alert("Vous avez été mis en sourdine par un modérateur pour ce direct.");
        } else if (payload.action === "kick" || payload.action === "ban") {
          alert("Vous avez été exclu de ce salon par l'hôte ou la modération.");
          window.location.assign("/salons");
        }
      }
    });

    // Presence update pour le compteur de spectateurs
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      const count = Object.keys(state).length;
      if (count > 0) setViewerCount(Math.max(count, 1));
    });

    ch.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ joinedAt: new Date().toISOString() });
        if (!isHost) {
          ch.send({
            type: "broadcast",
            event: "viewer_join",
            payload: { viewerId: viewerIdRef.current },
          });
        }
      }
    });

    channelRef.current = ch;

    return () => {
      if (supabase && ch) {
        supabase.removeChannel(ch);
      }
    };
  }, [id, isHost, isCoHost, currentUserId, facingMode, loadSalonData]);

  // Scroll chat on new message
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Tap to Heart Animation
  const triggerHeart = (clientX?: number, clientY?: number) => {
    setLikeCount((prev) => prev + 1);

    const xPos = clientX ?? Math.random() * (typeof window !== "undefined" ? window.innerWidth * 0.7 : 200) + 20;
    const yPos = clientY ?? (typeof window !== "undefined" ? window.innerHeight - 150 : 400);

    const newHeart: HeartParticle = {
      id: Date.now() + Math.random(),
      x: xPos,
      y: yPos,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
    };

    setHearts((prev) => [...prev.slice(-25), newHeart]);

    // Broadcast instantané aux autres utilisateurs
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "live_heart",
        payload: {},
      });
    }

    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1800);
  };

  // Send Message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");

    const authorDisplayName = currentUserName && currentUserName !== "Moi" ? currentUserName : "Spectateur WAB";
    const tempId = "msg-" + Date.now();
    const tempMessage: Message = {
      id: tempId,
      author: authorDisplayName,
      authorAvatarUrl: currentUserAvatar,
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI
    setMessages((prev) => [...prev, tempMessage]);

    // Broadcast en temps réel sur le canal Supabase
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "live_chat_message",
        payload: { message: tempMessage },
      });
    }

    try {
      const res = await fetch(`/api/wab/salons/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          author: authorDisplayName,
          authorAvatarUrl: currentUserAvatar,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? data.message : m)));
      }
    } catch (err) {
      console.warn("Échec transmission message salon:", err);
    }
  };

  // Demander à monter sur scène (Spectateur)
  const handleRequestStage = async () => {
    setMyStageRequestStatus("pending");
    try {
      await fetch(`/api/wab/salons/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          userId: currentUserId || viewerIdRef.current,
          name: currentUserName,
          avatarUrl: currentUserAvatar,
        }),
      });

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "guest_stage_request",
          payload: {
            userId: currentUserId || viewerIdRef.current,
            name: currentUserName,
            avatarUrl: currentUserAvatar,
          },
        });
      }
    } catch {
      setMyStageRequestStatus("none");
    }
  };

  // Accepter un invité sur scène (Hôte)
  const handleAcceptStage = async (targetUserId: string, guestName: string, avatarUrl?: string) => {
    try {
      await fetch(`/api/wab/salons/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", targetUserId }),
      });

      setPendingGuestRequests((prev) => prev.filter((r) => r.userId !== targetUserId));

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "guest_stage_accepted",
          payload: { targetUserId, guestName, avatarUrl },
        });
      }

      loadSalonData();
    } catch (err) {
      console.warn("Échec acceptation invité:", err);
    }
  };

  // Refuser une demande (Hôte)
  const handleRejectStage = async (targetUserId: string) => {
    try {
      await fetch(`/api/wab/salons/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", targetUserId }),
      });
      setPendingGuestRequests((prev) => prev.filter((r) => r.userId !== targetUserId));
    } catch {}
  };

  // Faire descendre ou quitter la scène
  const handleLeaveStage = async () => {
    try {
      await fetch(`/api/wab/salons/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });

      setIsCoHost(false);
      setMyStageRequestStatus("none");

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "guest_stage_left",
          payload: {},
        });
      }

      loadSalonData();
    } catch {}
  };

  const handleKickCoHost = async () => {
    try {
      await fetch(`/api/wab/salons/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "kick" }),
      });

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "guest_stage_left",
          payload: {},
        });
      }

      loadSalonData();
    } catch {}
  };

  // 1. Charger le solde de Coins
  const loadCoins = useCallback(async () => {
    try {
      const res = await fetch("/api/wab/coins");
      const data = await res.json();
      if (data && typeof data.coins === "number") {
        setMyCoins(data.coins);
      }
    } catch {}
  }, []);

  // 2. Charger les produits Marketplace disponibles & produit épinglé
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`/api/wab/salons/${id}/products`);
      const data = await res.json();
      if (data) {
        if (data.pinnedProduct !== undefined) setPinnedProduct(data.pinnedProduct);
        if (Array.isArray(data.availableProducts)) setAvailableProducts(data.availableProducts);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    loadCoins();
    loadProducts();
  }, [loadCoins, loadProducts]);

  // Timer de durée de live
  useEffect(() => {
    if (salon?.status === "live") {
      const timer = setInterval(() => {
        setLiveDurationSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [salon?.status]);

  // Calcul dynamique des meilleurs donateurs (Top Contributeurs PRD Section 9.3)
  const topContributors = (() => {
    const map = new Map<string, { name: string; avatarUrl?: string; totalCoins: number }>();
    messages.forEach((m) => {
      if (m.giftType && m.giftAmount && m.author) {
        const existing = map.get(m.author) || { name: m.author, avatarUrl: m.authorAvatarUrl, totalCoins: 0 };
        existing.totalCoins += m.giftAmount;
        map.set(m.author, existing);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalCoins - a.totalCoins).slice(0, 10);
  })();

  // Envoi de cadeau avec débits/crédits en Coins (PRD Section 9.2)
  const handleSendGift = async (gift: any, quantity: number = giftQuantity) => {
    const totalCostCoins = (gift.coins || 5) * quantity;
    if (myCoins < totalCostCoins) {
      setShowGiftDrawer(false);
      setShowRechargeModal(true);
      return;
    }

    try {
      const res = await fetch("/api/wab/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_gift",
          salonId: id,
          giftType: gift.name,
          coinsCost: gift.coins,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setShowGiftDrawer(false);
          setShowRechargeModal(true);
        } else {
          alert(data.error || "Impossible d'envoyer le cadeau.");
        }
        return;
      }

      setMyCoins(data.remainingCoins);
      setGiftCount((prev) => prev + quantity);
      setActiveGiftAnimation({ emoji: gift.emoji, name: `${quantity > 1 ? `${quantity}x ` : ""}${gift.name}` });
      setTimeout(() => setActiveGiftAnimation(null), 3500);

      if (channelRef.current && data.giftMessage) {
        channelRef.current.send({
          type: "broadcast",
          event: "live_chat_message",
          payload: { message: data.giftMessage },
        });
        channelRef.current.send({
          type: "broadcast",
          event: "live_gift",
          payload: { emoji: gift.emoji, name: `${quantity > 1 ? `${quantity}x ` : ""}${gift.name}` },
        });
        setMessages((prev) => [...prev, data.giftMessage]);
      }
      setShowGiftDrawer(false);
    } catch (err) {
      console.warn("Échec envoi cadeau:", err);
    }
  };

  // Recharge rapide de Coins (PRD Section 9.1)
  const handleRechargePack = async (pack: any) => {
    setRecharging(true);
    try {
      const res = await fetch("/api/wab/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recharge",
          packId: pack.id,
          instantSimulation: true,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else if (data.success) {
        setMyCoins(data.coins);
        setShowRechargeModal(false);
        setPurchaseToast(`Recharge réussie ! ${pack.coins} Coins WAB crédités.`);
        setTimeout(() => setPurchaseToast(null), 3500);
      } else {
        alert(data.error || "Impossible d'initialiser la recharge.");
      }
    } catch (err: any) {
      alert(err?.message || "Erreur de recharge.");
    } finally {
      setRecharging(false);
    }
  };

  // Épingler un produit Marketplace en direct (PRD Section 8.2)
  const handlePinProduct = async (product: any, isFlash = false, discount = 15, duration = 10) => {
    try {
      const res = await fetch(`/api/wab/salons/${id}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          isFlash,
          flashDiscountPercent: discount,
          flashMinutes: duration,
        }),
      });
      const data = await res.json();
      if (data.pinnedProduct) {
        setPinnedProduct(data.pinnedProduct);
        setShowHostProductsDrawer(false);
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "product_pinned",
            payload: data.pinnedProduct,
          });
        }
      }
    } catch (err) {
      console.warn("Erreur épinglage:", err);
    }
  };

  const handleUnpinProduct = async () => {
    try {
      await fetch(`/api/wab/salons/${id}/products`, { method: "DELETE" });
      setPinnedProduct(null);
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "product_unpinned",
          payload: {},
        });
      }
    } catch {}
  };

  // Achat 1-Clic Moneroo (Spectateur)
  const handleBuyProductNow = async (product: any, paymentMode: "full" | "installment" = "full", months = 1) => {
    try {
      setBuyingProduct(true);
      const res = await fetch("/api/marketplace/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          paymentMode,
          months,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
      } else if (data.order) {
        setPurchaseToast("Commande initiée sous séquestre sécurisé WAB !");
        setShowProductSheet(false);
        setTimeout(() => setPurchaseToast(null), 4000);
      } else {
        alert(data.error || "Impossible d'initier la commande.");
      }
    } catch (err: any) {
      alert(err?.message || "Erreur de paiement.");
    } finally {
      setBuyingProduct(false);
    }
  };

  // Ajout au Panier général (/panier)
  const handleAddToCart = (product: any) => {
    try {
      const saved = localStorage.getItem("eam_cart_items");
      const cart = saved ? JSON.parse(saved) : [];
      cart.push({
        id: product.id,
        title: product.title,
        price: product.flashPriceXof || product.priceXof,
        image: product.image,
        quantity: 1,
        source: "live_salon",
        salonId: id,
      });
      localStorage.setItem("eam_cart_items", JSON.stringify(cart));
      setCartSuccessToast(true);
      setShowProductSheet(false);
      setTimeout(() => setCartSuccessToast(false), 3500);
    } catch {}
  };

  // Modération : Mute / Kick / Ban / Delete (PRD Section 10.1)
  const handleModerateAction = async (action: "mute" | "kick" | "ban" | "delete", targetUserId?: string, messageId?: string) => {
    try {
      if (action === "delete" && messageId) {
        await fetch(`/api/wab/salons/${id}/messages?messageId=${encodeURIComponent(messageId)}`, {
          method: "DELETE",
        });
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } else if (targetUserId) {
        let updateBody: any = {};
        if (action === "mute") {
          updateBody = { mutedUserIds: [...(salon?.mutedUserIds || []), targetUserId] };
        } else if (action === "kick" || action === "ban") {
          updateBody = { bannedUserIds: [...(salon?.bannedUserIds || []), targetUserId] };
        }

        await fetch(`/api/wab/salons/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
        });

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "participant_sanction",
            payload: { action, targetUserId },
          });
        }
      }
      setModerationModal(null);
    } catch (err) {
      console.warn("Erreur modération:", err);
    }
  };

  // Signalement (PRD Section 10.2)
  const handleSubmitReport = async () => {
    if (!showReportModal || !reportReason.trim()) return;
    try {
      const res = await fetch(`/api/wab/salons/${id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: showReportModal.targetType,
          targetId: showReportModal.targetId,
          reason: reportReason.trim(),
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setShowReportModal(null);
          setReportSuccess(false);
          setReportReason("");
        }, 2000);
      }
    } catch {}
  };

  // End Live (Host)
  const handleEndLive = async () => {
    try {
      const minutes = Math.floor(liveDurationSeconds / 60);
      const seconds = liveDurationSeconds % 60;
      const formattedDuration = `${minutes > 0 ? `${minutes} min ` : ""}${seconds}s`;

      await fetch(`/api/wab/salons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ended",
          replayPublic: publishReplay,
        }),
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      setShowEndModal(false);
      setLiveSummary({
        duration: formattedDuration || "35 min",
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

  // Photo de profil de l'hôte (réelle ou avatar par défaut élégant)
  const hostAvatar =
    salon.hostAvatarUrl ||
    (isHost && currentUserAvatar ? currentUserAvatar : undefined) ||
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop";

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
        {salon.coHostUserId ? (
          /* Mode Dual Live / Écran partagé TikTok (Hôte + Co-hôte) */
          <div className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 w-full h-full bg-slate-950">
            {/* Slot 1 : Flux Hôte */}
            <div className="relative w-full h-full overflow-hidden border-b md:border-b-0 md:border-r border-white/20 bg-black flex items-center justify-center">
              {isHost ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : remoteHostStream ? (
                <video
                  ref={remoteHostVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : hostLatestFrame ? (
                <img src={hostLatestFrame} alt={salon.host} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400 mb-2">
                    <img src={hostAvatar} alt={salon.host} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-bold text-white">{salon.host}</p>
                </div>
              )}

              {/* Badge Hôte */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">Hôte · {salon.host}</span>
              </div>
            </div>

            {/* Slot 2 : Flux Co-Hôte / Invité */}
            <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
              {isCoHost ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : remoteCoHostStream ? (
                <video
                  ref={remoteCoHostVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 mb-2 bg-amber-900/40 flex items-center justify-center text-xl font-bold text-amber-300">
                    {salon.coHostAvatarUrl ? (
                      <img src={salon.coHostAvatarUrl} alt={salon.coHostName || "Co-hôte"} className="w-full h-full object-cover" />
                    ) : (
                      (salon.coHostName || "C").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <p className="text-xs font-bold text-white">{salon.coHostName || "Invité en direct"}</p>
                  <p className="text-[10px] text-amber-300">Sur scène avec l'hôte</p>
                </div>
              )}

              {/* Badge Invité & Bouton Déconnexion */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400/40 flex items-center gap-1.5 z-10">
                <span className="material-symbols-outlined text-amber-400 text-xs">podium</span>
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  {salon.coHostName || "Invité"}
                </span>
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={handleKickCoHost}
                  className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 transition-transform active:scale-95"
                  title="Faire descendre l'invité de la scène"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                  <span>Descendre</span>
                </button>
              )}
              {isCoHost && (
                <button
                  type="button"
                  onClick={handleLeaveStage}
                  className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 transition-transform active:scale-95"
                  title="Quitter la scène"
                >
                  <span className="material-symbols-outlined text-xs">logout</span>
                  <span>Quitter</span>
                </button>
              )}
            </div>
          </div>
        ) : isHost ? (
          /* Mode Plein Écran Hôte */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
            />
            {(!mediaStream || cameraError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center z-10">
                <span className="material-symbols-outlined text-5xl text-emerald-400 mb-3 animate-pulse">videocam</span>
                <p className="text-base font-black text-white mb-2">Activer votre flux caméra</p>

                {cameraError === "permission_denied" ? (
                  <div className="mb-5 max-w-xs rounded-2xl border border-amber-400/30 bg-amber-950/40 p-3.5 text-left text-xs leading-relaxed text-amber-200">
                    <p className="font-bold flex items-center gap-1.5 text-amber-300 mb-1.5">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Autorisation caméra requise
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Votre navigateur a bloqué l'accès caméra. Pour autoriser :
                    </p>
                    <ol className="mt-1.5 list-decimal pl-4 space-y-1 text-[11px] text-slate-200">
                      <li>Touchez l'icône <strong>🔒</strong> ou <strong>réglages</strong> à gauche de l'adresse web</li>
                      <li>Activez <strong>Appareil photo</strong> et <strong>Microphone</strong></li>
                      <li>Touchez ensuite le bouton ci-dessous</li>
                    </ol>
                  </div>
                ) : cameraError === "in_use" ? (
                  <p className="text-xs text-amber-300 max-w-xs mb-4">
                    La caméra semble déjà utilisée par une autre application. Fermez les autres applications et réessayez.
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 max-w-xs mb-4">
                    {cameraError || "Appuyez sur le bouton ci-dessous pour autoriser et démarrer la vidéo en direct."}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  disabled={startingCamera}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-xs font-black text-white shadow-xl transition-transform active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  <span>{startingCamera ? "Connexion caméra…" : cameraError ? "Réessayer l'activation" : "Démarrer la caméra"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Mode Plein Écran Spectateur */
          <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
            {remoteHostStream ? (
              <video
                ref={remoteHostVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : hostLatestFrame ? (
              <div className="relative w-full h-full">
                <img src={hostLatestFrame} alt={salon.host} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-emerald-600/80 backdrop-blur text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Flux Caméra Direct
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col items-center text-center p-6">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-emerald-400 shadow-2xl animate-pulse">
                    <img
                      src={hostAvatar}
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
                <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Connexion au flux vidéo de l'hôte...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dégradé sombre pour lisibilité du chat et des commandes */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* ======================================================== */}
      {/* BANNIÈRE DEMANDES SUR SCÈNE (Visible par l'hôte)          */}
      {/* ======================================================== */}
      {isHost && pendingGuestRequests.length > 0 && (
        <div className="absolute top-20 left-4 right-4 z-40 max-w-md mx-auto bg-black/85 backdrop-blur-md border border-amber-400/60 rounded-2xl p-3 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-500/30 border border-amber-400/40 shrink-0 flex items-center justify-center font-bold text-amber-300 text-sm">
                {pendingGuestRequests[0].avatarUrl ? (
                  <img src={pendingGuestRequests[0].avatarUrl} alt={pendingGuestRequests[0].name} className="w-full h-full object-cover" />
                ) : (
                  pendingGuestRequests[0].name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-300 truncate">
                  {pendingGuestRequests[0].name}
                </p>
                <p className="text-[11px] text-gray-300">
                  Souhaite monter en direct avec vous
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRejectStage(pendingGuestRequests[0].userId)}
                className="w-8 h-8 rounded-full bg-red-600/30 text-red-300 hover:bg-red-600 hover:text-white flex items-center justify-center transition"
                title="Refuser"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
              <button
                type="button"
                onClick={() => handleAcceptStage(pendingGuestRequests[0].userId, pendingGuestRequests[0].name, pendingGuestRequests[0].avatarUrl)}
                className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow flex items-center gap-1 transition active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Accepter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EN-TÊTE DU LIVE (Overlay Supérieur)                    */}
      {/* ======================================================== */}
      <div className="relative z-20 flex items-center justify-between p-3 sm:p-4 md:px-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Profil de l'Hôte */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1 border border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-700 shrink-0 border border-white/20">
            <img
              src={hostAvatar}
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Top Contributeurs */}
          <button
            type="button"
            onClick={() => setShowTopContributorsDrawer(true)}
            className="h-8 px-2 sm:px-2.5 rounded-full bg-black/50 backdrop-blur-md border border-amber-400/50 text-amber-300 flex items-center gap-1 text-[11px] sm:text-xs font-bold hover:bg-black/70 transition active:scale-95 shadow"
            title="Classement des contributeurs"
          >
            <span className="text-xs">🥇</span>
            <span className="hidden sm:inline font-black max-w-[70px] truncate">
              {topContributors[0]?.name || "Dons"}
            </span>
          </button>

          {/* Solde Coins & Recharger */}
          <button
            type="button"
            onClick={() => setShowRechargeModal(true)}
            className="h-8 px-2 sm:px-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20 border border-yellow-400/60 text-yellow-300 flex items-center gap-1 text-[11px] sm:text-xs font-black hover:bg-yellow-400/30 transition active:scale-95 shadow"
            title="Recharger des Coins WAB"
          >
            <span>🪙</span>
            <span>{myCoins}</span>
            <span className="text-[10px] bg-yellow-400 text-black px-1 rounded-full font-black ml-0.5">+</span>
          </button>

          {/* Bouton Signaler (Spectateur) */}
          {!isHost && (
            <button
              type="button"
              onClick={() => setShowReportModal({ open: true, targetType: "salon", targetId: id })}
              className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-gray-300 hover:text-red-400 hover:border-red-400/40 flex items-center justify-center transition active:scale-95"
              title="Signaler ce live"
            >
              <span className="material-symbols-outlined text-sm">flag</span>
            </button>
          )}

          {(isHost || isCoHost) && (
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
      {/* 4.5 PRODUIT ÉPINGLÉ EN DIRECT (LIVE SHOPPING PRD LOT 4)   */}
      {/* ======================================================== */}
      {pinnedProduct && (
        <div className="absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+19.5rem)] left-4 right-4 max-w-sm z-30 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/50 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-left duration-300">
            <div
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
              onClick={() => setShowProductSheet(true)}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/20 shrink-0 relative">
                <img src={pinnedProduct.image} alt={pinnedProduct.title} className="w-full h-full object-cover" />
                {pinnedProduct.isFlash && (
                  <span className="absolute top-0 left-0 bg-red-600 text-white font-black text-[9px] px-1 rounded-br">
                    FLASH
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                    En vedette
                  </span>
                  {pinnedProduct.isFlash && (
                    <span className="text-[10px] font-black text-red-400 animate-pulse">
                      ⚡ -{pinnedProduct.flashDiscountPercent || 15}%
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate mt-0.5">{pinnedProduct.title}</p>
                <p className="text-xs font-black text-amber-300">
                  {(pinnedProduct.flashPriceXof || pinnedProduct.priceXof || 0).toLocaleString("fr-FR")} XOF
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowProductSheet(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black shadow transition active:scale-95"
              >
                Acheter
              </button>
              {isHost && (
                <button
                  type="button"
                  onClick={handleUnpinProduct}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-600/40 text-gray-300 hover:text-white flex items-center justify-center transition"
                  title="Désépingler le produit"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
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
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2.5 text-xs border border-white/10 leading-relaxed text-amber-300">
            <span className="font-bold">✨ Bienvenue dans le Salon WAB !</span> Respectez les participants et partagez vos opportunités professionnelles.
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`bg-black/55 backdrop-blur-md rounded-2xl px-3 py-2 text-xs border border-white/10 flex items-start gap-2 ${
                m.giftType
                  ? "border-amber-400/60 bg-amber-950/50 text-amber-200"
                  : "text-white"
              }`}
            >
              {m.authorAvatarUrl && (
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5">
                  <img src={m.authorAvatarUrl} alt={m.author} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isHost || isModerator) {
                      setModerationModal({
                        open: true,
                        user: { id: m.userId || m.author, name: m.author, messageId: m.id },
                      });
                    }
                  }}
                  className={`font-extrabold text-emerald-400 mr-1.5 ${
                    isHost || isModerator ? "hover:underline cursor-pointer" : "cursor-default"
                  }`}
                >
                  {m.author || "Spectateur"} :
                </button>
                <span className="leading-snug break-words">{m.content}</span>
              </div>
              {(isHost || isModerator) && (
                <button
                  type="button"
                  onClick={() => handleModerateAction("delete", undefined, m.id)}
                  className="text-gray-400 hover:text-red-400 text-[10px] ml-1 shrink-0 p-0.5"
                  title="Supprimer ce message"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. BARRE D'INTERACTION INFERIEURE (Input, Monter, Cadeau) */}
      {/* ======================================================== */}
      <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
        {/* Champ de saisie commentaire */}
        <div className="flex-1 flex items-center bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 min-w-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={isMuted ? "Vous êtes en sourdine..." : "Ajouter un commentaire..."}
            disabled={isMuted}
            className="w-full bg-transparent text-xs text-white placeholder-white/60 focus:outline-none disabled:opacity-50"
          />
          {inputText.trim() && !isMuted && (
            <button
              type="button"
              onClick={handleSendMessage}
              className="text-emerald-400 hover:text-emerald-300 ml-2 shrink-0"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          )}
        </div>

        {/* Bouton Boutique Live (Hôte) */}
        {isHost && (
          <button
            type="button"
            onClick={() => setShowHostProductsDrawer(true)}
            className="h-11 px-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-lg active:scale-95 transition-all shrink-0 font-bold text-xs"
            title="Gérer les produits Live Shopping"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span className="hidden sm:inline">Boutique</span>
          </button>
        )}

        {/* Bouton Monter sur scène / Live (Spectateur) */}
        {!isHost && !isCoHost && (
          <button
            type="button"
            onClick={handleRequestStage}
            disabled={myStageRequestStatus === "pending"}
            className={`h-11 px-3 rounded-full flex items-center gap-1.5 shadow-lg active:scale-95 transition-all shrink-0 font-bold text-xs ${
              myStageRequestStatus === "pending"
                ? "bg-amber-600/80 text-white cursor-wait"
                : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white ring-2 ring-emerald-400/40"
            }`}
            title="Demander à monter sur le live pour partager son écran / caméra"
          >
            <span className="material-symbols-outlined text-lg">
              {myStageRequestStatus === "pending" ? "hourglass_top" : "podium"}
            </span>
            <span className="hidden sm:inline">
              {myStageRequestStatus === "pending" ? "En attente…" : "Monter"}
            </span>
          </button>
        )}

        {/* Bouton Quitter la scène (Co-Hôte) */}
        {isCoHost && (
          <button
            type="button"
            onClick={handleLeaveStage}
            className="h-11 px-3 rounded-full bg-red-600/80 hover:bg-red-700 text-white flex items-center gap-1 text-xs font-bold shrink-0 shadow-lg active:scale-95"
            title="Descendre de scène et redevenir spectateur"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:inline">Quitter</span>
          </button>
        )}

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
      {/* 7. TIROIR DES CADEAUX VIRTUELS & COINS (PRD LOT 3)       */}
      {/* ======================================================== */}
      {showGiftDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border-t border-amber-400/30 rounded-t-3xl p-5 max-w-lg mx-auto w-full shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Header du tiroir */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <div>
                  <h3 className="font-display font-black text-sm text-white">
                    Envoyer un Cadeau en Direct
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Soutenez l'hôte et boostez la visibilité du salon
                  </p>
                </div>
              </div>

              {/* Solde & Recharger */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-black">
                  <span>🪙</span>
                  <span>{myCoins}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowGiftDrawer(false);
                    setShowRechargeModal(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[11px] font-black hover:opacity-90 active:scale-95 transition"
                >
                  + Recharger
                </button>
                <button
                  type="button"
                  onClick={() => setShowGiftDrawer(false)}
                  className="w-7 h-7 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center ml-1"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            </div>

            {/* Sélecteur de quantité rapide (Style TikTok) */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-gray-400 text-[11px] font-bold">Quantité :</span>
              <div className="flex items-center gap-1.5">
                {[1, 5, 10].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setGiftQuantity(qty)}
                    className={`px-2.5 py-0.5 rounded-full font-black text-xs transition ${
                      giftQuantity === qty
                        ? "bg-amber-400 text-black shadow"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    x{qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des cadeaux */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {VIRTUAL_GIFTS.map((gift) => {
                const totalCost = gift.coins * giftQuantity;
                const canAfford = myCoins >= totalCost;
                return (
                  <button
                    key={gift.id}
                    type="button"
                    onClick={() => handleSendGift(gift, giftQuantity)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center relative ${
                      canAfford
                        ? "bg-white/5 hover:bg-white/15 border-white/15 hover:border-amber-400/50 hover:scale-105 active:scale-95"
                        : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <span className="text-3xl mb-1 drop-shadow">{gift.emoji}</span>
                    <span className="text-[11px] font-bold text-white line-clamp-1">
                      {gift.name}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-[11px] font-black text-amber-300">
                      <span>🪙</span>
                      <span>{totalCost}</span>
                    </div>
                    <span className="text-[9px] text-gray-400">
                      ({gift.priceXof * giftQuantity} F)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. FICHE PRODUIT ÉPINGLÉ (LIVE SHOPPING SPECTATEUR)      */}
      {/* ======================================================== */}
      {showProductSheet && pinnedProduct && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border-t border-emerald-500/40 rounded-t-3xl p-6 max-w-lg mx-auto w-full shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">shopping_bag</span>
                <h3 className="font-display font-black text-sm text-white">
                  Achat en Direct sous Séquestre WAB
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProductSheet(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex gap-4 items-start mb-5">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/50 border border-white/20 shrink-0 relative">
                <img src={pinnedProduct.image} alt={pinnedProduct.title} className="w-full h-full object-cover" />
                {pinnedProduct.isFlash && (
                  <span className="absolute top-1 left-1 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                    VENTE FLASH
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                    Marketplace WAB
                  </span>
                  {pinnedProduct.vendorName && (
                    <span className="text-[11px] text-gray-400 truncate">
                      Par {pinnedProduct.vendorName}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white text-base mt-1 line-clamp-2">
                  {pinnedProduct.title}
                </h4>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-display font-black text-amber-300">
                    {(pinnedProduct.flashPriceXof || pinnedProduct.priceXof || 0).toLocaleString("fr-FR")} XOF
                  </span>
                  {pinnedProduct.isFlash && (
                    <span className="text-xs text-gray-400 line-through">
                      {(pinnedProduct.priceXof || 0).toLocaleString("fr-FR")} XOF
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                  Paiement bloqué sous séquestre jusqu'à livraison conforme
                </p>
              </div>
            </div>

            {/* Actions d'achat */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={buyingProduct}
                onClick={() => handleBuyProductNow(pinnedProduct, "full")}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">bolt</span>
                <span>Acheter en 1-Clic (Moneroo / Mobile Money)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart(pinnedProduct)}
                className="w-full py-2.5 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>Ajouter au Panier WAB (/panier)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. TIROIR BOUTIQUE DU LIVE SHOPPING (HÔTE)                */}
      {/* ======================================================== */}
      {showHostProductsDrawer && isHost && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border-t border-purple-500/40 rounded-t-3xl p-6 max-w-lg mx-auto w-full max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-2xl">storefront</span>
                <div>
                  <h3 className="font-display font-black text-sm text-white">
                    Boutique Live Shopping
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Épinglez un produit Marketplace en vedette pendant votre direct
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHostProductsDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Produit actuellement épinglé */}
            {pinnedProduct && (
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/50 mb-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/50 border border-white/20 shrink-0">
                    <img src={pinnedProduct.image} alt={pinnedProduct.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase text-purple-300">Actuellement Épinglé</span>
                    <p className="text-xs font-bold text-white truncate">{pinnedProduct.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUnpinProduct}
                  className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-700 text-white font-black text-xs shrink-0 transition"
                >
                  Désépingler
                </button>
              </div>
            )}

            {/* Liste des produits disponibles */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {availableProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <span className="material-symbols-outlined text-3xl mb-2 text-gray-500">inventory_2</span>
                  <p>Aucun produit Marketplace disponible.</p>
                </div>
              ) : (
                availableProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-400/40 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-white/20 shrink-0">
                        <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{prod.title}</p>
                        <p className="text-xs font-black text-amber-300">
                          {(prod.priceXof || 0).toLocaleString("fr-FR")} XOF
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePinProduct(prod, false)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] transition active:scale-95"
                      >
                        Épingler
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePinProduct(prod, true, 15, 10)}
                        className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-[11px] shadow transition active:scale-95"
                        title="Vente Flash -15% pendant 10 minutes"
                      >
                        ⚡ Flash -15%
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 10. MODAL RECHARGE COINS WAB (PRD LOT 3)                 */}
      {/* ======================================================== */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-amber-400/50 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 border border-yellow-400/40 text-yellow-300 flex items-center justify-center mx-auto mb-3 text-2xl">
              🪙
            </div>
            <h3 className="font-display font-black text-lg text-white mb-1">
              Recharger des Coins WAB
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Utilisez vos Coins pour offrir des cadeaux virtuels et soutenir vos créateurs préférés.
            </p>

            <div className="space-y-2.5 mb-6 text-left">
              {[
                { id: "pack-100", coins: 100, priceXof: 1000, label: "Découverte" },
                { id: "pack-500", coins: 500, priceXof: 4750, label: "Populaire (-5%)", badge: "POPULAIRE" },
                { id: "pack-1200", coins: 1200, priceXof: 10800, label: "Super Fan (-10%)" },
                { id: "pack-3000", coins: 3000, priceXof: 25500, label: "Mécène VIP (-15%)", badge: "VIP" },
              ].map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  disabled={recharging}
                  onClick={() => handleRechargePack(pack)}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/60 flex items-center justify-between transition group active:scale-98 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🪙</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{pack.coins} Coins</span>
                        {pack.badge && (
                          <span className="text-[9px] font-black bg-amber-400 text-black px-1.5 py-0.2 rounded">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{pack.label}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-300">
                    {pack.priceXof.toLocaleString("fr-FR")} XOF
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowRechargeModal(false)}
              className="w-full py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 11. CLASSEMENT DES TOP CONTRIBUTEURS (PRD LOT 3)          */}
      {/* ======================================================== */}
      {showTopContributorsDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border-t border-amber-400/40 rounded-t-3xl p-6 max-w-lg mx-auto w-full max-h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="font-display font-black text-sm text-white">
                    Top Contributeurs du Salon
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Membres ayant le plus soutenu ce direct
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopContributorsDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-300 hover:text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {topContributors.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  <span className="text-3xl mb-2 block">🎁</span>
                  <p>Aucun don enregistré pour le moment.</p>
                  <p className="text-[10px] text-gray-500 mt-1">Soyez le premier à offrir un cadeau à l'hôte !</p>
                </div>
              ) : (
                topContributors.map((c, idx) => (
                  <div
                    key={c.name}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-display font-black text-base w-6 text-center">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-amber-500/20 border border-amber-400/30 shrink-0">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-amber-300 text-xs">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    </div>

                    <div className="flex items-center gap-1 font-display font-black text-xs text-amber-300">
                      <span>🪙</span>
                      <span>{c.totalCoins} Coins</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 12. FEUILLE D'ACTION MODÉRATION (HÔTE / MODÉRATEUR)       */}
      {/* ======================================================== */}
      {moderationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-red-500/40 rounded-3xl max-w-xs w-full p-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-2xl">gavel</span>
            </div>
            <h3 className="font-display font-black text-sm text-white mb-0.5">
              Modérer {moderationModal.user.name}
            </h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Sélectionnez une action de modération pour ce participant.
            </p>

            <div className="space-y-2 mb-4 text-left text-xs font-bold">
              <button
                type="button"
                onClick={() => handleModerateAction("mute", moderationModal.user.id)}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 border border-white/10 transition"
              >
                <span className="material-symbols-outlined text-base text-amber-400">volume_off</span>
                <span>Mettre en sourdine (Mute)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModerateAction("kick", moderationModal.user.id)}
                className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 flex items-center gap-2 border border-white/10 transition"
              >
                <span className="material-symbols-outlined text-base text-amber-400">logout</span>
                <span>Expulser du live (Kick)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModerateAction("ban", moderationModal.user.id)}
                className="w-full p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 flex items-center gap-2 border border-red-500/30 transition"
              >
                <span className="material-symbols-outlined text-base text-red-400">block</span>
                <span>Bannir définitivement</span>
              </button>

              {moderationModal.user.messageId && (
                <button
                  type="button"
                  onClick={() => handleModerateAction("delete", undefined, moderationModal.user.messageId)}
                  className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 flex items-center gap-2 border border-white/10 transition"
                >
                  <span className="material-symbols-outlined text-base text-gray-400">delete</span>
                  <span>Supprimer ce message</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModerationModal(null)}
              className="w-full py-2 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 13. MODAL SIGNALEMENT SPECTATEUR (PRD LOT 5)             */}
      {/* ======================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-white/20 rounded-3xl max-w-sm w-full p-6 text-left shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-red-400 text-xl">flag</span>
              <h3 className="font-display font-black text-sm text-white">
                Signaler ce salon ou un participant
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Aidez l'équipe de modération WAB à maintenir un environnement professionnel et bienveillant.
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs text-center font-bold">
                ✓ Signalement transmis à l'équipe de modération. Merci de votre contribution !
              </div>
            ) : (
              <>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Motif du signalement :
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white mb-4 focus:outline-none focus:border-red-400"
                >
                  <option value="">Sélectionnez un motif...</option>
                  <option value="Propos injurieux ou haineux">Propos injurieux ou haineux</option>
                  <option value="Tentative de fraude / vente hors-plateforme">Tentative de fraude / vente hors-plateforme</option>
                  <option value="Contenu à caractère inapproprié">Contenu à caractère inapproprié</option>
                  <option value="Spam ou harcèlement répétitif">Spam ou harcèlement répétitif</option>
                  <option value="Autre motif grave">Autre motif grave</option>
                </select>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!reportReason}
                    onClick={handleSubmitReport}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-xs font-bold text-white"
                  >
                    Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 14. MODAL CONFIRMATION ARRÊT DU LIVE                     */}
      {/* ======================================================== */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#181a1b] border border-white/20 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
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
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-lg active:scale-95 transition"
              >
                Arrêter le Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 15. MODAL BILAN POST-LIVE (PRD LOT 6)                     */}
      {/* ======================================================== */}
      {liveSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#181a1b] border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
              <span className="material-symbols-outlined text-3xl">emoji_events</span>
            </div>
            <h3 className="font-display font-black text-xl text-white mb-1">
              Direct Terminé !
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Bilan de votre salon professionnel sur World Africa Business.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] text-gray-400 uppercase font-black">Durée</span>
                <p className="text-base font-black text-white">{liveSummary.duration}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] text-gray-400 uppercase font-black">Spectateurs</span>
                <p className="text-base font-black text-emerald-400">{liveSummary.viewers}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] text-gray-400 uppercase font-black">J'aime reçus</span>
                <p className="text-base font-black text-red-400">{liveSummary.likes}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] text-gray-400 uppercase font-black">Cadeaux collectés</span>
                <p className="text-base font-black text-amber-300">{giftCount}</p>
              </div>
            </div>

            {/* Toggle Replay */}
            {isHost && (
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 mb-5 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={publishReplay}
                  onChange={(e) => setPublishReplay(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs text-gray-300 font-bold leading-tight">
                  Publier le replay du salon pour la communauté WAB
                </span>
              </label>
            )}

            <div className="space-y-2">
              {isHost && (
                <Link
                  href="/wab/createur"
                  className="block w-full py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs text-center shadow-lg transition active:scale-95"
                >
                  Voir mes gains créateur
                </Link>
              )}
              <Link
                href="/wab/salons"
                className="block w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs text-center transition"
              >
                Retour aux Salons
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 16. TOAST NOTIFICATIONS (ACHAT & PANIER)                 */}
      {/* ======================================================== */}
      {purchaseToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-base">verified</span>
          <span>{purchaseToast}</span>
        </div>
      )}

      {cartSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-400 text-white px-4 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
          <span>Produit ajouté au panier WAB !</span>
          <Link href="/panier" className="underline text-emerald-300 font-black ml-1">
            Voir mon panier
          </Link>
        </div>
      )}
    </div>
  );
}
