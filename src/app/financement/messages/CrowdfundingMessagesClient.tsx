"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

interface UserProfile {
  id: string;
  email: string;
  nom?: string;
  prenom?: string;
  avatar?: string;
  role?: string;
}

interface CrowdfundingSpaceItem {
  id: string;
  projetId: string;
  porteurId: string;
  title: string;
  campaignMode: "don" | "prise_part" | "pret" | "mixte";
  status: "actif" | "archive" | "en_litige";
  createdAt: string;
  updatedAt: string;
  projectNom?: string;
  projectSecteur?: string;
  projectPays?: string;
  projectImage?: string;
  montantCollecte?: number;
  montantRecherche?: number;
  niveauRisque?: string;
  investisseursCount?: number;
  unreadCount?: number;
  lastMessage?: {
    content?: string;
    senderName?: string;
    createdAt?: string;
    isUpdate?: boolean;
  };
}

interface ParticipantItem {
  id: string;
  spaceId: string;
  userId: string;
  nom: string;
  avatar?: string;
  role: "porteur" | "investisseur" | "admin";
  investmentId?: string;
  investmentMode: "don" | "prise_part" | "pret";
  investedAmount: number;
  percentage?: number;
  interestRate?: number;
  status: "actif" | "revoque" | "mute";
  joinedAt: string;
}

interface AttachmentItem {
  id: string;
  messageId: string;
  type: "document" | "image" | "video" | "voice";
  url: string;
  name: string;
  size: number;
  duration?: number;
  mimeType?: string;
  createdAt?: string;
}

interface MessageItem {
  id: string;
  spaceId: string;
  senderId: string;
  senderRole: "porteur" | "investisseur" | "admin" | "system";
  senderName: string;
  senderAvatar?: string;
  content: string;
  isUpdate: boolean;
  updateTitle?: string;
  isPinned: boolean;
  mentions: string[];
  readBy: string[];
  createdAt: string;
  attachments: AttachmentItem[];
}

