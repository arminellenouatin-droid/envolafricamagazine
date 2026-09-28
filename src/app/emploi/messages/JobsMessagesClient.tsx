"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  JobsConversation,
  JobsMessage,
  JobsParticipant,
  JobsAttachment,
  JobsCallSession,
  JobsSubscriptionStatus,
} from "@/lib/jobs-messages-db";

const EMOJI_REACTIONS = ["👍", "👏", "💼", "🔥", "🤝", "❤️"];

export default function JobsMessagesClient() {
  const searchParams = useSearchParams();
  const queryConvId = searchParams.get("conversationId");
  const queryUserId = searchParams.get("userId") || searchParams.get("targetUserId");
  const queryOfferId = searchParams.get("offerId");
  const queryOfferTitle = searchParams.get("offerTitle");

  // User & Subscription state
  const [currentUser, setCurrentUser] = useState<{ id: string; name?: string; email?: string; avatarUrl?: string } | null>(null);
  const [userSubscription, setUserSubscription] = useState<JobsSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Conversations state
  const [conversations, setConversations] = useState<JobsConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<JobsConversation | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "recruiters" | "candidates">("all");

  // Messages state
  const [messages, setMessages] = useState<JobsMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setTextInput] = useState("");
  const [sending, setSending] = useState(false);
  const [inChatSearch, setInChatSearch] = useState("");
  const [showInChatSearch, setShowInChatSearch] = useState(false);

  // Interactivity state
  const [replyingTo, setReplyingTo] = useState<JobsMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<JobsMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  // Audio voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calls state (WebRTC)
  const [activeCall, setActiveCall] = useState<JobsCallSession | null>(null);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Contacts modal state
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);

  // DOM Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load & Auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eam_current_platform", "jobs");
    }

    async function init() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        if (authData.user) {
          setCurrentUser(authData.user);
        }
      } catch {}

      await loadConversations();
      setLoading(false);
    }

    init();
  }, []);

  // Polling conversations toutes les 8s
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations(false);
      pollActiveCalls();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Polling messages toutes les 4s pour la conversation active
  useEffect(() => {
    if (!selectedConversation) return;
    const interval = setInterval(() => {
      loadMessages(selectedConversation.id, false);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load conversations
  const loadConversations = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch("/api/jobs/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.userSubscription) {
          setUserSubscription(data.userSubscription);
        }

        // Si queryUserId ou queryConvId est passé et non encore sélectionné
        if (queryConvId) {
          const match = (data.conversations || []).find((c: JobsConversation) => c.id === queryConvId);
          if (match) setSelectedConversation(match);
        } else if (queryUserId && !selectedConversation) {
          handleSelectOrStartContact(queryUserId, queryOfferId || undefined, queryOfferTitle || undefined);
        } else if (!selectedConversation && data.conversations?.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load jobs conversations", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [queryConvId, queryUserId, queryOfferId, queryOfferTitle, selectedConversation]);

  // Load messages for a conversation
  const loadMessages = async (convId: string, showSpinner = true) => {
    if (showSpinner) setMessagesLoading(true);
    try {
      const res = await fetch(`/api/jobs/messages?conversationId=${encodeURIComponent(convId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.conversation) {
          setSelectedConversation(data.conversation);
        }
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      if (showSpinner) setMessagesLoading(false);
    }
  };

  // Change active conversation
  const handleSelectConversation = (conv: JobsConversation) => {
    setSelectedConversation(conv);
    setReplyingTo(null);
    setEditingMessage(null);
    loadMessages(conv.id);
  };

  // Select or start chat with a user
  const handleSelectOrStartContact = async (targetUserId: string, offerId?: string, offerTitle?: string) => {
    try {
      const res = await fetch("/api/jobs/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          jobOfferId: offerId,
          jobOfferTitle: offerTitle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          await loadConversations(false);
          setSelectedConversation(data.conversation);
          loadMessages(data.conversation.id);
          setShowContactsModal(false);
        }
      }
    } catch (err) {
      console.error("Error creating/getting conversation", err);
    }
  };

  // Send text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation || !inputText.trim() || sending) return;

    if (selectedConversation.isReadOnly) {
      alert("Cette conversation est en lecture seule. Un abonnement actif pour les deux correspondants est requis.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/jobs/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: inputText.trim(),
          type: "text",
          replyToId: replyingTo?.id,
        }),
      });

      if (res.ok) {
        setTextInput("");
        setReplyingTo(null);
        await loadMessages(selectedConversation.id, false);
        loadConversations(false);
      } else {
        const err = await res.json();
        alert(err.error || "Impossible d'envoyer le message.");
      }
    } catch {
      alert("Erreur de connexion lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  // File Upload
  const handleFileUpload = async (file: File, type: "document" | "image" | "video") => {
    if (!selectedConversation || selectedConversation.isReadOnly) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const uploadRes = await fetch("/api/jobs/messages/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(err.error || "Échec de l'envoi du fichier.");
        return;
      }

      const fileData = await uploadRes.json();
      await fetch("/api/jobs/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: fileData.name || "Fichier joint",
          type,
          attachments: [
            {
              type,
              url: fileData.url,
              name: fileData.name,
              size: fileData.size,
              mimeType: fileData.mimeType,
            },
          ],
        }),
      });

      loadMessages(selectedConversation.id, false);
      loadConversations(false);
    } catch {
      alert("Erreur de téléchargement du fichier.");
    } finally {
      setShowAttachMenu(false);
    }
  };

  // Voice note recording
  const startVoiceRecording = async () => {
    if (!selectedConversation || selectedConversation.isReadOnly) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Accès microphone refusé ou non disponible.");
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const stopAndSendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !selectedConversation) return;

    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const duration = recordingSeconds;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setIsRecordingVoice(false);
      setRecordingSeconds(0);

      const formData = new FormData();
      formData.append("file", audioBlob, `vocal_${Date.now()}.webm`);
      formData.append("type", "voice");
      formData.append("duration", String(duration));

      try {
        const uploadRes = await fetch("/api/jobs/messages/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const fileData = await uploadRes.json();
          await fetch("/api/jobs/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: selectedConversation.id,
              content: `Message vocal (${duration}s)`,
              type: "voice",
              attachments: [
                {
                  type: "voice",
                  url: fileData.url,
                  name: `Vocal_${duration}s.webm`,
                  size: fileData.size,
                  duration,
                },
              ],
            }),
          });
          loadMessages(selectedConversation.id, false);
          loadConversations(false);
        }
      } catch {
        alert("Erreur lors de l'envoi de la note vocale.");
      }
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  // Interactions (Reaction, Edit, Delete)
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await fetch("/api/jobs/messages/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, action: "react", emoji }),
      });
      setActiveReactionMessageId(null);
      if (selectedConversation) loadMessages(selectedConversation.id, false);
    } catch {}
  };

  const handleStartEdit = (msg: JobsMessage) => {
    setEditingMessage(msg);
    setEditText(msg.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;
    try {
      const res = await fetch("/api/jobs/messages/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: editingMessage.id,
          action: "edit",
          newContent: editText.trim(),
        }),
      });
      if (res.ok) {
        setEditingMessage(null);
        setEditText("");
        if (selectedConversation) loadMessages(selectedConversation.id, false);
      } else {
        const err = await res.json();
        alert(err.error || "Impossible de modifier ce message.");
      }
    } catch {
      alert("Erreur réseau lors de la modification.");
    }
  };

  const handleDeleteMessage = async (messageId: string, forAll: boolean) => {
    if (!confirm(forAll ? "Supprimer ce message pour tout le monde ?" : "Supprimer ce message pour moi ?")) return;
    try {
      const res = await fetch("/api/jobs/messages/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          action: forAll ? "delete_for_all" : "delete_for_me",
        }),
      });
      if (res.ok) {
        if (selectedConversation) loadMessages(selectedConversation.id, false);
      } else {
        const err = await res.json();
        alert(err.error || "Impossible de supprimer ce message.");
      }
    } catch {
      alert("Erreur de suppression.");
    }
  };

  // WebRTC Calls
  const initiateCall = async (type: "audio" | "video") => {
    if (!selectedConversation) return;
    if (selectedConversation.isReadOnly) {
      alert("Appels désactivés : les deux correspondants doivent avoir un abonnement Jobs actif.");
      return;
    }

    try {
      const res = await fetch("/api/jobs/messages/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          conversationId: selectedConversation.id,
          callType: type,
        }),
      });

      if (res.ok) {
        const call = await res.json();
        setActiveCall(call);
        setCallType(type);
        setCallDuration(0);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else {
        const err = await res.json();
        alert(err.error || "Impossible de démarrer l'appel.");
      }
    } catch {
      alert("Erreur d'initialisation de l'appel.");
    }
  };

  const endCall = async () => {
    if (activeCall) {
      try {
        await fetch("/api/jobs/messages/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "end",
            callId: activeCall.id,
          }),
        });
      } catch {}
    }
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setActiveCall(null);
    setCallDuration(0);
  };

  const pollActiveCalls = async () => {
    try {
      const res = await fetch("/api/jobs/messages/call");
      if (res.ok) {
        const data = await res.json();
        if (data.activeCalls && data.activeCalls.length > 0 && !activeCall) {
          const call = data.activeCalls[0];
          // Proposer de rejoindre
          if (confirm(`Appel ${call.callType === "video" ? "vidéo" : "audio"} entrant de ${call.initiatorName}. Rejoindre ?`)) {
            setActiveCall(call);
            setCallType(call.callType);
            setCallDuration(0);
            if (callTimerRef.current) clearInterval(callTimerRef.current);
            callTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);
          }
        }
      }
    } catch {}
  };

  // Contacts search modal
  const openContactsModal = async () => {
    setShowContactsModal(true);
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/jobs/messages/contacts?q=${encodeURIComponent(contactSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setContactsList(data.contacts || []);
      }
    } catch {
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSearchContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactsLoading(true);
    try {
      const res = await fetch(`/api/jobs/messages/contacts?q=${encodeURIComponent(contactSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setContactsList(data.contacts || []);
      }
    } finally {
      setContactsLoading(false);
    }
  };

  // Report submission
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !reportDescription.trim()) return;

    setReporting(true);
    try {
      const otherPart = selectedConversation.participants.find((p) => p.userId !== currentUser?.id);
      const res = await fetch("/api/jobs/messages/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          reportedUserId: otherPart?.userId,
          category: reportCategory,
          description: reportDescription.trim(),
        }),
      });

      if (res.ok) {
        alert("Signalement transmis avec succès à l'équipe de modération Jobs.");
        setShowReportModal(false);
        setReportDescription("");
      } else {
        alert("Erreur lors de l'enregistrement du signalement.");
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setReporting(false);
    }
  };

  // Block contact
  const handleToggleBlock = async () => {
    if (!selectedConversation) return;
    const otherPart = selectedConversation.participants.find((p) => p.userId !== currentUser?.id);
    if (!otherPart) return;

    if (!confirm(`Bloquer définitivement ${otherPart.fullName} ? Vous ne recevrez plus de messages ni d'appels de sa part.`)) return;

    try {
      const res = await fetch("/api/jobs/messages/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockedId: otherPart.userId,
          reason: "Bloqué par l'utilisateur",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.blocked ? "Utilisateur bloqué." : "Utilisateur débloqué.");
        loadConversations();
      }
    } catch {
      alert("Erreur lors de l'opération.");
    }
  };

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    const otherPart = c.participants.find((p) => p.userId !== currentUser?.id);
    const searchMatch =
      !searchFilter ||
      otherPart?.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.jobOfferTitle?.toLowerCase().includes(searchFilter.toLowerCase());

    if (!searchMatch) return false;

    if (tabFilter === "recruiters") {
      return otherPart?.role === "employer" || otherPart?.role === "recruiter";
    }
    if (tabFilter === "candidates") {
      return otherPart?.role === "candidate";
    }
    return true;
  });

  const activeOtherParticipant: JobsParticipant | undefined = selectedConversation?.participants.find(
    (p) => p.userId !== currentUser?.id
  );

  const filteredMessages = messages.filter((m) => {
    if (!inChatSearch) return true;
    return m.content.toLowerCase().includes(inChatSearch.toLowerCase());
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#071b36] font-sans text-slate-100">
      {/* ========================================================================= */}
      {/* 1. HEADER SUPÉRIEUR AVEC 4-WAY SWITCHER & STATUT JOBS */}
      {/* ========================================================================= */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#06152b] px-3 sm:px-6">
        {/* Gauche : Retour et Titre */}
        <div className="flex items-center gap-3">
          <Link
            href="/emploi"
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-95"
            title="Quitter la messagerie et retourner au portail Emploi"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="hidden sm:inline">Retour Emploi</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#8ee0c0] animate-pulse" />
            <h1 className="font-display text-sm font-black tracking-wide text-white sm:text-base">
              Jobs Messagerie
            </h1>
          </div>
        </div>

        {/* Centre : 4-way Switcher */}
        <div className="flex items-center rounded-full border border-white/15 bg-black/40 p-1 text-[11px] font-bold">
          <Link
            href="/messages"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-slate-300 transition hover:text-white"
            title="Messagerie Sociale WAB"
          >
            <span className="material-symbols-outlined text-[14px]">chat</span>
            <span className="hidden md:inline">Réseau WAB</span>
          </Link>

          <Link
            href="/marketplace/messages"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-slate-300 transition hover:text-white"
            title="Messagerie Transactionnelle Marketplace"
          >
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            <span className="hidden md:inline">Marketplace</span>
          </Link>

          <Link
            href="/financement/messages"
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-slate-300 transition hover:text-white"
            title="Salle investisseurs Crowdfunding"
          >
            <img src="/crowdfunding-message-icon.png" alt="" className="h-3 w-3 object-contain" />
            <span className="hidden md:inline">Crowdfunding</span>
          </Link>

          {/* Onglet Jobs Actif */}
          <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#087e8b] to-[#0a9396] px-3 py-1 text-white shadow-md">
            <img src="/jobs-message-icon.webp" alt="" className="h-3.5 w-3.5 object-contain" />
            <span>Jobs</span>
          </span>
        </div>

        {/* Droite : Abonnement utilisateur */}
        <div className="flex items-center gap-2">
          {userSubscription?.active ? (
            <div className="hidden items-center gap-1.5 rounded-full border border-[#8ee0c0]/30 bg-[#8ee0c0]/10 px-3 py-1 text-[11px] font-bold text-[#8ee0c0] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8ee0c0]" />
              <span>Pass {userSubscription.audience === "employer" ? "Recruteur" : "Candidat"} Actif</span>
            </div>
          ) : (
            <Link
              href="/emploi#tarifs"
              className="flex items-center gap-1 rounded-full bg-[#f6c453] px-3 py-1 text-[11px] font-extrabold text-[#071b36] shadow transition hover:bg-amber-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Activer un Pass</span>
            </Link>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CORPS PRINCIPAL : GAUCHE (CONVERSATIONS) | DROITE (CHAT ACTIF) */}
      {/* ========================================================================= */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* COLONNE GAUCHE: LISTE DES CONVERSATIONS */}
        <aside
          className={`w-full shrink-0 flex-col border-r border-white/10 bg-[#081f3d] transition-all md:flex md:w-80 lg:w-96 ${
            selectedConversation ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Barre d'action et recherche */}
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Discussions ({filteredConversations.length})
              </span>
              <button
                type="button"
                onClick={openContactsModal}
                className="flex items-center gap-1 rounded-full bg-[#087e8b] px-3 py-1 text-xs font-bold text-white shadow transition hover:bg-[#066c77] active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Nouveau</span>
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-2.5 left-2.5 text-sm text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher un candidat, un recruteur..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-1.5 pr-3 pl-8 text-xs text-white placeholder-slate-400 outline-none transition focus:border-[#8ee0c0]"
              />
            </div>

            {/* Onglets Filtres */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTabFilter("all")}
                className={`rounded-full px-2.5 py-1 transition ${
                  tabFilter === "all" ? "bg-white/20 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("recruiters")}
                className={`rounded-full px-2.5 py-1 transition ${
                  tabFilter === "recruiters" ? "bg-[#087e8b] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Recruteurs
              </button>
              <button
                type="button"
                onClick={() => setTabFilter("candidates")}
                className={`rounded-full px-2.5 py-1 transition ${
                  tabFilter === "candidates" ? "bg-[#8ee0c0] text-[#071b36]" : "text-slate-400 hover:text-white"
                }`}
              >
                Candidats
              </button>
            </div>
          </div>

          {/* Liste Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
                Chargement des échanges...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-3xl mb-2 text-slate-500">forum</span>
                <p>Aucune conversation trouvée.</p>
                <button
                  type="button"
                  onClick={openContactsModal}
                  className="mt-3 inline-flex items-center gap-1 text-[#8ee0c0] underline hover:text-white"
                >
                  Démarrer un échange
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants.find((p) => p.userId !== currentUser?.id);
                const isSelected = selectedConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`flex cursor-pointer items-start gap-3 p-3 transition ${
                      isSelected ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-[#087e8b] to-[#8ee0c0] text-sm font-black text-[#071b36]">
                        {other?.avatarUrl ? (
                          <img src={other.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          other?.fullName?.slice(0, 2).toUpperCase() || "JB"
                        )}
                      </div>
                      {other?.isSubscriptionActive && (
                        <span
                          className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[#081f3d] bg-emerald-400"
                          title="Abonnement actif"
                        />
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="truncate text-xs font-bold text-white">
                          {other?.fullName || conv.title || "Contact Jobs"}
                        </h3>
                        {conv.lastMessage?.createdAt && (
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider ${
                            other?.role === "employer" || other?.role === "recruiter"
                              ? "bg-[#087e8b]/30 text-[#8ee0c0]"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {other?.role === "employer" || other?.role === "recruiter" ? "Recruteur" : "Candidat"}
                        </span>
                        {conv.jobOfferTitle && (
                          <span className="truncate text-[10px] text-amber-300/80">
                            · {conv.jobOfferTitle}
                          </span>
                        )}
                      </div>

                      {/* Aperçu du dernier message */}
                      <p className="mt-1 truncate text-xs text-slate-300">
                        {conv.lastMessage ? conv.lastMessage.content : "Aucun message"}
                      </p>

                      {/* Badge Lecture Seule si abonnement expiré */}
                      {conv.isReadOnly && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-400">
                          <span className="material-symbols-outlined text-[12px]">lock_clock</span>
                          <span>Abonnement requis</span>
                        </div>
                      )}
                    </div>

                    {/* Unread badge */}
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#9e001f] px-1 text-[10px] font-black text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* COLONNE DROITE: CHAT ACTIF */}
        <main className={`flex flex-1 flex-col bg-[#071b36] ${!selectedConversation ? "hidden md:flex" : "flex"}`}>
          {selectedConversation ? (
            <>
              {/* Entête du chat */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#082347] px-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedConversation(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 md:hidden"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>

                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#087e8b] to-[#8ee0c0] font-black text-[#071b36]">
                      {activeOtherParticipant?.avatarUrl ? (
                        <img
                          src={activeOtherParticipant.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        activeOtherParticipant?.fullName?.slice(0, 2).toUpperCase() || "JB"
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white sm:text-base">
                        {activeOtherParticipant?.fullName || selectedConversation.title || "Contact Jobs"}
                      </h2>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          activeOtherParticipant?.role === "employer" || activeOtherParticipant?.role === "recruiter"
                            ? "bg-[#087e8b]/30 text-[#8ee0c0]"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {activeOtherParticipant?.role === "employer" || activeOtherParticipant?.role === "recruiter"
                          ? "Recruteur"
                          : "Candidat"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {selectedConversation.jobOfferTitle
                        ? `Offre : ${selectedConversation.jobOfferTitle}`
                        : "Échange professionnel confidentiel"}
                    </p>
                  </div>
                </div>

                {/* Boutons d'appel et options */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInChatSearch(!showInChatSearch)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10"
                    title="Rechercher dans les messages"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  </button>

                  {/* Audio Call */}
                  <button
                    type="button"
                    onClick={() => initiateCall("audio")}
                    disabled={selectedConversation.isReadOnly}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#8ee0c0] transition hover:bg-white/10 disabled:opacity-40"
                    title="Appel vocal WebRTC"
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </button>

                  {/* Video Call */}
                  <button
                    type="button"
                    onClick={() => initiateCall("video")}
                    disabled={selectedConversation.isReadOnly}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#8ee0c0] transition hover:bg-white/10 disabled:opacity-40"
                    title="Entretien vidéo WebRTC"
                  >
                    <span className="material-symbols-outlined text-[18px]">videocam</span>
                  </button>

                  {/* Actions (Bloquer, Signaler) */}
                  <div className="relative group">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/10"
                      title="Plus d'actions"
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                    <div className="invisible group-hover:visible absolute right-0 top-9 z-20 w-44 rounded-xl border border-white/10 bg-[#06152b] py-1 shadow-2xl">
                      <button
                        type="button"
                        onClick={handleToggleBlock}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/10"
                      >
                        <span className="material-symbols-outlined text-sm">block</span>
                        <span>Bloquer ce contact</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-white/10"
                      >
                        <span className="material-symbols-outlined text-sm">report</span>
                        <span>Signaler un abus</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recherche in-chat */}
              {showInChatSearch && (
                <div className="flex items-center gap-2 border-b border-white/10 bg-[#092952] px-4 py-2 text-xs">
                  <span className="material-symbols-outlined text-sm text-slate-400">search</span>
                  <input
                    type="text"
                    value={inChatSearch}
                    onChange={(e) => setInChatSearch(e.target.value)}
                    placeholder="Filtrer les messages par mot-clé..."
                    className="flex-1 bg-transparent text-white outline-none placeholder-slate-400"
                  />
                  {inChatSearch && (
                    <button type="button" onClick={() => setInChatSearch("")} className="text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              )}

              {/* BANNIÈRE LECTURE SEULE SI ABONNEMENT EXPIRÉ (RÈGLE OBLIGATOIRE DU PRD) */}
              {selectedConversation.isReadOnly && (
                <div className="flex flex-col gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined shrink-0 text-lg text-amber-400">lock_clock</span>
                    <span>
                      {selectedConversation.readOnlyReason ||
                        "Votre abonnement Jobs (ou celui de votre contact) est arrivé à expiration. Renouvelez votre abonnement pour reprendre les échanges."}
                    </span>
                  </div>
                  <Link
                    href="/emploi#tarifs"
                    className="shrink-0 self-start sm:self-auto rounded-full bg-[#f6c453] px-3.5 py-1.5 font-extrabold text-[#071b36] shadow transition hover:bg-amber-300"
                  >
                    Renouveler mon Pass Jobs
                  </Link>
                </div>
              )}

              {/* LISTE DES MESSAGES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messagesLoading ? (
                  <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-xl mr-2">progress_activity</span>
                    Chargement des messages...
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2 text-[#8ee0c0]/50">chat</span>
                    <p>Début de la discussion professionnelle.</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Partagez vos motivations, CVs ou fiches de poste en toute sécurité.
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const canEdit = isMe && !msg.isDeleted && Date.now() - new Date(msg.createdAt).getTime() <= 15 * 60 * 1000;

                    return (
                      <div
                        key={msg.id}
                        className={`group relative flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {/* Bulle de Message */}
                        <div
                          className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md ${
                            isMe
                              ? "bg-gradient-to-r from-[#087e8b] to-[#0b92a4] text-white rounded-br-none"
                              : "bg-[#0b274c] text-slate-100 rounded-bl-none border border-white/10"
                          }`}
                        >
                          {/* En-tête de bulle si pas moi */}
                          {!isMe && (
                            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#8ee0c0]">
                              <span>{msg.senderName}</span>
                              <span className="rounded bg-white/10 px-1 text-[9px] uppercase text-slate-300">
                                {msg.senderRole}
                              </span>
                            </div>
                          )}

                          {/* Message Répondu / Citation */}
                          {msg.replyToMessage && (
                            <div className="mb-2 rounded-lg border-l-2 border-[#f6c453] bg-black/20 p-2 text-xs opacity-90">
                              <span className="block font-bold text-[#f6c453]">{msg.replyToMessage.senderName}</span>
                              <span className="truncate block text-slate-300">{msg.replyToMessage.content}</span>
                            </div>
                          )}

                          {/* Contenu Texte ou Suppression */}
                          {msg.isDeleted ? (
                            <span className="italic text-xs text-slate-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">block</span>
                              Ce message a été supprimé
                            </span>
                          ) : (
                            <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{msg.content}</p>
                          )}

                          {/* Pièces Jointes */}
                          {msg.attachments && msg.attachments.length > 0 && !msg.isDeleted && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att) => (
                                <div key={att.id} className="overflow-hidden rounded-xl">
                                  {att.type === "image" ? (
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      onClick={() => setLightboxImage(att.url)}
                                      className="max-h-64 w-full cursor-pointer object-cover rounded-xl transition hover:opacity-95"
                                    />
                                  ) : att.type === "video" ? (
                                    <video src={att.url} controls className="max-h-64 w-full rounded-xl" />
                                  ) : att.type === "voice" ? (
                                    <div className="flex items-center gap-2 rounded-xl bg-black/30 p-2.5">
                                      <audio src={att.url} controls className="h-8 w-full" />
                                    </div>
                                  ) : (
                                    /* Document (CV, PDF, etc.) */
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 rounded-xl bg-black/25 p-2.5 transition hover:bg-black/40"
                                    >
                                      <span className="material-symbols-outlined text-2xl text-[#f6c453]">
                                        description
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-bold text-white">{att.name}</p>
                                        <p className="text-[10px] text-slate-300">
                                          Document joint · {(att.size / 1024).toFixed(0)} Ko
                                        </p>
                                      </div>
                                      <span className="material-symbols-outlined text-lg text-slate-300">
                                        download
                                      </span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Horodatage, Édition & Statut Lu */}
                          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] opacity-75">
                            {msg.isEdited && <span>(modifié)</span>}
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && (
                              <span className="material-symbols-outlined text-[13px] text-[#8ee0c0]">
                                done_all
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Réactions affichées */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(msg.id, emoji)}
                                className={`flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-xs transition ${
                                  users.includes(currentUser?.id || "")
                                    ? "bg-[#087e8b]/40 text-white"
                                    : "bg-black/30 text-slate-300 hover:bg-white/10"
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px]">{users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Menu d'action au survol / tap */}
                        {!msg.isDeleted && (
                          <div className="invisible group-hover:visible absolute top-0 right-0 -mt-3 flex items-center gap-1 rounded-full border border-white/15 bg-[#06152b] px-2 py-1 shadow-lg z-10">
                            {/* Réactions */}
                            <div className="flex items-center gap-1 border-r border-white/10 pr-1.5">
                              {EMOJI_REACTIONS.slice(0, 3).map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className="text-xs transition hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            {/* Répondre */}
                            <button
                              type="button"
                              onClick={() => setReplyingTo(msg)}
                              className="text-slate-300 hover:text-white"
                              title="Répondre"
                            >
                              <span className="material-symbols-outlined text-sm">reply</span>
                            </button>

                            {/* Modifier (15 min max) */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                className="text-slate-300 hover:text-white"
                                title="Modifier (15 min)"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                            )}

                            {/* Supprimer */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id, isMe)}
                              className="text-slate-300 hover:text-rose-400"
                              title="Supprimer"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* BARRE DE SAISIE */}
              <div className="shrink-0 border-t border-white/10 bg-[#082347] p-3">
                {/* Aperçu de réponse */}
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-white/5 p-2 text-xs border border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#f6c453]">reply</span>
                      <div>
                        <span className="font-bold text-[#f6c453]">{replyingTo.senderName}</span>
                        <p className="truncate text-slate-300 text-[11px]">{replyingTo.content}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                )}

                {/* Mode Édition de message */}
                {editingMessage && (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-amber-500/10 p-2 text-xs border border-amber-500/30">
                    <div className="flex-1 mr-2">
                      <span className="font-bold text-amber-300">Modifier le message (15 min max) :</span>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="mt-1 w-full rounded-lg bg-black/30 p-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="rounded-lg bg-[#087e8b] px-2.5 py-1 text-xs font-bold text-white"
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingMessage(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Si la conversation est en lecture seule */}
                {selectedConversation.isReadOnly ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-black/20 p-3 text-xs text-slate-400 border border-white/5">
                    <span className="material-symbols-outlined text-amber-400 text-sm">lock</span>
                    <span>Champ de saisie désactivé. Renouvelez votre abonnement pour envoyer un message.</span>
                  </div>
                ) : (
                  /* Formulaire d'envoi actif */
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Menu pièces jointes */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-white/10 active:scale-95"
                        title="Joindre un document (CV, contrat, image, vidéo)"
                      >
                        <span className="material-symbols-outlined text-lg">attach_file</span>
                      </button>

                      {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 z-30 w-48 rounded-2xl border border-white/15 bg-[#06152b] p-2 shadow-2xl space-y-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/10"
                          >
                            <span className="material-symbols-outlined text-amber-400 text-base">description</span>
                            <span>Document / CV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/10"
                          >
                            <span className="material-symbols-outlined text-emerald-400 text-base">image</span>
                            <span>Image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/10"
                          >
                            <span className="material-symbols-outlined text-blue-400 text-base">movie</span>
                            <span>Vidéo</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Zone de texte ou enregistreur vocal */}
                    {isRecordingVoice ? (
                      <div className="flex flex-1 items-center justify-between rounded-xl bg-rose-500/20 px-3 py-2 border border-rose-500/30 text-xs">
                        <div className="flex items-center gap-2 text-rose-300">
                          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="font-bold">Enregistrement vocal : {recordingSeconds}s</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelVoiceRecording}
                            className="text-slate-400 hover:text-white"
                            title="Annuler"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopAndSendVoiceRecording}
                            className="flex items-center gap-1 rounded-full bg-[#087e8b] px-3 py-1 font-bold text-white shadow"
                          >
                            <span className="material-symbols-outlined text-sm">send</span>
                            <span>Envoyer</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Écrivez un message professionnel..."
                          className="flex-1 rounded-xl border border-white/15 bg-black/25 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition focus:border-[#8ee0c0]"
                        />

                        {/* Bouton micro vocal */}
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-[#8ee0c0] active:scale-95"
                          title="Enregistrer un message vocal"
                        >
                          <span className="material-symbols-outlined text-lg">mic</span>
                        </button>

                        {/* Bouton Envoyer */}
                        <button
                          type="submit"
                          disabled={!inputText.trim() || sending}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087e8b] text-white shadow transition hover:bg-[#066c77] disabled:opacity-40 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            </>
          ) : (
            /* Aucune conversation sélectionnée */
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-[#8ee0c0] mb-3">
                <span className="material-symbols-outlined text-3xl">work</span>
              </div>
              <h2 className="text-base font-bold text-white">Messagerie Emploi & Recrutement</h2>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Sélectionnez un échange ou démarrez une nouvelle conversation avec un candidat ou un recruteur vérifié.
              </p>
              <button
                type="button"
                onClick={openContactsModal}
                className="mt-4 flex items-center gap-1.5 rounded-full bg-[#087e8b] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#066c77] transition"
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Nouveau contact</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALES ET COMPOSANTS OVERLAY */}
      {/* ========================================================================= */}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f, "document");
        }}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f, "image");
        }}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f, "video");
        }}
        className="hidden"
        accept="video/*"
      />

      {/* Modal Lightbox Images */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <img src={lightboxImage} alt="" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* Modal WebRTC Call */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#071b36] p-6 text-center text-white shadow-2xl">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#087e8b] to-[#8ee0c0] text-3xl font-black text-[#071b36] shadow-lg">
              {activeOtherParticipant?.avatarUrl ? (
                <img src={activeOtherParticipant.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                activeOtherParticipant?.fullName?.slice(0, 2).toUpperCase() || "JB"
              )}
            </div>

            <h3 className="text-lg font-black">{activeOtherParticipant?.fullName || "Contact Jobs"}</h3>
            <p className="mt-1 text-xs text-[#8ee0c0]">
              Appel {callType === "video" ? "Vidéo" : "Vocal"} WebRTC en cours
            </p>
            <p className="mt-2 text-2xl font-mono font-bold">
              {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
            </p>

            {/* Contrôles de l'appel */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition ${
                  isMuted ? "bg-rose-500" : "bg-white/10 hover:bg-white/20"
                }`}
                title={isMuted ? "Micro coupé" : "Couper le micro"}
              >
                <span className="material-symbols-outlined">{isMuted ? "mic_off" : "mic"}</span>
              </button>

              {callType === "video" && (
                <button
                  type="button"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition ${
                    isVideoOff ? "bg-rose-500" : "bg-white/10 hover:bg-white/20"
                  }`}
                  title={isVideoOff ? "Caméra désactivée" : "Couper la caméra"}
                >
                  <span className="material-symbols-outlined">{isVideoOff ? "videocam_off" : "videocam"}</span>
                </button>
              )}

              {/* Raccrocher */}
              <button
                type="button"
                onClick={endCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl hover:bg-rose-700 active:scale-95"
                title="Raccrocher"
              >
                <span className="material-symbols-outlined text-2xl">call_end</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Contact / Échange */}
      {showContactsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#071b36] p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8ee0c0]">person_add</span>
                <h3 className="font-display text-base font-black text-white">Nouvel échange professionnel</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContactsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSearchContacts} className="mt-4 relative">
              <span className="material-symbols-outlined pointer-events-none absolute top-2.5 left-3 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Rechercher par nom, métier ou ville..."
                className="w-full rounded-xl border border-white/15 bg-black/30 py-2 pr-4 pl-9 text-xs text-white placeholder-slate-400 outline-none focus:border-[#8ee0c0]"
              />
            </form>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2 scrollbar-thin">
              {contactsLoading ? (
                <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Recherche des profils...
                </div>
              ) : contactsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Aucun profil trouvé pour cette recherche.
                </div>
              ) : (
                contactsList.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectOrStartContact(contact.id, contact.jobOfferId, contact.jobOfferTitle)}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-3 transition hover:bg-white/10 hover:border-[#8ee0c0]/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#087e8b] to-[#8ee0c0] font-black text-[#071b36] text-xs">
                        {contact.avatarUrl ? (
                          <img src={contact.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          contact.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white">{contact.fullName}</h4>
                          <span
                            className={`rounded px-1 text-[9px] font-extrabold uppercase ${
                              contact.role === "employer" ? "bg-[#087e8b]/40 text-[#8ee0c0]" : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {contact.role === "employer" ? "Recruteur" : "Candidat"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{contact.headline || contact.companyName}</p>
                        <p className="text-[10px] text-slate-400">{contact.location}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rounded-full bg-[#087e8b] px-3 py-1 text-xs font-bold text-white shadow hover:bg-[#066c77]"
                    >
                      Échanger
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Signaler un abus */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#071b36] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <span className="material-symbols-outlined">report</span>
                <h3 className="font-display text-base font-black">Signaler un abus</h3>
              </div>
              <button type="button" onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Motif du signalement</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white outline-none focus:border-[#8ee0c0]"
                >
                  <option value="fake_job">Fausse offre d&apos;emploi / Recrutement frauduleux</option>
                  <option value="spam">Spam / Messages non sollicités</option>
                  <option value="scam">Tentative d&apos;arnaque / Demande d&apos;argent</option>
                  <option value="harassment">Harcèlement ou propos déplacés</option>
                  <option value="inappropriate">Contenu inapproprié</option>
                  <option value="other">Autre motif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description détaillée</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Décrivez les faits constatés avec précision..."
                  rows={4}
                  className="w-full rounded-xl border border-white/15 bg-black/30 p-2.5 text-xs text-white outline-none focus:border-[#8ee0c0]"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!reportDescription.trim() || reporting}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-40"
                >
                  {reporting ? "Transmission..." : "Envoyer le signalement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
