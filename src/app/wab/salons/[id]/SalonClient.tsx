"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

interface Salon {
  id: string;
  hostUserId: string;
  host: string;
  hostAvatarUrl?: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  replayUrl?: string;
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
}

interface Message {
  id: string;
  author: string;
  authorAvatarUrl?: string;
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

  // Send Virtual Gift
  const handleSendGift = async (gift: (typeof VIRTUAL_GIFTS)[0]) => {
    setShowGiftDrawer(false);
    setActiveGiftAnimation({ emoji: gift.emoji, name: gift.name });
    setGiftCount((prev) => prev + 1);

    // Burst hearts
    for (let i = 0; i < 6; i++) {
      setTimeout(() => triggerHeart(), i * 150);
    }

    // Broadcast cadeau
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "live_gift",
        payload: { emoji: gift.emoji, name: gift.name, senderName: currentUserName },
      });
    }

    setTimeout(() => {
      setActiveGiftAnimation(null);
    }, 2800);

    const giftMessageText = `a offert un cadeau : ${gift.name} ${gift.emoji}`;
    const authorDisplayName = currentUserName && currentUserName !== "Moi" ? currentUserName : "Spectateur WAB";

    try {
      const res = await fetch(`/api/wab/salons/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: giftMessageText,
          author: authorDisplayName,
          authorAvatarUrl: currentUserAvatar,
          giftType: gift.id,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch {}
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

  // End Live (Host)
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
        <div className="flex items-center gap-2">
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
                <span className="font-extrabold text-emerald-400 mr-1.5">{m.author || "Spectateur"} :</span>
                <span className="leading-snug break-words">{m.content}</span>
              </div>
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
            placeholder="Ajouter un commentaire..."
            className="w-full bg-transparent text-xs text-white placeholder-white/60 focus:outline-none"
          />
          {inputText.trim() && (
            <button
              type="button"
              onClick={handleSendMessage}
              className="text-emerald-400 hover:text-emerald-300 ml-2 shrink-0"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          )}
        </div>

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
              className="block w-full py-3 rounded-full bg-[#9e001f] text-white font-bold text-xs text-center"
            >
              Retour aux Salons
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