export default function CrowdfundingMessagesClient() {
  const { formatPrice } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const querySpaceId = searchParams.get("spaceId");
  const queryProjetId = searchParams.get("projetId");

  // User state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Spaces list state
  const [spaces, setSpaces] = useState<CrowdfundingSpaceItem[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [spaceSearchQuery, setSpaceSearchQuery] = useState("");

  // Active space details
  const [activeSpace, setActiveSpace] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [currentUserParticipant, setCurrentUserParticipant] = useState<ParticipantItem | null>(null);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [settings, setSettings] = useState<{ showAmountsToInvestors?: boolean; allowInvestorCalls?: boolean }>({});

  // Messages state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filterUpdatesOnly, setFilterUpdatesOnly] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");

  // Input states
  const [inputText, setInputText] = useState("");
  const [isOfficialUpdate, setIsOfficialUpdate] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    type: "document" | "image" | "video" | "voice";
    url: string;
    name: string;
    size: number;
    duration?: number;
    mimeType?: string;
  }>>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Audio recording state
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC / Call Modal State
  const [activeCall, setActiveCall] = useState<{
    id: string;
    callType: "audio" | "video";
    isGroup: boolean;
    participants: string[];
    seconds: number;
    isMuted: boolean;
    isVideoOff: boolean;
  } | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Drawers and Modals
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "message" | "participant" | "space"; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("Non-respect des engagements du projet");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Mobile layout switch
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // 1. Fetch authenticated user
  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const d = await res.json();
          if (d.user) setUser(d.user);
        }
      } catch (err) {
        console.error("Auth fetch failed:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    loadAuth();
  }, []);

  // Mark platform in sessionStorage for automatic routing
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eam_current_platform", "crowdfunding");
    }
  }, []);

  // 2. Fetch accessible spaces for user
  const fetchSpaces = useCallback(async () => {
    try {
      setLoadingSpaces(true);
      const res = await fetch("/api/crowdfunding/messages/spaces");
      if (res.ok) {
        const d = await res.json();
        const incomingSpaces: CrowdfundingSpaceItem[] = d.spaces || [];
        setSpaces(incomingSpaces);

        // Si un spaceId ou projetId est dans l'URL, le sélectionner
        if (querySpaceId) {
          const found = incomingSpaces.find((s) => s.id === querySpaceId);
          if (found) {
            setActiveSpaceId(found.id);
            setMobileView("chat");
          }
        } else if (queryProjetId) {
          const found = incomingSpaces.find((s) => s.projetId === queryProjetId);
          if (found) {
            setActiveSpaceId(found.id);
            setMobileView("chat");
          } else if (incomingSpaces.length > 0) {
            setActiveSpaceId(incomingSpaces[0].id);
          }
        } else if (incomingSpaces.length > 0 && !activeSpaceId) {
          setActiveSpaceId(incomingSpaces[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load spaces:", err);
    } finally {
      setLoadingSpaces(false);
    }
  }, [querySpaceId, queryProjetId, activeSpaceId]);

  useEffect(() => {
    if (user) {
      fetchSpaces();
    }
  }, [user, fetchSpaces]);

  // 3. Fetch active space details and messages
  const fetchMessagesAndDetails = useCallback(async (spaceId: string, filterUpdates = false, search = "") => {
    try {
      setLoadingMessages(true);
      const url = new URL("/api/crowdfunding/messages", window.location.origin);
      url.searchParams.set("spaceId", spaceId);
      if (filterUpdates) url.searchParams.set("filter", "updates");
      if (search) url.searchParams.set("search", search);

      const res = await fetch(url.toString());
      if (res.ok) {
        const d = await res.json();
        setActiveSpace(d.space);
        setProjectData(d.project);
        setCurrentUserParticipant(d.participant);
        setParticipants(d.participants || []);
        setSettings(d.settings || {});
        setMessages(d.messages || []);
      } else if (res.status === 403) {
        showToast("Accès réservé aux investisseurs confirmés et au porteur de ce projet.", "error");
        setActiveSpace(null);
      }
    } catch (err) {
      console.error("Failed to load space messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeSpaceId) {
      fetchMessagesAndDetails(activeSpaceId, filterUpdatesOnly, messageSearchQuery);
      // Polling léger toutes les 6 secondes
      const interval = setInterval(() => {
        fetchMessagesAndDetails(activeSpaceId, filterUpdatesOnly, messageSearchQuery);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [activeSpaceId, filterUpdatesOnly, messageSearchQuery, fetchMessagesAndDetails]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // Handle file uploads (Docs, Images, Videos)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/crowdfunding/messages/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPendingAttachments((prev) => [
            ...prev,
            {
              type: data.type,
              url: data.url,
              name: data.name,
              size: data.size,
              mimeType: data.mimeType,
            },
          ]);
        } else {
          showToast(data.error || "Erreur de téléversement.", "error");
        }
      } catch (err) {
        showToast("Erreur de connexion lors de l'envoi du fichier.", "error");
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Audio Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `note_vocale_${Date.now()}.webm`, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("type", "voice");
        formData.append("duration", String(recordSeconds));

        setUploading(true);
        try {
          const res = await fetch("/api/crowdfunding/messages/upload", {
            method: "POST",
            body: formData,
          });
          const d = await res.json();
          if (res.ok && d.success) {
            setPendingAttachments((prev) => [
              ...prev,
              {
                type: "voice",
                url: d.url,
                name: d.name,
                size: d.size,
                duration: recordSeconds,
                mimeType: d.mimeType,
              },
            ]);
            showToast("Note vocale prête à être envoyée !", "success");
          }
        } catch {
          showToast("Échec de l'enregistrement audio.", "error");
        } finally {
          setUploading(false);
          setRecordSeconds(0);
        }

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordSeconds(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      showToast("Impossible d'accéder au microphone.", "error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      audioChunksRef.current = [];
      setRecordSeconds(0);
    }
  };

  // Send message with combined content
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSpaceId || (!inputText.trim() && pendingAttachments.length === 0)) return;

    setSending(true);
    try {
      // Extraction automatique des mentions @nom
      const mentionRegex = /@([a-zA-Z0-9_\u00C0-\u017F]+)/g;
      const mentionsFound: string[] = [];
      let match;
      while ((match = mentionRegex.exec(inputText)) !== null) {
        mentionsFound.push(match[1]);
      }

      const res = await fetch("/api/crowdfunding/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: activeSpaceId,
          content: inputText.trim(),
          isUpdate: isOfficialUpdate,
          updateTitle: isOfficialUpdate ? updateTitle.trim() || "Mise à jour officielle" : undefined,
          mentions: mentionsFound,
          attachments: pendingAttachments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
        setIsOfficialUpdate(false);
        setUpdateTitle("");
        setPendingAttachments([]);
        scrollToBottom(true);
        showToast(isOfficialUpdate ? "Mise à jour officielle diffusée à tous les investisseurs !" : "Message envoyé.", "success");
      } else {
        showToast(data.error || "Impossible d'envoyer le message.", "error");
      }
    } catch {
      showToast("Erreur de connexion au serveur.", "error");
    } finally {
      setSending(false);
    }
  };

  // Pin message handler
  const handleTogglePin = async (messageId: string) => {
    if (!activeSpaceId) return;
    try {
      const res = await fetch("/api/crowdfunding/messages/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: activeSpaceId, messageId }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPinned: !m.isPinned } : m))
        );
        showToast("Statut d'épinglage modifié.", "success");
      } else {
        showToast("Action réservée au porteur du projet.", "error");
      }
    } catch {
      showToast("Erreur lors de l'épinglage.", "error");
    }
  };

  // Start Call (1:1 or Group)
  const handleStartCall = async (callType: "audio" | "video", isGroup: boolean, participantUserIds: string[]) => {
    if (!activeSpaceId) return;
    try {
      const res = await fetch("/api/crowdfunding/messages/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          spaceId: activeSpaceId,
          callType,
          isGroup,
          participants: participantUserIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveCall({
          id: data.call.id,
          callType,
          isGroup,
          participants: participantUserIds,
          seconds: 0,
          isMuted: false,
          isVideoOff: false,
        });

        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setActiveCall((c) => (c ? { ...c, seconds: c.seconds + 1 } : null));
        }, 1000);
      } else {
        showToast(data.error || "Impossible de démarrer l'appel.", "error");
      }
    } catch {
      showToast("Erreur lors de l'appel.", "error");
    }
  };

  // End Call
  const handleEndCall = async () => {
    if (!activeCall) return;
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    try {
      await fetch("/api/crowdfunding/messages/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          callId: activeCall.id,
          durationSeconds: activeCall.seconds,
        }),
      });
      showToast("Appel terminé avec succès.", "info");
      if (activeSpaceId) fetchMessagesAndDetails(activeSpaceId, filterUpdatesOnly, messageSearchQuery);
    } catch (err) {
      console.error(err);
    } finally {
      setActiveCall(null);
    }
  };

  // Kick participant handler (Porteur only)
  const handleKickParticipant = async (targetUserId: string, targetName: string) => {
    if (!activeSpaceId) return;
    const reason = window.prompt(`Confirmer l'exclusion de ${targetName} de la messagerie pour abus :\nMotif :`, "Comportement inapproprié");
    if (!reason) return;

    try {
      const res = await fetch("/api/crowdfunding/messages/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId: activeSpaceId, targetUserId, reason }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast("Participant exclu de la messagerie.", "success");
        if (activeSpaceId) fetchMessagesAndDetails(activeSpaceId);
      } else {
        showToast(d.error || "Action non autorisée.", "error");
      }
    } catch {
      showToast("Erreur serveur.", "error");
    }
  };

  // Report modal submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSpaceId || !reportTarget) return;

    setReportSubmitting(true);
    try {
      const res = await fetch("/api/crowdfunding/messages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: activeSpaceId,
          targetType: reportTarget.type,
          targetId: reportTarget.id,
          reason: reportReason,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        showToast(d.message || "Signalement transmis à l'équipe de modération.", "success");
        setShowReportModal(false);
        setReportTarget(null);
      } else {
        showToast(d.error || "Erreur de signalement.", "error");
      }
    } catch {
      showToast("Erreur de connexion.", "error");
    } finally {
      setReportSubmitting(false);
    }
  };

  // Settings update
  const handleSaveSettings = async () => {
    if (!activeSpace?.projetId) return;
    try {
      const res = await fetch("/api/crowdfunding/messages/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projetId: activeSpace.projetId,
          showAmountsToInvestors: settings.showAmountsToInvestors,
          allowInvestorCalls: settings.allowInvestorCalls,
        }),
      });
      if (res.ok) {
        showToast("Paramètres de confidentialité enregistrés.", "success");
        setShowSettingsModal(false);
      } else {
        showToast("Seul le porteur du projet peut modifier les paramètres.", "error");
      }
    } catch {
      showToast("Erreur lors de la mise à jour des paramètres.", "error");
    }
  };

  // Filtered spaces by search
  const filteredSpaces = spaces.filter((s) => {
    if (!spaceSearchQuery.trim()) return true;
    const q = spaceSearchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.projectNom && s.projectNom.toLowerCase().includes(q)) ||
      (s.projectSecteur && s.projectSecteur.toLowerCase().includes(q))
    );
  });

  const isPorteur = currentUserParticipant?.role === "porteur" || user?.role === "admin";
  const pinnedMessages = messages.filter((m) => m.isPinned);

  // Format seconds to mm:ss
  const formatCallTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#071322] text-slate-100 antialiased overflow-hidden font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-[#134074] text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "info"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER: Switcher 3 Messageries & Branding */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-[#0B2545] px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/financement"
            className="flex items-center gap-2 hover:opacity-85 transition"
            title="Retour au module Crowdfunding"
          >
            <span className="material-symbols-outlined text-amber-400 text-[22px]">arrow_back</span>
            <span className="hidden sm:inline text-xs font-black uppercase tracking-wider text-amber-400">
              AfricaCrowdFunding
            </span>
          </Link>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <img
              src="/crowdfunding-message-icon.png"
              alt="Messagerie Investisseurs"
              className="h-6 w-6 object-contain"
            />
            <h1 className="text-sm font-black tracking-tight text-white">
              Espace Investisseurs & Porteurs
            </h1>
          </div>
        </div>

        {/* Multi-Platform 3-Way Switcher */}
        <div className="flex items-center rounded-full bg-black/40 p-1 border border-slate-700/60 text-xs font-bold">
          <Link
            href="/messages"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-slate-300 hover:text-white transition"
            title="Messagerie Réseau WAB"
          >
            <span className="material-symbols-outlined text-[15px]">chat</span>
            <span className="hidden md:inline">Réseau WAB</span>
          </Link>
          <Link
            href="/marketplace/messages"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-slate-300 hover:text-white transition"
            title="Messagerie Marketplace ComeUp"
          >
            <span className="material-symbols-outlined text-[15px]">storefront</span>
            <span className="hidden md:inline">Marketplace</span>
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-1 text-white shadow-md">
            <img src="/crowdfunding-message-icon.png" alt="" className="h-3.5 w-3.5 object-contain" />
            <span>Crowdfunding</span>
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: LISTE DES ESPACES DE PROJETS */}
        <aside
          className={`flex w-full flex-col border-r border-slate-800 bg-[#0A192F] md:w-80 lg:w-96 shrink-0 ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header de la liste */}
          <div className="p-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Mes Salles de Projet ({filteredSpaces.length})
              </span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                🔒 Investissement confirmé
              </span>
            </div>
            {/* Search spaces input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-slate-500">
                search
              </span>
              <input
                type="text"
                value={spaceSearchQuery}
                onChange={(e) => setSpaceSearchQuery(e.target.value)}
                placeholder="Rechercher une campagne..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Liste des espaces */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {loadingSpaces ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <span className="material-symbols-outlined animate-spin text-3xl text-amber-500 mb-2">
                  progress_activity
                </span>
                <p className="text-xs">Chargement de vos espaces investisseurs...</p>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
                  <span className="material-symbols-outlined text-2xl">lock</span>
                </div>
                <h3 className="text-sm font-bold text-slate-200">Aucun espace débloqué</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[260px]">
                  L'accès à la salle de discussion d'un projet s'active automatiquement dès confirmation de votre
                  don, participation ou prêt.
                </p>
                <Link
                  href="/financement#projets"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 transition"
                >
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  Découvrir les projets
                </Link>
              </div>
            ) : (
              filteredSpaces.map((space) => {
                const isActive = activeSpaceId === space.id;
                const isUserPorteur = space.porteurId === user?.id;
                const pct = Math.round(((space.montantCollecte || 0) / (space.montantRecherche || 1)) * 100);

                return (
                  <button
                    type="button"
                    key={space.id}
                    onClick={() => {
                      setActiveSpaceId(space.id);
                      setMobileView("chat");
                    }}
                    className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-slate-800/40 ${
                      isActive ? "bg-slate-800/80 border-l-4 border-amber-500" : ""
                    }`}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                      {space.projectImage ? (
                        <img src={space.projectImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-amber-400">
                          <span className="material-symbols-outlined text-2xl">campaign</span>
                        </div>
                      )}
                      {space.unreadCount && space.unreadCount > 0 ? (
                        <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white">
                          {space.unreadCount}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="truncate text-xs font-bold text-slate-100">{space.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {space.lastMessage?.createdAt
                            ? new Date(space.lastMessage.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`rounded-full px-2 py-0.2 text-[9px] font-extrabold uppercase ${
                            isUserPorteur
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {isUserPorteur ? "Porteur" : "Investisseur"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {pct}% · {space.investisseursCount || 0} participants
                        </span>
                      </div>

                      <p className="mt-1.5 truncate text-[11px] text-slate-300">
                        {space.lastMessage?.isUpdate ? (
                          <span className="font-bold text-amber-400">📢 Mise à jour : </span>
                        ) : null}
                        {space.lastMessage?.content || "Aucun message échangé pour le moment."}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: ACTIVE PROJECT CONVERSATION */}
        <main
          className={`flex flex-1 flex-col bg-[#071322] ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {activeSpace ? (
            <>
              {/* CAMPAIGN BANNER / PERSISTENT CONTEXT HEADER */}
              <div className="border-b border-slate-800 bg-[#0A192F] p-3 shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back to list button on mobile */}
                    <button
                      type="button"
                      onClick={() => setMobileView("list")}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-slate-300 md:hidden"
                      aria-label="Retour à la liste des espaces"
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="truncate text-sm sm:text-base font-black text-white">
                          {activeSpace.title}
                        </h2>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                          {projectData?.secteur || activeSpace.campaignMode}
                        </span>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          {projectData?.pays || "Panafricain"}
                        </span>
                      </div>

                      {/* Barre de progression & métriques */}
                      {projectData && (
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-300 flex-wrap">
                          <span className="font-bold text-amber-400">
                            {formatPrice(projectData.montantCollecte || 0)} / {formatPrice(projectData.montantRecherche || 1)}
                          </span>
                          <span className="text-slate-400">
                            ({Math.round(((projectData.montantCollecte || 0) / (projectData.montantRecherche || 1)) * 100)}%)
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-300">
                            {participants.length} investisseur{participants.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Header Bar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Filter Official Updates */}
                    <button
                      type="button"
                      onClick={() => setFilterUpdatesOnly(!filterUpdatesOnly)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition border ${
                        filterUpdatesOnly
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                      }`}
                      title="Afficher uniquement les annonces et rapports officiels"
                    >
                      <span className="material-symbols-outlined text-[16px]">campaign</span>
                      <span className="hidden sm:inline">Mises à jour</span>
                    </button>

                    {/* Group Call Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleStartCall(
                          "video",
                          true,
                          participants.map((p) => p.userId)
                        )
                      }
                      className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition"
                      title="Lancer une réunion d'information investisseurs"
                    >
                      <span className="material-symbols-outlined text-[16px]">video_call</span>
                      <span className="hidden lg:inline">Réunion</span>
                    </button>

                    {/* Participants Drawer Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowParticipantsDrawer(!showParticipantsDrawer)}
                      className="grid h-8 w-8 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="Voir les investisseurs confirmés"
                    >
                      <span className="material-symbols-outlined text-[18px]">group</span>
                    </button>

                    {/* Porteur Settings Modal Toggle */}
                    {isPorteur && (
                      <button
                        type="button"
                        onClick={() => setShowSettingsModal(true)}
                        className="grid h-8 w-8 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                        title="Paramètres de confidentialité de la campagne"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar in Active Space */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-2 top-1.5 text-[16px] text-slate-500">
                      search
                    </span>
                    <input
                      type="text"
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      placeholder="Filtrer les messages ou documents..."
                      className="h-7 w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-7 pr-2 text-[11px] text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500"
                    />
                  </div>
                  {messageSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMessageSearchQuery("")}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Pinned Messages Header Alert */}
                {pinnedMessages.length > 0 && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-amber-500/10 px-2.5 py-1.5 border border-amber-500/30 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0">
                        push_pin
                      </span>
                      <p className="truncate text-[11px] text-amber-200">
                        <strong className="font-bold">Message épinglé :</strong>{" "}
                        {pinnedMessages[0].content || pinnedMessages[0].updateTitle || "Document important"}
                      </p>
                    </div>
                    {isPorteur && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(pinnedMessages[0].id)}
                        className="text-[10px] text-amber-400 hover:underline shrink-0 ml-2"
                      >
                        Détacher
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* TIMELINE MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
                    <span className="material-symbols-outlined animate-spin text-2xl text-amber-500 mr-2">
                      progress_activity
                    </span>
                    Chargement des échanges...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">
                      forum
                    </span>
                    <p className="text-xs font-semibold text-slate-300">
                      Bienvenue dans la salle des investisseurs de {activeSpace.title}.
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500 max-w-sm">
                      Cet espace réunit le porteur et les financeurs confirmés. Posez vos questions, partagez des
                      justificatifs ou échangez en toute transparence.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const isSys = msg.senderRole === "system";

                    // Message système
                    if (isSys) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-400 border border-slate-700/50">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    // Mise à jour officielle de campagne
                    if (msg.isUpdate) {
                      return (
                        <div
                          key={msg.id}
                          className="my-4 rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-[#1b1c2b] to-[#111f38] p-4 shadow-xl"
                        >
                          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500 text-slate-950 font-black">
                                📢
                              </span>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                                  Mise à jour officielle du projet
                                </span>
                                <h3 className="text-sm font-extrabold text-white">
                                  {msg.updateTitle || "Rapport d'avancement"}
                                </h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isPorteur && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(msg.id)}
                                  className={`grid h-6 w-6 place-items-center rounded ${
                                    msg.isPinned ? "text-amber-400" : "text-slate-500 hover:text-white"
                                  }`}
                                  title={msg.isPinned ? "Détacher" : "Épingler"}
                                >
                                  <span className="material-symbols-outlined text-[16px]">push_pin</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>

                          {/* Pièces jointes de la mise à jour */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 pt-2 border-t border-slate-700/40">
                              {msg.attachments.map((att) => (
                                <AttachmentCard key={att.id} attachment={att} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Message standard
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} group`}
                      >
                        {/* Avatar */}
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800 grid place-items-center text-xs font-bold text-amber-400">
                          {msg.senderAvatar ? (
                            <img src={msg.senderAvatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            msg.senderName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                          {/* Sender name & badge */}
                          <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className="text-[11px] font-bold text-slate-300">{msg.senderName}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[8px] font-extrabold uppercase ${
                                msg.senderRole === "porteur"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {msg.senderRole === "porteur" ? "Porteur" : "Investisseur"}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {/* Action boutons pin / report */}
                            <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 ml-1">
                              {isPorteur && (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(msg.id)}
                                  className="text-slate-400 hover:text-amber-400"
                                  title="Épingler le message"
                                >
                                  <span className="material-symbols-outlined text-[14px]">push_pin</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setReportTarget({ type: "message", id: msg.id });
                                  setShowReportModal(true);
                                }}
                                className="text-slate-400 hover:text-rose-400"
                                title="Signaler ce message"
                              >
                                <span className="material-symbols-outlined text-[14px]">flag</span>
                              </button>
                            </div>
                          </div>

                          {/* Bubble content */}
                          <div
                            className={`rounded-2xl p-3 text-xs leading-relaxed ${
                              isMe
                                ? "bg-blue-600 text-white rounded-tr-xs"
                                : "bg-slate-800 text-slate-200 rounded-tl-xs border border-slate-700/60"
                            }`}
                          >
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {/* Pièces jointes combinées */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {msg.attachments.map((att) => (
                                  <AttachmentCard key={att.id} attachment={att} isMe={isMe} />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* COMPOSER BAR (Multi-content : Text, Files, Audio) */}
              <div className="border-t border-slate-800 bg-[#0A192F] p-3">
                {/* Mode mise à jour officielle (Porteur only) */}
                {isPorteur && isOfficialUpdate && (
                  <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">campaign</span>
                        Mise à jour officielle de campagne
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsOfficialUpdate(false)}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Annuler mode annonce
                      </button>
                    </div>
                    <input
                      type="text"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                      placeholder="Titre de la mise à jour (ex. Rapport trimestriel T3, Production lancée...)"
                      className="w-full rounded-lg border border-amber-500/40 bg-slate-900/90 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Pending attachments shelf before sending */}
                {pendingAttachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2 py-1 text-[11px] text-slate-200 border border-slate-700"
                      >
                        <span className="material-symbols-outlined text-[14px] text-amber-400">
                          {att.type === "document"
                            ? "description"
                            : att.type === "image"
                            ? "image"
                            : att.type === "video"
                            ? "videocam"
                            : "mic"}
                        </span>
                        <span className="max-w-[140px] truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachments((list) => list.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-400 ml-1 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Voice recording live banner */}
                {recording && (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-rose-600/20 px-3 py-2 border border-rose-500 text-xs text-rose-300 animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Enregistrement note vocale... {formatCallTime(recordSeconds)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-500"
                      >
                        Terminer
                      </button>
                    </div>
                  </div>
                )}

                {/* Main input bar */}
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  {/* File upload hidden input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Attachment button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
                    title="Ajouter un document, une image ou une vidéo"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {uploading ? "progress_activity" : "attach_file"}
                    </span>
                  </button>

                  {/* Voice note record button */}
                  {!recording && (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={uploading}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition disabled:opacity-50"
                      title="Enregistrer un message vocal"
                    >
                      <span className="material-symbols-outlined text-[20px]">mic</span>
                    </button>
                  )}

                  {/* Porteur official update trigger button */}
                  {isPorteur && !isOfficialUpdate && (
                    <button
                      type="button"
                      onClick={() => setIsOfficialUpdate(true)}
                      className="hidden sm:grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-amber-400 hover:bg-amber-500/20 transition"
                      title="Créer une annonce officielle"
                    >
                      <span className="material-symbols-outlined text-[20px]">campaign</span>
                    </button>
                  )}

                  {/* Text area */}
                  <div className="relative flex-1">
                    <textarea
                      rows={1}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isOfficialUpdate
                          ? "Détaillez votre mise à jour officielle de projet..."
                          : "Écrire aux investisseurs (@nom pour mentionner)..."
                      }
                      className="w-full max-h-32 resize-none rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sending || uploading || (!inputText.trim() && pendingAttachments.length === 0)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-40 transition shadow-md"
                    title="Envoyer le message"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {sending ? "progress_activity" : "send"}
                    </span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
              <img
                src="/crowdfunding-message-icon.png"
                alt=""
                className="h-16 w-16 opacity-60 mb-3"
              />
              <h2 className="text-base font-bold text-slate-200">Sélectionnez un projet de financement</h2>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Choisissez une salle de projet dans la colonne de gauche pour échanger avec le porteur et les autres
                investisseurs confirmés.
              </p>
            </div>
          )}
        </main>

        {/* PARTICIPANTS DRAWER */}
        {showParticipantsDrawer && (
          <aside className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 bg-[#0A192F] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">group</span>
                <h3 className="text-sm font-bold text-white">Investisseurs confirmés ({participants.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowParticipantsDrawer(false)}
                className="grid h-7 w-7 place-items-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2">
              {participants.map((p) => {
                const isTargetPorteur = p.role === "porteur";
                return (
                  <div key={p.id} className="p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 grid place-items-center text-xs font-bold text-amber-400 shrink-0">
                        {p.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-bold text-slate-200">{p.nom}</p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[8px] font-black uppercase ${
                              isTargetPorteur
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {isTargetPorteur ? "Porteur" : "Investisseur"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 capitalize">
                          Mode : {p.investmentMode.replace("_", " ")}
                          {p.investedAmount > 0 ? ` · ${formatPrice(p.investedAmount)}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Actions sur le participant */}
                    <div className="flex items-center gap-1 shrink-0">
                      {p.userId !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleStartCall("video", false, [p.userId])}
                          className="grid h-7 w-7 place-items-center rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400"
                          title="Lancer un appel direct"
                        >
                          <span className="material-symbols-outlined text-[15px]">call</span>
                        </button>
                      )}
                      {isPorteur && p.role !== "porteur" && p.userId !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleKickParticipant(p.userId, p.nom)}
                          className="grid h-7 w-7 place-items-center rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                          title="Exclure ce participant pour abus"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* WEBRTC CALL OVERLAY MODAL */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="flex w-full max-w-2xl flex-col rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-2xl">
                  {activeCall.isGroup ? "groups" : "video_call"}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {activeCall.isGroup ? "Réunion Investisseurs Crowdfunding" : "Appel direct Investisseur"}
                  </h3>
                  <p className="text-[11px] text-amber-400 font-mono">
                    Durée : {formatCallTime(activeCall.seconds)}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                En direct (Chiffré)
              </span>
            </div>

            {/* Video Streams Grid */}
            <div className="my-6 grid grid-cols-2 gap-4">
              <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-800 text-2xl font-bold text-amber-400">
                  {user?.prenom?.[0] || "M"}
                </div>
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  Vous ({activeCall.isMuted ? "Micro coupé" : "Micro actif"})
                </span>
              </div>
              <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-600/30 text-2xl font-bold text-blue-300">
                  👥
                </div>
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                  {activeCall.isGroup
                    ? `${activeCall.participants.length} participants connectés`
                    : "Investisseur"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setActiveCall((c) => (c ? { ...c, isMuted: !c.isMuted } : null))}
                className={`grid h-12 w-12 place-items-center rounded-full transition ${
                  activeCall.isMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {activeCall.isMuted ? "mic_off" : "mic"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCall((c) => (c ? { ...c, isVideoOff: !c.isVideoOff } : null))}
                className={`grid h-12 w-12 place-items-center rounded-full transition ${
                  activeCall.isVideoOff ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {activeCall.isVideoOff ? "videocam_off" : "videocam"}
                </span>
              </button>
              <button
                type="button"
                onClick={handleEndCall}
                className="flex items-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-xs font-bold text-white hover:bg-rose-500 shadow-xl"
              >
                <span className="material-symbols-outlined text-[18px]">call_end</span>
                Raccrocher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIDENTIALITY SETTINGS MODAL (Porteur only) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">tune</span>
              Confidentialité de la salle de projet
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Paramètres régissant la visibilité et les échanges entre financeurs.
            </p>

            <div className="mt-4 space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Afficher les montants investis</span>
                  <span className="text-[10px] text-slate-400 block">
                    Permet à chaque investisseur de voir le montant investi par les autres.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings.showAmountsToInvestors)}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, showAmountsToInvestors: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-white block">Autoriser les appels entre investisseurs</span>
                  <span className="text-[10px] text-slate-400 block">
                    Permet les appels 1:1 directs entre participants.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowInvestorCalls !== false}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, allowInvestorCalls: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-amber-500"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            onSubmit={handleReportSubmit}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400">flag</span>
              Signaler un abus
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Votre signalement sera analysé par l'équipe de modération et d'arbitrage Envol Africa.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Motif</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs text-white"
                >
                  <option value="Non-respect des engagements du projet">Non-respect des engagements du projet</option>
                  <option value="Suspicion d'utilisation frauduleuse des fonds">Suspicion d'utilisation frauduleuse des fonds</option>
                  <option value="Comportement ou propos inappropriés">Comportement ou propos inappropriés</option>
                  <option value="Spam ou sollicitation externe">Spam ou sollicitation externe</option>
                  <option value="Autre motif grave">Autre motif grave</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={reportSubmitting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {reportSubmitting ? "Transmission..." : "Envoyer le signalement"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Attachment Card (Document / Image / Video / Voice)
function AttachmentCard({
  attachment,
  isMe,
}: {
  attachment: AttachmentItem;
  isMe?: boolean;
}) {
  const { type, url, name, size, duration } = attachment;

  if (type === "voice") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-black/30 p-2 border border-white/10">
        <span className="material-symbols-outlined text-amber-400 text-[20px]">mic</span>
        <audio controls src={url} className="h-8 max-w-[200px]" />
        {duration ? <span className="text-[10px] text-slate-400">{duration}s</span> : null}
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black/20">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={name} className="max-h-60 w-full object-cover hover:scale-102 transition" />
        </a>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/15 bg-black">
        <video controls src={url} className="max-h-64 w-full" />
      </div>
    );
  }

  // Document (PDF, Word, Excel)
  const sizeKb = Math.round(size / 1024);
  const sizeMb = (size / (1024 * 1024)).toFixed(1);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      className={`flex items-center justify-between gap-3 rounded-xl p-2.5 transition border ${
        isMe
          ? "bg-white/15 hover:bg-white/25 border-white/20 text-white"
          : "bg-slate-900/90 hover:bg-slate-900 border-slate-700/80 text-slate-100"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[20px] text-amber-400 shrink-0">
          description
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{name}</p>
          <p className="text-[10px] text-slate-400">
            {size > 1024 * 1024 ? `${sizeMb} Mo` : `${sizeKb} Ko`}
          </p>
        </div>
      </div>
      <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
        download
      </span>
    </a>
  );
}
