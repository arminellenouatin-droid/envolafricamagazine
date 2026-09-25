"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Participant {
  id: string;
  fullName: string;
  avatarUrl?: string;
  headline?: string;
}

interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at?: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  otherParticipant: Participant;
  messages: MessageItem[];
  updated_at: string;
}

interface Contact {
  id: string;
  userId: string;
  fullName: string;
  headline: string;
  avatarUrl?: string;
}

interface ParsedMessageContent {
  type: "text" | "voice" | "video" | "document" | "image" | "audio";
  text?: string;
  url?: string;
  name?: string;
  size?: number;
  duration?: number;
}

function parseMessageBody(body: string): ParsedMessageContent {
  if (body.startsWith("{") && (body.includes('"type"') || body.includes('"url"'))) {
    try {
      const parsed = JSON.parse(body);
      if (parsed.type) return parsed;
    } catch {}
  }
  return { type: "text", text: body };
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDuration(seconds?: number) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [canSendVideo, setCanSendVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  // Input states
  const [textInput, setTextInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [followedContacts, setFollowedContacts] = useState<Contact[]>([]);
  const [suggestedContacts, setSuggestedContacts] = useState<Contact[]>([]);
  const [contactsTab, setContactsTab] = useState<"followed" | "suggested">("followed");
  const [contactSearch, setContactSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Video restriction modal
  const [showVideoUpgradeModal, setShowVideoUpgradeModal] = useState(false);

  // Audio / Media Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Auth Check
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});

    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/wab/messages");
      if (res.status === 401) {
        window.location.assign(`/auth/login?next=${encodeURIComponent("/messages")}`);
        return;
      }
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        setCanSendVideo(Boolean(data.canSendVideo));

        // Sync active conversation
        setActiveConversation((prev) => {
          if (!prev) return data.conversations[0] || null;
          const found = data.conversations.find((c: Conversation) => c.id === prev.id);
          return found || prev;
        });
      }
    } catch {}
    setLoading(false);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  // Load contacts for the WhatsApp "+" button
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setLoadingContacts(true);
    try {
      const res = await fetch("/api/messages/contacts");
      const data = await res.json();
      setFollowedContacts(data.followed || []);
      setSuggestedContacts(data.suggested || []);
    } catch {}
    setLoadingContacts(false);
  };

  const startConversationWith = async (contact: Contact) => {
    setShowNewChatModal(false);
    // Vérifier si conversation existante
    const existing = conversations.find(
      (c) =>
        c.participant_a === contact.userId ||
        c.participant_b === contact.userId ||
        c.otherParticipant.id === contact.userId
    );

    if (existing) {
      setActiveConversation(existing);
    } else {
      // Préparer une nouvelle conversation
      const tempConv: Conversation = {
        id: `temp-${contact.userId}`,
        participant_a: currentUserId,
        participant_b: contact.userId,
        otherParticipant: {
          id: contact.userId,
          fullName: contact.fullName,
          avatarUrl: contact.avatarUrl,
          headline: contact.headline,
        },
        messages: [],
        updated_at: new Date().toISOString(),
      };
      setActiveConversation(tempConv);
    }
  };

  // Send Text Message
  const handleSendTextMessage = async () => {
    if (!textInput.trim() || !activeConversation || sending) return;
    const textToSend = textInput.trim();
    setTextInput("");
    setSending(true);

    try {
      const isTemp = activeConversation.id.startsWith("temp-");
      const res = await fetch("/api/wab/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: isTemp ? undefined : activeConversation.id,
          recipientId: activeConversation.otherParticipant.id,
          body: textToSend,
          type: "text",
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setActiveConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            id: data.message.conversation_id,
            messages: [...prev.messages, data.message],
          };
        });
        loadConversations();
      }
    } catch {}
    setSending(false);
  };

  // Voice Note Recording Handlers
  const startVoiceRecording = async () => {
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

      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Impossible d'accéder au microphone. Veuillez vérifier vos autorisations.");
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const stopAndSendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !activeConversation) return;

    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    const duration = recordingSeconds;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setIsRecordingVoice(false);
      setRecordingSeconds(0);

      // Upload audio
      const formData = new FormData();
      formData.append("file", audioBlob, `vocal_${Date.now()}.webm`);

      try {
        const uploadRes = await fetch("/api/wab/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();

        if (uploadRes.ok && (uploadData.mediaUrl || uploadData.path)) {
          const mediaUrl = uploadData.mediaUrl || uploadData.path;
          const bodyPayload = JSON.stringify({
            type: "voice",
            url: mediaUrl,
            duration,
          });

          const isTemp = activeConversation.id.startsWith("temp-");
          const msgRes = await fetch("/api/wab/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId: isTemp ? undefined : activeConversation.id,
              recipientId: activeConversation.otherParticipant.id,
              body: bodyPayload,
              type: "voice",
            }),
          });
          const msgData = await msgRes.json();
          if (msgRes.ok && msgData.message) {
            setActiveConversation((prev) =>
              prev
                ? {
                    ...prev,
                    id: msgData.message.conversation_id,
                    messages: [...prev.messages, msgData.message],
                  }
                : null
            );
            loadConversations();
          }
        }
      } catch {
        alert("Erreur lors de l'envoi du message vocal.");
      }
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  // Video / File Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: "document" | "image" | "audio") => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/wab/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadRes.ok) {
        const mediaUrl = uploadData.mediaUrl || uploadData.path;
        const bodyPayload = JSON.stringify({
          type: mediaType,
          url: mediaUrl,
          name: file.name,
          size: file.size,
        });

        const isTemp = activeConversation.id.startsWith("temp-");
        const msgRes = await fetch("/api/wab/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: isTemp ? undefined : activeConversation.id,
            recipientId: activeConversation.otherParticipant.id,
            body: bodyPayload,
            type: mediaType,
          }),
        });

        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.message) {
          setActiveConversation((prev) =>
            prev
              ? {
                  ...prev,
                  id: msgData.message.conversation_id,
                  messages: [...prev.messages, msgData.message],
                }
              : null
          );
          loadConversations();
        }
      } else {
        alert(uploadData.error || "Erreur de téléversement.");
      }
    } catch {
      alert("Erreur réseau lors de l'envoi du fichier.");
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversation) return;

    if (!canSendVideo) {
      setShowVideoUpgradeModal(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/wab/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadRes.ok) {
        const mediaUrl = uploadData.mediaUrl || uploadData.path;
        const bodyPayload = JSON.stringify({
          type: "video",
          url: mediaUrl,
          name: file.name,
          size: file.size,
        });

        const isTemp = activeConversation.id.startsWith("temp-");
        const msgRes = await fetch("/api/wab/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: isTemp ? undefined : activeConversation.id,
            recipientId: activeConversation.otherParticipant.id,
            body: bodyPayload,
            type: "video",
          }),
        });

        const msgData = await msgRes.json();
        if (msgRes.ok && msgData.message) {
          setActiveConversation((prev) =>
            prev
              ? {
                  ...prev,
                  id: msgData.message.conversation_id,
                  messages: [...prev.messages, msgData.message],
                }
              : null
          );
          loadConversations();
        } else {
          alert(msgData.error || "Impossible d'envoyer la vidéo.");
        }
      }
    } catch {
      alert("Erreur lors de l'envoi de la vidéo.");
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchFilter.trim()) return true;
    const name = c.otherParticipant.fullName.toLowerCase();
    const query = searchFilter.toLowerCase();
    return name.includes(query);
  });

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] bg-[#f0f2f5] flex flex-col">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,audio/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const mime = f.type;
          const type = mime.startsWith("image/") ? "image" : mime.startsWith("audio/") ? "audio" : "document";
          handleFileUpload(e, type);
        }}
      />
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleVideoUpload}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto bg-white shadow-xl overflow-hidden md:my-3 md:rounded-2xl border border-[#d1d7db]">
        {/* ======================================================== */}
        {/* COLONNE GAUCHE : LISTE DES CONVERSATIONS                 */}
        {/* ======================================================== */}
        <div
          className={`w-full md:w-[380px] lg:w-[420px] border-r border-[#e9edef] flex flex-col bg-white relative ${
            activeConversation ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Top Bar Gauche */}
          <div className="h-16 px-4 bg-[#f0f2f5] flex items-center justify-between border-b border-[#e9edef]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9e001f] text-white flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-xl">chat</span>
              </div>
              <h1 className="font-display font-black text-lg text-[#111b21]">Discussions</h1>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/wab"
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-black/5"
                title="Aller sur WAB"
              >
                <span className="material-symbols-outlined text-xl">feed</span>
              </Link>
            </div>
          </div>

          {/* Recherche */}
          <div className="p-3 bg-white border-b border-[#e9edef]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher une discussion..."
                className="w-full bg-[#f0f2f5] text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
              />
            </div>
          </div>

          {/* Liste des discussions */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f5f6f6]">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-500">Chargement de vos échanges...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">forum</span>
                <p>Aucune conversation pour l'instant.</p>
                <p className="mt-1 text-gray-400">Cliquez sur le bouton + ci-dessous pour démarrer une discussion.</p>
              </div>
            ) : (
              filteredConversations.map((item) => {
                const isSelected = activeConversation?.id === item.id;
                const lastMsg = item.messages[item.messages.length - 1];
                const parsedLast = lastMsg ? parseMessageBody(lastMsg.body) : null;
                const isUnread = lastMsg && lastMsg.sender_id !== currentUserId && !lastMsg.read_at;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveConversation(item)}
                    className={`w-full p-3.5 flex items-center gap-3.5 text-left transition-colors ${
                      isSelected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {item.otherParticipant.avatarUrl ? (
                        <img
                          src={item.otherParticipant.avatarUrl}
                          alt={item.otherParticipant.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 bg-emerald-100 text-emerald-800">
                          {item.otherParticipant.fullName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-[#111b21] truncate">
                          {item.otherParticipant.fullName}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatTime(lastMsg.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate">
                          {parsedLast ? (
                            parsedLast.type === "voice" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <span className="material-symbols-outlined text-xs">mic</span> Message vocal
                              </span>
                            ) : parsedLast.type === "video" ? (
                              <span className="inline-flex items-center gap-1 text-[#9e001f]">
                                <span className="material-symbols-outlined text-xs">videocam</span> Message vidéo
                              </span>
                            ) : parsedLast.type === "image" ? (
                              <span className="inline-flex items-center gap-1 text-blue-600">
                                <span className="material-symbols-outlined text-xs">image</span> Photo
                              </span>
                            ) : parsedLast.type === "document" ? (
                              <span className="inline-flex items-center gap-1 text-amber-700">
                                <span className="material-symbols-outlined text-xs">description</span> Document
                              </span>
                            ) : (
                              parsedLast.text
                            )
                          ) : (
                            "Nouvelle discussion"
                          )}
                        </p>
                        {isUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#9e001f] shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bouton Flottant WhatsApp "+" (Nouvelle Discussion) */}
          <button
            type="button"
            onClick={openNewChatModal}
            aria-label="Nouvelle discussion"
            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20 focus:outline-none ring-4 ring-[#25D366]/20"
          >
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* COLONNE DROITE : FENETRE DE CONVERSATION ACTIVE          */}
        {/* ======================================================== */}
        <div
          className={`flex-1 flex flex-col bg-[#efeae2] relative ${
            activeConversation ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Top Bar Discussion */}
              <div className="h-16 px-4 bg-[#f0f2f5] flex items-center justify-between border-b border-[#e9edef] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden text-gray-600 hover:text-gray-900 mr-1"
                  >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                  </button>

                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {activeConversation.otherParticipant.avatarUrl ? (
                      <img
                        src={activeConversation.otherParticipant.avatarUrl}
                        alt={activeConversation.otherParticipant.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-emerald-800 bg-emerald-100 text-sm">
                        {activeConversation.otherParticipant.fullName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-bold text-sm text-[#111b21] truncate">
                      {activeConversation.otherParticipant.fullName}
                    </h2>
                    <p className="text-[11px] text-gray-500 truncate">
                      {activeConversation.otherParticipant.headline || "En ligne sur le réseau"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canSendVideo) setShowVideoUpgradeModal(true);
                      else videoInputRef.current?.click();
                    }}
                    className={`p-2 rounded-full hover:bg-black/5 ${
                      canSendVideo ? "text-emerald-700" : "text-gray-400"
                    }`}
                    title={
                      canSendVideo
                        ? "Envoyer un message vidéo (WAB Business)"
                        : "Vidéo réservée aux créateurs / WAB Business"
                    }
                  >
                    <span className="material-symbols-outlined text-xl">videocam</span>
                  </button>
                </div>
              </div>

              {/* Feed des messages */}
              <div
                className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d8cfc4' fill-opacity='0.25' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {activeConversation.messages.map((m) => {
                  const isMe = m.sender_id === currentUserId;
                  const parsed = parseMessageBody(m.body);

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm text-xs leading-relaxed ${
                          isMe
                            ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                            : "bg-white text-[#111b21] rounded-tl-none"
                        }`}
                      >
                        {/* TYPE 1 : Plain Text */}
                        {parsed.type === "text" && (
                          <p className="whitespace-pre-wrap">{parsed.text}</p>
                        )}

                        {/* TYPE 2 : Vocal / Voice Note */}
                        {parsed.type === "voice" && parsed.url && (
                          <div className="flex items-center gap-3 py-1 min-w-[200px]">
                            <span className="material-symbols-outlined text-[#9e001f] text-2xl">
                              mic
                            </span>
                            <div className="flex-1">
                              <audio controls src={parsed.url} className="w-full h-8" />
                            </div>
                            {parsed.duration && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                {formatDuration(parsed.duration)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* TYPE 3 : Message Vidéo */}
                        {parsed.type === "video" && parsed.url && (
                          <div className="rounded-xl overflow-hidden my-1 bg-black max-w-[320px]">
                            <video
                              controls
                              src={parsed.url}
                              className="w-full max-h-[300px] object-cover"
                            />
                            {parsed.name && (
                              <p className="p-1.5 text-[11px] text-white/90 bg-black/70 truncate">
                                {parsed.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* TYPE 4 : Image */}
                        {parsed.type === "image" && parsed.url && (
                          <div className="rounded-xl overflow-hidden my-1 max-w-[320px]">
                            <img
                              src={parsed.url}
                              alt={parsed.name || "Photo"}
                              className="w-full h-auto object-cover rounded-xl"
                            />
                          </div>
                        )}

                        {/* TYPE 5 : Document */}
                        {parsed.type === "document" && parsed.url && (
                          <a
                            href={parsed.url}
                            download={parsed.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-2xl text-[#9e001f]">
                              description
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs truncate">{parsed.name || "Document"}</p>
                              {parsed.size && (
                                <p className="text-[10px] text-gray-500">
                                  {(parsed.size / 1024).toFixed(0)} Ko
                                </p>
                              )}
                            </div>
                            <span className="material-symbols-outlined text-gray-600 text-sm">
                              download
                            </span>
                          </a>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-gray-400">
                          <span>{formatTime(m.created_at)}</span>
                          {isMe && (
                            <span
                              className={`material-symbols-outlined text-xs ${
                                m.read_at ? "text-blue-500" : "text-gray-400"
                              }`}
                            >
                              done_all
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Barre de saisie WhatsApp */}
              <div className="p-3 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-2">
                {isRecordingVoice ? (
                  // Mode enregistrement audio
                  <div className="flex-1 flex items-center justify-between bg-white px-4 py-2.5 rounded-full border border-red-300">
                    <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      Enregistrement en cours... {formatDuration(recordingSeconds)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        className="text-gray-400 hover:text-gray-600 text-xs px-2"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={stopAndSendVoiceRecording}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-1.5 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bouton Pièce Jointe */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-black/5 shrink-0"
                      title="Joindre un fichier (document, image, son)"
                    >
                      <span className="material-symbols-outlined text-2xl">attach_file</span>
                    </button>

                    {/* Bouton Vidéo (Réservé créateur/business) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!canSendVideo) setShowVideoUpgradeModal(true);
                        else videoInputRef.current?.click();
                      }}
                      className={`p-2 rounded-full hover:bg-black/5 shrink-0 ${
                        canSendVideo ? "text-emerald-700" : "text-gray-400"
                      }`}
                      title={
                        canSendVideo
                          ? "Envoyer un message vidéo"
                          : "Envoi vidéo réservé aux créateurs WAB"
                      }
                    >
                      <span className="material-symbols-outlined text-2xl">videocam</span>
                    </button>

                    {/* Champ Texte */}
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendTextMessage()}
                      placeholder="Tapez un message..."
                      className="flex-1 bg-white text-xs rounded-full px-4 py-3 border border-transparent focus:outline-none focus:ring-1 focus:ring-[#9e001f]"
                    />

                    {/* Bouton Vocal ou Envoi Texte */}
                    {textInput.trim() ? (
                      <button
                        type="button"
                        onClick={handleSendTextMessage}
                        disabled={sending}
                        className="w-10 h-10 rounded-full bg-[#9e001f] hover:bg-[#c8102e] text-white flex items-center justify-center shrink-0 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">send</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shrink-0 transition-colors shadow-md"
                        title="Enregistrer un message vocal"
                      >
                        <span className="material-symbols-outlined text-xl">mic</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            // Aucun chat sélectionné (Desktop placeholder)
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f0f2f5]">
              <div className="w-20 h-20 rounded-full bg-[#9e001f]/10 text-[#9e001f] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl">chat</span>
              </div>
              <h3 className="font-display font-black text-xl text-[#111b21] mb-2">
                Messagerie Envol Africa
              </h3>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed mb-6">
                Envoyez des messages textes, notes vocales, vidéos et documents en temps réel avec vos contacts et partenaires panafricains.
              </p>
              <button
                type="button"
                onClick={openNewChatModal}
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Démarrer une discussion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL NOUVELLE DISCUSSION (Bouton +)                     */}
      {/* ======================================================== */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-display font-black text-lg text-[#111b21]">Nouvelle discussion</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Onglets : Suivis vs Suggérés */}
            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setContactsTab("followed")}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${
                  contactsTab === "followed"
                    ? "bg-[#9e001f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Comptes suivis ({followedContacts.length})
              </button>
              <button
                type="button"
                onClick={() => setContactsTab("suggested")}
                className={`flex-1 py-2 rounded-full text-xs font-bold transition-colors ${
                  contactsTab === "suggested"
                    ? "bg-[#9e001f] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Personnes suggérées ({suggestedContacts.length})
              </button>
            </div>

            {/* Recherche de contact */}
            <div className="pt-3">
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Rechercher par nom..."
                className="w-full bg-[#f0f2f5] text-xs rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>

            {/* Liste des contacts */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pt-3">
              {loadingContacts ? (
                <div className="p-8 text-center text-xs text-gray-500">Chargement des contacts...</div>
              ) : (
                (() => {
                  const list = contactsTab === "followed" ? followedContacts : suggestedContacts;
                  const filtered = list.filter((c) =>
                    c.fullName.toLowerCase().includes(contactSearch.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs text-gray-400">
                        {contactsTab === "followed"
                          ? "Vous ne suivez encore aucun contact sur WAB."
                          : "Aucune personne suggérée."}
                      </div>
                    );
                  }

                  return filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => startConversationWith(c)}
                      className="w-full py-3 px-2 flex items-center gap-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-sm">
                            {c.fullName.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-gray-900 truncate">{c.fullName}</p>
                        <p className="text-[11px] text-gray-500 truncate">{c.headline}</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-400 text-sm">chat</span>
                    </button>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL RESTRICTION VIDEO (WAB BUSINESS)                   */}
      {/* ======================================================== */}
      {showVideoUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#9e001f]/10 text-[#9e001f] flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl">videocam_off</span>
            </div>
            <h3 className="font-display font-black text-lg text-[#111b21] mb-2">
              Messages Vidéo WAB
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              L'envoi de messages vidéo est une fonctionnalité premium réservée aux comptes créateurs et aux abonnés <strong>WAB Business</strong>.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowVideoUpgradeModal(false)}
                className="flex-1 border py-2.5 rounded-xl font-bold text-xs text-gray-700"
              >
                Fermer
              </button>
              <Link
                href="/wab"
                className="flex-1 bg-[#9e001f] hover:bg-[#c8102e] text-white py-2.5 rounded-xl font-bold text-xs text-center"
              >
                Découvrir WAB Business
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
