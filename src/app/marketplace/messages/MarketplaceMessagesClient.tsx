"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MarketplaceConversation,
  MarketplaceMessage,
  MarketplaceQuickReply,
  MarketplaceConversationStatus,
  MarketplaceAttachment,
} from "@/lib/marketplace/types";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  subscribeToChatChannel,
  broadcastNewMessage,
  broadcastTypingState,
  broadcastMessageRead,
  getChatChannelName,
} from "@/lib/realtime-chat";

interface AuthUser {
  id: string;
  email: string;
  nom?: string;
  prenom?: string;
  role?: string;
  avatar?: string;
}

type FilterTab = "all" | "pre_purchase" | "pending_acceptance" | "in_progress" | "delivered" | "completed" | "disputed";

export default function MarketplaceMessagesClient() {
  // Current user state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleMode, setRoleMode] = useState<"buyer" | "supplier">("buyer");

  // Conversations state
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Messages state
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Supplier call availability
  const [supplierCallAvailable, setSupplierCallAvailable] = useState(true);

  // Modals state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryFiles, setDeliveryFiles] = useState<{ url: string; name: string; size: number; mime_type: string }[]>([]);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("Non-respect des délais ou de la description");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Quick replies state
  const [quickReplies, setQuickReplies] = useState<MarketplaceQuickReply[]>([]);
  const [showQuickRepliesModal, setShowQuickRepliesModal] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [newQuickTitle, setNewQuickTitle] = useState("");
  const [newQuickContent, setNewQuickContent] = useState("");
  const [newQuickShortcut, setNewQuickShortcut] = useState("");

  // ComeUp Direct active call state
  const [activeCall, setActiveCall] = useState<{
    id?: string;
    type: "audio" | "video";
    status: "ringing" | "connected" | "ended";
    duration: number;
    muted: boolean;
    videoEnabled: boolean;
  } | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ type: "error" | "warning" | "success" | "info"; message: string } | null>(null);

  // Mobile layout state ("list" vs "chat")
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const deliveryFileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll messages to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Show toast helper
  const showToast = useCallback((message: string, type: "error" | "warning" | "success" | "info" = "info") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // 1. Fetch current authenticated user
  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            if (data.user.role === "supplier" || data.user.role === "admin") {
              setRoleMode("supplier");
            }
          }
        }
      } catch (err) {
        console.error("Auth fetch error:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    loadAuth();
  }, []);

  // 2. Fetch conversations list
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/marketplace/messages/conversations?role=${roleMode}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [roleMode]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Check URL query parameters for ?product=, ?productId=, ?conversation=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const convParam = params.get("conversation");
    const productParam = params.get("product") || params.get("productId");

    if (convParam) {
      setSelectedConvId(convParam);
      setMobileView("chat");
    } else if (productParam && !selectedConvId) {
      // Create or retrieve conversation for this product
      fetch("/api/marketplace/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productParam }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.conversation) {
            setSelectedConvId(data.conversation.id);
            setMobileView("chat");
            loadConversations();
          }
        })
        .catch((err) => console.error("Error creating conversation from URL param:", err));
    }
  }, [loadConversations, selectedConvId]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  // 3. Fetch messages when active conversation changes
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/marketplace/messages?conversationId=${encodeURIComponent(convId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        scrollToBottom(false);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [scrollToBottom]);

  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedConvId);

    // Abonnement Supabase Realtime Broadcast (< 50ms)
    const supabase = getSupabaseBrowserClient();
    const channelName = getChatChannelName("marketplace", selectedConvId);

    const channel = subscribeToChatChannel(
      supabase,
      channelName,
      {
        onMessageNew: (payload) => {
          if (!payload?.message || payload.conversationId !== selectedConvId) return;
          const incoming = payload.message as MarketplaceMessage;

          setMessages((prev) => {
            const exists = prev.some(
              (m) => m.id === incoming.id || (payload.clientId && m.client_msg_id === payload.clientId)
            );
            if (exists) {
              return prev.map((m) =>
                m.id === incoming.id || (payload.clientId && m.client_msg_id === payload.clientId)
                  ? { ...incoming, status: "sent" }
                  : m
              );
            }
            return [...prev, { ...incoming, status: incoming.read_at ? "read" : "delivered" }];
          });

          scrollToBottom(true);
          loadConversations();
        },
      },
      user?.id
    );

    // Polling de résilience de secours (10s)
    const interval = setInterval(() => {
      fetch(`/api/marketplace/messages?conversationId=${encodeURIComponent(selectedConvId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.messages) {
            setMessages((prev) => {
              const pending = prev.filter((m) => m.status === "sending" || m.status === "failed");
              const serverMsgs = data.messages;
              return [
                ...serverMsgs,
                ...pending.filter(
                  (p) => !serverMsgs.some((s: any) => s.id === p.id || (p.client_msg_id && s.client_msg_id === p.client_msg_id))
                ),
              ];
            });
          }
        })
        .catch(() => {});
    }, 10000);

    return () => {
      clearInterval(interval);
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [selectedConvId, loadMessages, scrollToBottom, loadConversations, user?.id]);

  // 4. Load Quick Replies for sellers
  const loadQuickReplies = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace/messages/quick-replies");
      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.quickReplies || []);
      }
    } catch (err) {
      console.error("Failed to load quick replies:", err);
    }
  }, []);

  useEffect(() => {
    if (roleMode === "supplier") {
      loadQuickReplies();
    }
  }, [roleMode, loadQuickReplies]);

  // Client-side anti-circumvention warning feedback
  const antiCircumventionWarning = useMemo(() => {
    if (!inputText) return null;
    const phonePattern = /(?:\+?\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}/;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
    const socialPattern = /(whatsapp|telegram|signal|viber|wechat|instagram|facebook|paypal|wave|moov|mtn|orange money)/i;

    if (phonePattern.test(inputText)) {
      return "Numéro de téléphone détecté. Tout échange de numéro est bloqué par la sécurité EAM.";
    }
    if (emailPattern.test(inputText)) {
      return "Adresse email détectée. Tout échange d'email externe est interdit sur le Marketplace.";
    }
    if (socialPattern.test(inputText)) {
      return "Canal externe ou moyen de paiement externe détecté. La transaction doit rester sur EAM.";
    }
    return null;
  }, [inputText]);

  // 5. Send regular message avec UI optimiste et diffusion temps réel
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId || !inputText.trim() || sending) return;

    const contentToSend = inputText.trim();
    setInputText("");
    setSending(true);

    const clientMsgId = `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMsg: MarketplaceMessage = {
      id: clientMsgId,
      client_msg_id: clientMsgId,
      conversation_id: selectedConvId,
      sender_id: user?.id || "",
      sender_role: roleMode,
      message_type: "text",
      body: contentToSend,
      media: [],
      is_delivery: false,
      delivery_assets: [],
      is_quick_reply: false,
      moderation_status: "approved",
      read_at: null,
      created_at: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      const res = await fetch("/api/marketplace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: contentToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Impossible d'envoyer le message.", "error");
        if (data.bypassDetected) {
          showToast(`Avertissement Sécurité EAM : ${data.reason}`, "warning");
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === clientMsgId ? { ...m, status: "failed", error: data.error } : m
          )
        );
      } else {
        if (data.message) {
          const realMsg: MarketplaceMessage = {
            ...data.message,
            client_msg_id: clientMsgId,
            status: "sent",
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === clientMsgId || m.client_msg_id === clientMsgId ? realMsg : m
            )
          );

          // Diffusion instantanée Realtime (< 50ms)
          const supabase = getSupabaseBrowserClient();
          if (supabase) {
            const channelName = getChatChannelName("marketplace", selectedConvId);
            broadcastNewMessage(supabase, channelName, {
              message: realMsg,
              clientId: clientMsgId,
              conversationId: selectedConvId,
              senderId: user?.id || "",
            });
          }
          scrollToBottom(true);
        }
        loadConversations();
      }
    } catch (err) {
      showToast("Erreur de connexion. Message non transmis.", "error");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientMsgId ? { ...m, status: "failed", error: "Erreur réseau" } : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  // Réessayer un message échoué
  const handleRetryMessage = async (failedMsg: MarketplaceMessage) => {
    if (!selectedConvId) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedMsg.id ? { ...m, status: "sending", error: undefined } : m
      )
    );

    try {
      const res = await fetch("/api/marketplace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: failedMsg.body || "",
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        const realMsg: MarketplaceMessage = {
          ...data.message,
          client_msg_id: failedMsg.client_msg_id || failedMsg.id,
          status: "sent",
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === failedMsg.id ? realMsg : m))
        );
        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          const channelName = getChatChannelName("marketplace", selectedConvId);
          broadcastNewMessage(supabase, channelName, {
            message: realMsg,
            clientId: failedMsg.client_msg_id || failedMsg.id,
            conversationId: selectedConvId,
            senderId: user?.id || "",
          });
        }
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMsg.id ? { ...m, status: "failed", error: data.error } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...m, status: "failed", error: "Erreur réseau" } : m
        )
      );
    }
  };

  // 6. Handle file upload for chat
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConvId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", selectedConvId);

    try {
      const uploadRes = await fetch("/api/marketplace/messages/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        showToast(uploadData.error || "Erreur de téléversement.", "error");
        return;
      }

      // Send message with uploaded attachment
      const sendRes = await fetch("/api/marketplace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          content: `Pièce jointe envoyée : ${uploadData.file.name}`,
          messageType: uploadData.file.mime_type.startsWith("image/")
            ? "image"
            : uploadData.file.mime_type.startsWith("video/")
            ? "video"
            : "document",
          attachments: [uploadData.file],
        }),
      });

      const sendData = await sendRes.json();
      if (sendRes.ok && sendData.message) {
        setMessages((prev) => [...prev, sendData.message]);
        scrollToBottom(true);
        loadConversations();
        showToast("Fichier envoyé avec succès.", "success");
      }
    } catch (err) {
      showToast("Échec de l'envoi de la pièce jointe.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 7. Order Action Machine handlers
  const handleOrderAction = async (action: string, extraBody: Record<string, unknown> = {}) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch("/api/marketplace/messages/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          action,
          ...extraBody,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Action impossible sur la commande.", "error");
      } else {
        showToast(data.notice || "Action effectuée avec succès.", "success");
        loadMessages(selectedConvId);
        loadConversations();
      }
    } catch (err) {
      showToast("Erreur de communication avec le serveur.", "error");
    }
  };

  // 8. Submit Delivery (Seller)
  const handleSubmitDelivery = async () => {
    if (!selectedConvId || !deliveryNote.trim()) {
      showToast("Veuillez saisir une note d'accompagnement de livraison.", "warning");
      return;
    }
    setSubmittingDelivery(true);
    try {
      await handleOrderAction("submit_delivery", {
        deliveryNote: deliveryNote.trim(),
        deliveryAssets: deliveryFiles,
      });
      setShowDeliveryModal(false);
      setDeliveryNote("");
      setDeliveryFiles([]);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Upload file for delivery assets
  const handleDeliveryFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConvId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", selectedConvId);

    try {
      const uploadRes = await fetch("/api/marketplace/messages/upload", {
        method: "POST",
        body: formData,
      });
      const data = await uploadRes.json();
      if (uploadRes.ok && data.file) {
        setDeliveryFiles((prev) => [...prev, data.file]);
        showToast(`Livrable ${file.name} ajouté.`, "success");
      } else {
        showToast(data.error || "Erreur téléversement livrable.", "error");
      }
    } catch {
      showToast("Échec upload livrable.", "error");
    } finally {
      if (deliveryFileInputRef.current) deliveryFileInputRef.current.value = "";
    }
  };

  // 9. Request Revision (Buyer)
  const handleRequestRevision = async () => {
    if (!selectedConvId || !revisionReason.trim()) {
      showToast("Veuillez motiver précisément votre demande de retouche.", "warning");
      return;
    }
    setSubmittingRevision(true);
    try {
      await handleOrderAction("request_revision", {
        revisionReason: revisionReason.trim(),
      });
      setShowRevisionModal(false);
      setRevisionReason("");
    } finally {
      setSubmittingRevision(false);
    }
  };

  // 10. Open Dispute
  const handleSubmitDispute = async () => {
    if (!selectedConvId || !disputeDescription.trim()) {
      showToast("Veuillez détailler le motif du litige.", "warning");
      return;
    }
    setSubmittingDispute(true);
    try {
      const res = await fetch("/api/marketplace/messages/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          reason: disputeReason,
          description: disputeDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Impossible d'ouvrir le litige.", "error");
      } else {
        showToast("Litige ouvert. La conversation est désormais gelée sous arbitrage EAM.", "warning");
        setShowDisputeModal(false);
        setDisputeDescription("");
        loadMessages(selectedConvId);
        loadConversations();
      }
    } catch {
      showToast("Erreur lors de l'enregistrement du litige.", "error");
    } finally {
      setSubmittingDispute(false);
    }
  };

  // 11. ComeUp Direct 1:1 Calls simulation & tracking
  const startCall = async (type: "audio" | "video") => {
    if (!selectedConvId || !activeConversation) return;

    if (!activeConversation.supplier?.call_available) {
      showToast("Ce vendeur n'est actuellement pas disponible pour les appels ComeUp Direct.", "warning");
      return;
    }

    try {
      const res = await fetch("/api/marketplace/messages/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConvId,
          callType: type,
          action: "initiate",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Impossible de démarrer l'appel.", "error");
        return;
      }

      setActiveCall({
        id: data.call?.id,
        type,
        status: "connected",
        duration: 0,
        muted: false,
        videoEnabled: type === "video",
      });

      // Start duration counter
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    } catch {
      showToast("Erreur d'initialisation de l'appel.", "error");
    }
  };

  const endCall = async () => {
    if (!activeCall) return;
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    const callId = activeCall.id;
    const finalDuration = activeCall.duration;
    setActiveCall(null);

    if (callId && selectedConvId) {
      try {
        await fetch("/api/marketplace/messages/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConvId,
            callId,
            action: "end",
            durationSeconds: finalDuration,
          }),
        });
        loadMessages(selectedConvId);
      } catch (err) {
        console.error("Error ending call log:", err);
      }
    }
  };

  // Toggle supplier availability
  const toggleSupplierCallAvailability = async () => {
    const nextVal = !supplierCallAvailable;
    setSupplierCallAvailable(nextVal);
    try {
      await fetch("/api/marketplace/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_available: nextVal }),
      });
      showToast(`Disponibilité d'appels Direct : ${nextVal ? "Activée" : "Désactivée"}`, "info");
    } catch {
      setSupplierCallAvailable(!nextVal);
    }
  };

  // 12. Create Quick Reply
  const handleSaveQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickTitle.trim() || !newQuickContent.trim()) return;

    try {
      const res = await fetch("/api/marketplace/messages/quick-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuickTitle.trim(),
          content: newQuickContent.trim(),
          shortcut: newQuickShortcut.trim() || undefined,
        }),
      });

      if (res.ok) {
        setNewQuickTitle("");
        setNewQuickContent("");
        setNewQuickShortcut("");
        loadQuickReplies();
        showToast("Modèle de réponse enregistré !", "success");
      }
    } catch {
      showToast("Erreur lors de la sauvegarde du modèle.", "error");
    }
  };

  // Delete Quick Reply
  const handleDeleteQuickReply = async (id: string) => {
    try {
      const res = await fetch(`/api/marketplace/messages/quick-replies?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setQuickReplies((prev) => prev.filter((r) => r.id !== id));
        showToast("Modèle supprimé.", "info");
      }
    } catch {
      showToast("Erreur lors de la suppression.", "error");
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contactName = (c.supplier?.business_name || c.buyer?.name || "").toLowerCase();
        const prodTitle = (c.product?.title || "").toLowerCase();
        if (!contactName.includes(q) && !prodTitle.includes(q)) return false;
      }

      // Status tab filter
      if (activeFilter === "all") return true;
      if (activeFilter === "pre_purchase") return c.status === "pre_purchase" || !c.order_id;
      if (activeFilter === "pending_acceptance") return c.order?.status === "pending_acceptance";
      if (activeFilter === "in_progress") return c.order?.status === "in_progress";
      if (activeFilter === "delivered") return c.order?.status === "delivered";
      if (activeFilter === "completed") return c.order?.status === "completed";
      if (activeFilter === "disputed") return c.status === "disputed" || c.order?.status === "disputed";
      return true;
    });
  }, [conversations, searchQuery, activeFilter]);

  // Formatter for countdown
  const formatCountdown = (deadlineIso?: string | null) => {
    if (!deadlineIso) return null;
    const diff = new Date(deadlineIso).getTime() - Date.now();
    if (diff <= 0) return "Délai expiré";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m restantes`;
  };

  return (
    <main className="fixed inset-0 z-[9999] md:relative md:inset-auto md:z-auto h-[100dvh] md:min-h-screen flex flex-col bg-[#fcf9f8] text-[#2a211a] overflow-hidden md:overflow-visible">
      {/* Top Banner Navigation & Role Bar */}
      <header className="border-b border-[#eadfce] bg-white shadow-sm shrink-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fcf9f8] px-3.5 py-1.5 text-xs font-bold text-[#725f4d] transition hover:border-[#9e001f] hover:text-[#9e001f] active:scale-95"
              title="Quitter la messagerie et retourner au Marketplace"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Retour au site</span>
            </Link>
            <div>
              <h1 className="font-display text-lg font-black text-[#2a211a] sm:text-xl">
                Messagerie Protégée & Commandes
              </h1>
              <p className="hidden text-xs text-[#725f4d] sm:block">
                Chat transactionnel style ComeUp · Séquestre des fonds & Garantie EAM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bascule vers Réseau WAB & Crowdfunding */}
            <Link
              href="/messages"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fcf9f8] px-3 py-1.5 text-xs font-bold text-[#725f4d] transition hover:border-[#9e001f] hover:text-[#9e001f]"
              title="Accéder à la messagerie sociale WAB"
            >
              <span className="material-symbols-outlined text-[15px]">chat</span>
              <span className="hidden sm:inline">Réseau WAB</span>
            </Link>

            <Link
              href="/financement/messages"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fcf9f8] px-3 py-1.5 text-xs font-bold text-[#725f4d] transition hover:border-amber-600 hover:text-amber-700"
              title="Accéder à l'espace investisseurs Crowdfunding"
            >
              <img src="/crowdfunding-message-icon.png" alt="" className="h-3.5 w-3.5 object-contain" />
              <span className="hidden sm:inline">Crowdfunding</span>
            </Link>

            <Link
              href="/emploi/messages"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fcf9f8] px-3 py-1.5 text-xs font-bold text-[#725f4d] transition hover:border-[#087e8b] hover:text-[#087e8b]"
              title="Accéder à la messagerie Jobs & Recrutement"
            >
              <img src="/jobs-message-icon.webp" alt="" className="h-3.5 w-3.5 object-contain" />
              <span className="hidden sm:inline">Jobs</span>
            </Link>

            {/* Perspective Switcher */}
            <div className="flex items-center rounded-full border border-[#eadfce] bg-[#fcf9f8] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRoleMode("buyer")}
                className={`rounded-full px-3 py-1 transition ${
                  roleMode === "buyer"
                    ? "bg-[#9e001f] text-white shadow-sm"
                    : "text-[#725f4d] hover:text-[#2a211a]"
                }`}
              >
                Acheteur
              </button>
              <button
                type="button"
                onClick={() => setRoleMode("supplier")}
                className={`rounded-full px-3 py-1 transition ${
                  roleMode === "supplier"
                    ? "bg-[#9e001f] text-white shadow-sm"
                    : "text-[#725f4d] hover:text-[#2a211a]"
                }`}
              >
                Vendeur
              </button>
            </div>

            {/* Supplier Direct call availability toggle */}
            {roleMode === "supplier" && (
              <div className="hidden items-center gap-2 lg:flex">
                <button
                  type="button"
                  onClick={toggleSupplierCallAvailability}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    supplierCallAvailable
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-gray-100 text-gray-600"
                  }`}
                  title="Activer ou désactiver vos appels ComeUp Direct"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      supplierCallAvailable ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                    }`}
                  />
                  <span>Appels Direct : {supplierCallAvailable ? "Disponible" : "Occupé"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQuickRepliesModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfce] bg-white px-3 py-1.5 text-xs font-bold text-[#725f4d] hover:border-[#9e001f] hover:text-[#9e001f]"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-600">bolt</span>
                  <span>Modèles</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Two-Pane Workspace */}
      <div className="mx-auto max-w-7xl px-2 py-4 sm:px-6">
        <div className="grid h-[calc(100vh-140px)] min-h-[600px] grid-cols-1 overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-sm lg:grid-cols-[380px_1fr]">
          {/* ======================================================== */}
          {/* LEFT COLUMN: CONVERSATION LIST (Desktop or Mobile List)   */}
          {/* ======================================================== */}
          <aside
            className={`flex flex-col border-r border-[#eadfce] bg-[#fcfbf9] ${
              mobileView === "chat" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Search and filters */}
            <div className="border-b border-[#eadfce] p-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#a39281]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Rechercher un contact, commande..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#eadfce] bg-white py-2 pl-9 pr-3 text-xs text-[#2a211a] outline-none placeholder:text-[#a39281] focus:border-[#9e001f]"
                />
              </div>

              {/* Status Filters Scrollable Tabs */}
              <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                {[
                  { id: "all", label: "Toutes" },
                  { id: "pre_purchase", label: "Pré-achat" },
                  { id: "pending_acceptance", label: "À accepter (48h)" },
                  { id: "in_progress", label: "En cours" },
                  { id: "delivered", label: "Livrées" },
                  { id: "completed", label: "Terminées" },
                  { id: "disputed", label: "Litiges" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id as FilterTab)}
                    className={`shrink-0 rounded-full px-2.5 py-1 transition ${
                      activeFilter === tab.id
                        ? "bg-[#9e001f] text-white"
                        : "bg-white text-[#725f4d] border border-[#eadfce] hover:border-[#9e001f]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation cards stream */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#f2e9dc]">
              {loadingConversations ? (
                <div className="p-8 text-center text-xs text-[#725f4d]">Chargement des conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#725f4d]">
                  <span className="material-symbols-outlined mx-auto mb-2 block text-3xl text-[#eadfce]">
                    chat_bubble_outline
                  </span>
                  Aucune conversation trouvée dans cet onglet.
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = conv.id === selectedConvId;
                  const interlocutorName =
                    roleMode === "buyer"
                      ? conv.supplier?.business_name || "Fournisseur"
                      : conv.buyer?.name || "Acheteur";
                  const unreadCount =
                    roleMode === "buyer" ? conv.buyer_unread_count : conv.supplier_unread_count;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        setMobileView("chat");
                      }}
                      className={`w-full p-3.5 text-left transition hover:bg-[#fff7f5] ${
                        isSelected ? "bg-[#fff1ef] border-l-4 border-[#9e001f]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative h-10 w-10 shrink-0 rounded-full bg-[#f3e7d7] text-center font-bold leading-10 text-[#9e001f]">
                            {interlocutorName.charAt(0).toUpperCase()}
                            {conv.supplier?.certification_status === "certified" && (
                              <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[10px] text-white">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="truncate text-xs font-black text-[#2a211a]">
                              {interlocutorName}
                            </h4>
                            <p className="truncate text-[11px] text-[#725f4d]">
                              {conv.product?.title || "Demande d'information"}
                            </p>
                          </div>
                        </div>

                        {/* Status pill & Price */}
                        <div className="text-right shrink-0">
                          {conv.order ? (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                conv.order.status === "pending_acceptance"
                                  ? "bg-amber-100 text-amber-800 animate-pulse"
                                  : conv.order.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : conv.order.status === "delivered"
                                  ? "bg-purple-100 text-purple-800"
                                  : conv.order.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {conv.order.status === "pending_acceptance"
                                ? "48h à accepter"
                                : conv.order.status === "in_progress"
                                ? "En cours"
                                : conv.order.status === "delivered"
                                ? "Livrée (72h)"
                                : conv.order.status === "completed"
                                ? "Terminée"
                                : "Litige"}
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600">
                              Pré-achat
                            </span>
                          )}
                          {conv.order && (
                            <div className="mt-1 text-[10px] font-bold text-[#9e001f]">
                              {new Intl.NumberFormat("fr-FR").format(conv.order.total_xof)} XOF
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview snippet & unread badge */}
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#806c58]">
                        <p className="truncate max-w-[240px]">
                          {conv.last_message_preview || "Conversation ouverte"}
                        </p>
                        {unreadCount > 0 && (
                          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#9e001f] px-1 text-[10px] font-black text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: CHAT & COMMAND CENTER                      */}
          {/* ======================================================== */}
          <section
            className={`flex flex-col bg-white ${
              mobileView === "list" ? "hidden lg:flex" : "flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* 1. Chat Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#eadfce] bg-[#fffdfb] p-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileView("list")}
                      className="grid h-8 w-8 place-items-center rounded-full bg-[#f8f3ed] text-[#725f4d] lg:hidden"
                      aria-label="Retour à la liste"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    </button>

                    <div className="relative h-10 w-10 shrink-0 rounded-full bg-[#f3e7d7] text-center font-black leading-10 text-[#9e001f]">
                      {(roleMode === "buyer"
                        ? activeConversation.supplier?.business_name
                        : activeConversation.buyer?.name
                      )?.charAt(0).toUpperCase() || "C"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-black text-[#2a211a]">
                          {roleMode === "buyer"
                            ? activeConversation.supplier?.business_name || "Fournisseur Certifié"
                            : activeConversation.buyer?.name || "Client Marketplace"}
                        </h3>
                        {activeConversation.supplier?.certification_status === "certified" && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                            CERTIFIÉ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#725f4d]">
                        {activeConversation.supplier?.call_available ? (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            ComeUp Direct disponible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            Appels désactivés
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions: ComeUp Direct call & Dispute button */}
                  <div className="flex items-center gap-2">
                    {/* Audio Call */}
                    <button
                      type="button"
                      onClick={() => startCall("audio")}
                      title="Appel vocal 1:1 ComeUp Direct"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fcf9f8] px-3 text-xs font-bold text-[#2a211a] transition hover:border-emerald-600 hover:text-emerald-700"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">call</span>
                      <span className="hidden sm:inline">Vocal Direct</span>
                    </button>

                    {/* Video Call */}
                    <button
                      type="button"
                      onClick={() => startCall("video")}
                      title="Appel vidéo 1:1 ComeUp Direct"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#eadfce] bg-[#fcf9f8] px-3 text-xs font-bold text-[#2a211a] transition hover:border-emerald-600 hover:text-emerald-700"
                    >
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">videocam</span>
                      <span className="hidden sm:inline">Vidéo Direct</span>
                    </button>

                    {/* Dispute button */}
                    {activeConversation.status !== "disputed" && (
                      <button
                        type="button"
                        onClick={() => setShowDisputeModal(true)}
                        title="Signaler un litige / Arbitrage EAM"
                        className="inline-flex h-9 items-center gap-1 rounded-full border border-[#efc7c3] bg-[#fff5f3] px-2.5 text-xs font-bold text-[#9e001f] transition hover:bg-[#ffece8]"
                      >
                        <span className="material-symbols-outlined text-[16px]">shield</span>
                        <span className="hidden md:inline">Litige</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Persistent Order Lifecycle Banner */}
                {activeConversation.order ? (
                  <div className="border-b border-[#eadfce] bg-[#fefbf6] p-3 px-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-amber-600">
                          shopping_bag
                        </span>
                        <div>
                          <p className="text-xs font-black text-[#2a211a]">
                            Commande #{activeConversation.order.id.slice(0, 8)} ·{" "}
                            {activeConversation.product?.title || "Service"}
                          </p>
                          <p className="text-[11px] text-[#725f4d]">
                            Montant séquestré :{" "}
                            <strong className="text-emerald-700">
                              {new Intl.NumberFormat("fr-FR").format(activeConversation.order.total_xof)} XOF
                            </strong>{" "}
                            (Garantie ComeUp EAM)
                          </p>
                        </div>
                      </div>

                      {/* Timers & Contextual Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 48h Acceptance Countdown */}
                        {activeConversation.order.status === "pending_acceptance" && (
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800">
                              ⏳ Délai 48h : {formatCountdown(activeConversation.order.acceptance_deadline)}
                            </span>

                            {roleMode === "supplier" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOrderAction("accept_order")}
                                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700"
                                >
                                  Accepter la commande
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOrderAction("reject_order")}
                                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-200"
                                >
                                  Refuser
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* In Progress: Supplier can deliver */}
                        {activeConversation.order.status === "in_progress" && (
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-800">
                              Commande en cours de réalisation
                            </span>
                            {roleMode === "supplier" && (
                              <button
                                type="button"
                                onClick={() => setShowDeliveryModal(true)}
                                className="rounded-full bg-[#9e001f] px-3.5 py-1 text-xs font-black text-white hover:bg-[#7e0019]"
                              >
                                📦 Livrer la commande
                              </button>
                            )}
                          </div>
                        )}

                        {/* Delivered: 72h Auto-Validation Countdown */}
                        {activeConversation.order.status === "delivered" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-black text-purple-900">
                              ⏱️ Auto-validation 72h : {formatCountdown(activeConversation.order.auto_validation_deadline)}
                            </span>

                            {roleMode === "buyer" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOrderAction("validate_delivery")}
                                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700"
                                >
                                  ✓ Valider & Libérer les fonds
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowRevisionModal(true)}
                                  className="rounded-full border border-amber-600 bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 hover:bg-amber-100"
                                >
                                  🔄 Demander une retouche
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Completed */}
                        {activeConversation.order.status === "completed" && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                            ✓ Commande finalisée · Fonds libérés
                          </span>
                        )}

                        {/* Disputed */}
                        {activeConversation.order.status === "disputed" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">
                            ⚠️ Litige ouvert · En cours d'arbitrage
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-b border-[#eadfce] bg-[#fbf9f5] px-4 py-2 text-xs text-[#725f4d]">
                    <span className="font-bold text-[#2a211a]">Échange pré-achat :</span> Vous échangez
                    directement avec le vendeur avant validation de commande. Les coordonnées externes restent
                    strictement interdites.
                  </div>
                )}

                {/* 3. Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fdfcfa]">
                  {loadingMessages ? (
                    <div className="p-8 text-center text-xs text-[#725f4d]">Chargement des messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#725f4d]">
                      <span className="material-symbols-outlined mx-auto mb-2 block text-4xl text-[#eadfce]">
                        security
                      </span>
                      <p className="font-bold text-[#2a211a]">Démarrez l'échange en toute sécurité.</p>
                      <p className="mt-1">
                        Cette conversation est protégée par le séquestre et le filtre anti-contournement EAM.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        roleMode === "buyer" ? msg.sender_role === "buyer" : msg.sender_role === "supplier";
                      const msgText = msg.body || (msg as any).content || "";
                      const msgAttachments: MarketplaceAttachment[] =
                        (msg.media && msg.media.length > 0 ? msg.media : (msg as any).attachments) || [];

                      // Special Delivery Card
                      if (msg.is_delivery) {
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto my-3 max-w-xl rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-2 text-emerald-800">
                              <span className="material-symbols-outlined text-2xl">verified</span>
                              <h4 className="font-display text-sm font-black uppercase tracking-wider">
                                LIVRAISON OFFICIELLE DU VENDEUR
                              </h4>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-[#2a211a]">{msgText}</p>

                            {/* Downloadable Assets */}
                            {msg.delivery_assets && msg.delivery_assets.length > 0 && (
                              <div className="mt-3 space-y-1.5 border-t border-emerald-200 pt-3">
                                <p className="text-[11px] font-bold text-emerald-900">
                                  Fichiers livrables téléchargeables ({msg.delivery_assets.length}) :
                                </p>
                                {msg.delivery_assets.map((asset: MarketplaceAttachment, idx: number) => (
                                  <a
                                    key={idx}
                                    href={asset.url}
                                    download={asset.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between rounded-lg border border-emerald-200 bg-white p-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                                  >
                                    <span className="truncate">{asset.name}</span>
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between text-[10px] text-emerald-700">
                              <span>Horodatage officiel de livraison</span>
                              <span>
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Revision Request Card
                      if (msg.message_type === "revision") {
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto my-3 max-w-xl rounded-2xl border-2 border-amber-500 bg-amber-50/60 p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-2 text-amber-900">
                              <span className="material-symbols-outlined text-2xl">refresh</span>
                              <h4 className="font-display text-sm font-black uppercase tracking-wider">
                                DEMANDE DE RETOUCHE DE L'ACHETEUR
                              </h4>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-[#2a211a]">{msgText}</p>
                            <div className="mt-2 text-right text-[10px] text-amber-700">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        );
                      }

                      // ComeUp Direct Call Card
                      if (msg.message_type === "call" && msg.call_meta) {
                        const dur = msg.call_meta.duration_seconds || 0;
                        const mins = Math.floor(dur / 60);
                        const secs = dur % 60;
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto my-2 flex max-w-md items-center justify-between rounded-xl border border-[#eadfce] bg-white p-3 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2 text-[#2a211a]">
                              <span className="material-symbols-outlined text-emerald-600">
                                {msg.call_meta.call_type === "video" ? "videocam" : "call"}
                              </span>
                              <div>
                                <p className="font-black">
                                  Appel {msg.call_meta.call_type === "video" ? "vidéo" : "vocal"} ComeUp Direct
                                </p>
                                <p className="text-[10px] text-[#725f4d]">
                                  Durée : {mins} min {secs} sec
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-[#a39281]">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        );
                      }

                      // System Card
                      if (msg.sender_role === "system") {
                        return (
                          <div
                            key={msg.id}
                            className="mx-auto my-2 max-w-lg rounded-xl border border-[#eadfce] bg-[#f8f5ef] p-3 text-center text-xs text-[#725f4d]"
                          >
                            <span className="font-bold text-[#2a211a]">Info Système : </span>
                            {msgText}
                          </div>
                        );
                      }

                      // Standard message bubble
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                              isMe
                                ? "bg-[#9e001f] text-white rounded-br-xs"
                                : "bg-white border border-[#eadfce] text-[#2a211a] rounded-bl-xs"
                            }`}
                          >
                            <p className="whitespace-pre-line">{msgText}</p>

                            {/* Attachments rendering */}
                            {msgAttachments.length > 0 && (
                              <div className="mt-2 space-y-1.5 pt-1">
                                {msgAttachments.map((att: MarketplaceAttachment, idx: number) => {
                                  const mime = att.mimeType || (att as any).mime_type || "";
                                  const isImg = mime.startsWith("image/");
                                  const isVid = mime.startsWith("video/");
                                  if (isImg) {
                                    return (
                                      <a
                                        key={idx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block overflow-hidden rounded-lg border border-white/20"
                                      >
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          className="max-h-60 w-full object-cover"
                                        />
                                      </a>
                                    );
                                  }
                                  if (isVid) {
                                    return (
                                      <video
                                        key={idx}
                                        src={att.url}
                                        controls
                                        className="max-h-60 w-full rounded-lg"
                                      />
                                    );
                                  }
                                  return (
                                    <a
                                      key={idx}
                                      href={att.url}
                                      download={att.name}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center justify-between rounded-lg p-2 text-xs font-bold ${
                                        isMe ? "bg-white/15 text-white" : "bg-gray-100 text-[#2a211a]"
                                      }`}
                                    >
                                      <span className="truncate">{att.name}</span>
                                      <span className="material-symbols-outlined text-[16px]">download</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-[#a39281]">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMe && (
                              msg.status === "sending" ? (
                                <span className="material-symbols-outlined text-[13px] text-amber-500 animate-spin" title="Envoi en cours...">
                                  progress_activity
                                </span>
                              ) : msg.status === "failed" ? (
                                <div className="flex items-center gap-1 text-rose-500">
                                  <span className="material-symbols-outlined text-[13px]">error</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRetryMessage(msg)}
                                    className="underline font-bold text-[10px] hover:text-rose-700 cursor-pointer"
                                  >
                                    Réessayer
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`material-symbols-outlined text-[13px] ${
                                    msg.read_at ? "text-sky-500 font-bold" : "text-[#a39281]"
                                  }`}
                                  title={msg.read_at ? "Lu" : "Distribué"}
                                >
                                  done_all
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 4. Anti-Circumvention Ribbon & Input Form */}
                <div className="border-t border-[#eadfce] bg-white p-3">
                  {/* Security Ribbon */}
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#fff8f5] px-3 py-1.5 text-[11px] text-[#725f4d]">
                    <span className="material-symbols-outlined text-[16px] text-[#9e001f]">verified_user</span>
                    <span>
                      Transactions protégées sous séquestre EAM. Les échanges de numéros, e-mails et paiements
                      hors plateforme sont automatiquement bloqués.
                    </span>
                  </div>

                  {/* Real-time Anti-Circumvention Warning */}
                  {antiCircumventionWarning && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-bold text-amber-900">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                      <span>{antiCircumventionWarning}</span>
                    </div>
                  )}

                  {/* Frozen conversation notice */}
                  {activeConversation.status === "disputed" ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-800">
                      Cette conversation est actuellement gelée sous procédure d'arbitrage par l'équipe EAM.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
                      {/* Attachment file button */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,video/*,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || sending}
                        title="Joindre un fichier (image, vidéo, document jusqu'à 25Mo)"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadfce] bg-[#fcf9f8] text-[#725f4d] hover:border-[#9e001f] hover:text-[#9e001f] disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {uploading ? "hourglass_top" : "attach_file"}
                        </span>
                      </button>

                      {/* Quick Replies for Sellers */}
                      {roleMode === "supplier" && quickReplies.length > 0 && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowQuickMenu(!showQuickMenu)}
                            title="Modèles de réponses rapides"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#eadfce] bg-[#fcf9f8] text-amber-600 hover:border-amber-600"
                          >
                            <span className="material-symbols-outlined text-[20px]">bolt</span>
                          </button>

                          {showQuickMenu && (
                            <div className="absolute bottom-12 left-0 z-20 w-64 rounded-xl border border-[#eadfce] bg-white p-2 shadow-xl">
                              <p className="px-2 py-1 text-[10px] font-black uppercase text-[#a39281]">
                                Réponses rapides
                              </p>
                              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                                {quickReplies.map((qr) => (
                                  <button
                                    key={qr.id}
                                    type="button"
                                    onClick={() => {
                                      setInputText(qr.content);
                                      setShowQuickMenu(false);
                                    }}
                                    className="w-full p-2 text-left text-xs font-bold text-[#2a211a] hover:bg-gray-50"
                                  >
                                    <div className="truncate">{qr.title}</div>
                                    <div className="truncate text-[10px] font-normal text-gray-500">
                                      {qr.content}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Input area */}
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Écrivez votre message..."
                        rows={1}
                        className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-[#eadfce] bg-[#fcf9f8] p-2.5 text-xs text-[#2a211a] outline-none placeholder:text-[#a39281] focus:border-[#9e001f]"
                      />

                      {/* Send button */}
                      <button
                        type="submit"
                        disabled={sending || uploading || !inputText.trim()}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#9e001f] text-white shadow-sm hover:bg-[#7e0019] disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              // Empty State
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#725f4d]">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fff5f3] text-[#9e001f]">
                  <span className="material-symbols-outlined text-3xl">chat</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-black text-[#2a211a]">
                  Sélectionnez une conversation
                </h3>
                <p className="mt-1 max-w-sm text-xs leading-relaxed">
                  Choisissez une discussion dans la colonne de gauche ou contactez un vendeur depuis la fiche d'un
                  produit du Marketplace.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    Séquestre des fonds
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-800">
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    ComeUp Direct 1:1
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: SUBMIT DELIVERY (Seller)                          */}
      {/* ======================================================== */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-black text-[#2a211a]">
              Livrer la commande #{activeConversation?.order?.id.slice(0, 8)}
            </h3>
            <p className="mt-1 text-xs text-[#725f4d]">
              Fournissez votre livrable définitif. L'acheteur aura 72 heures pour valider la livraison ou demander une
              retouche. Sans action sous 72h, la validation sera automatique et vos fonds seront libérés.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2a211a]">
                  Message d'accompagnement & instructions *
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Bonjour, voici le livrable final de votre commande..."
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#eadfce] p-3 text-xs outline-none focus:border-[#9e001f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2a211a]">Fichiers livrables (ZIP, PDF, images...)</label>
                <input
                  type="file"
                  ref={deliveryFileInputRef}
                  onChange={handleDeliveryFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => deliveryFileInputRef.current?.click()}
                  className="mt-1 inline-flex items-center gap-2 rounded-xl border border-dashed border-[#eadfce] bg-[#fcf9f8] px-4 py-2.5 text-xs font-bold text-[#725f4d] hover:border-[#9e001f] hover:text-[#9e001f]"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Ajouter un fichier livrable
                </button>

                {deliveryFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {deliveryFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-bold"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setDeliveryFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeliveryModal(false)}
                className="rounded-full border border-[#eadfce] px-4 py-2 text-xs font-bold text-[#725f4d]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submittingDelivery || !deliveryNote.trim()}
                onClick={handleSubmitDelivery}
                className="rounded-full bg-[#9e001f] px-5 py-2 text-xs font-black text-white hover:bg-[#7e0019] disabled:opacity-50"
              >
                {submittingDelivery ? "Transmission..." : "Confirmer la livraison"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REQUEST REVISION (Buyer)                          */}
      {/* ======================================================== */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-black text-[#2a211a]">Demander une retouche</h3>
            <p className="mt-1 text-xs text-[#725f4d]">
              Indiquez clairement ce qui doit être modifié ou amélioré par rapport au cahier des charges initial.
              (Retouches utilisées : {activeConversation?.order?.revisions_used || 0}/
              {activeConversation?.order?.revisions_max || 2})
            </p>

            <div className="mt-4">
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Ex : Merci de corriger les couleurs selon la charte..."
                rows={4}
                className="w-full rounded-xl border border-[#eadfce] p-3 text-xs outline-none focus:border-[#9e001f]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="rounded-full border border-[#eadfce] px-4 py-2 text-xs font-bold text-[#725f4d]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submittingRevision || !revisionReason.trim()}
                onClick={handleRequestRevision}
                className="rounded-full bg-amber-600 px-5 py-2 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {submittingRevision ? "Envoi..." : "Envoyer la demande de retouche"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DISPUTE PROCEDURE                                 */}
      {/* ======================================================== */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600">
              <span className="material-symbols-outlined text-2xl">shield</span>
              <h3 className="font-display text-lg font-black text-[#2a211a]">
                Signaler un Litige / Arbitrage EAM
              </h3>
            </div>
            <p className="mt-1 text-xs text-[#725f4d]">
              L'ouverture d'un litige gèle immédiatement la commande et les fonds en séquestre. La discussion est
              suspendue et transmise à un médiateur de l'équipe Support EAM.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2a211a]">Motif du litige</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#eadfce] bg-white p-2.5 text-xs outline-none focus:border-[#9e001f]"
                >
                  <option value="Non-respect des délais ou de la description">
                    Non-respect des délais ou de la description
                  </option>
                  <option value="Qualité de livraison non conforme">Qualité de livraison non conforme</option>
                  <option value="Partie injoignable ou silence prolongé">
                    Partie injoignable ou silence prolongé
                  </option>
                  <option value="Tentative de contournement ou demande externe">
                    Tentative de contournement ou demande externe
                  </option>
                  <option value="Autre motif grave">Autre motif grave</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2a211a]">Explications détaillées *</label>
                <textarea
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Décrivez les faits avec précision..."
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#eadfce] p-3 text-xs outline-none focus:border-[#9e001f]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="rounded-full border border-[#eadfce] px-4 py-2 text-xs font-bold text-[#725f4d]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submittingDispute || !disputeDescription.trim()}
                onClick={handleSubmitDispute}
                className="rounded-full bg-red-600 px-5 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submittingDispute ? "Déclenchement..." : "Déclencher l'arbitrage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: COMEUP DIRECT 1:1 CALL                            */}
      {/* ======================================================== */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#1c1917] p-8 text-center text-white shadow-2xl">
            {/* Visual simulation of call */}
            <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-emerald-500/20 ring-8 ring-emerald-500/10">
              <span className="material-symbols-outlined text-5xl text-emerald-400">
                {activeCall.type === "video" ? "videocam" : "call"}
              </span>
            </div>

            <h3 className="font-display text-xl font-black">
              {roleMode === "buyer"
                ? activeConversation?.supplier?.business_name
                : activeConversation?.buyer?.name || "Contact Marketplace"}
            </h3>
            <p className="mt-1 text-xs text-emerald-400">
              Appel {activeCall.type === "video" ? "Vidéo" : "Vocal"} ComeUp Direct en cours
            </p>

            {/* Call duration timer */}
            <div className="mt-4 font-mono text-2xl font-black tracking-widest text-white">
              {String(Math.floor(activeCall.duration / 60)).padStart(2, "0")}:
              {String(activeCall.duration % 60).padStart(2, "0")}
            </div>

            {/* Video preview placeholder if video */}
            {activeCall.type === "video" && (
              <div className="relative mx-auto mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-[#292524] ring-1 ring-white/10">
                <div className="grid h-full place-items-center text-xs text-gray-400">
                  <span>Flux vidéo chiffré ComeUp Direct 1:1</span>
                </div>
                {/* PIP preview */}
                <div className="absolute bottom-2 right-2 h-14 w-20 rounded-lg bg-black/60 ring-1 ring-white/20">
                  <div className="grid h-full place-items-center text-[9px] text-gray-300">Vous</div>
                </div>
              </div>
            )}

            {/* Call Controls */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : null))}
                className={`grid h-12 w-12 place-items-center rounded-full transition ${
                  activeCall.muted ? "bg-red-600 text-white" : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <span className="material-symbols-outlined">{activeCall.muted ? "mic_off" : "mic"}</span>
              </button>

              {activeCall.type === "video" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveCall((prev) =>
                      prev ? { ...prev, videoEnabled: !prev.videoEnabled } : null
                    )
                  }
                  className={`grid h-12 w-12 place-items-center rounded-full transition ${
                    !activeCall.videoEnabled
                      ? "bg-red-600 text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {activeCall.videoEnabled ? "videocam" : "videocam_off"}
                  </span>
                </button>
              )}

              {/* Hang up */}
              <button
                type="button"
                onClick={endCall}
                className="grid h-14 w-14 place-items-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-700"
              >
                <span className="material-symbols-outlined text-2xl">call_end</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK REPLIES MANAGER                             */}
      {/* ======================================================== */}
      {showQuickRepliesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-black text-[#2a211a]">Modèles de réponses rapides</h3>
            <p className="mt-1 text-xs text-[#725f4d]">
              Créez des messages types pour répondre rapidement aux questions fréquentes de vos clients.
            </p>

            <form onSubmit={handleSaveQuickReply} className="mt-4 space-y-3 rounded-xl bg-gray-50 p-3">
              <input
                type="text"
                placeholder="Titre du modèle (ex: Demande de brief)"
                value={newQuickTitle}
                onChange={(e) => setNewQuickTitle(e.target.value)}
                className="w-full rounded-lg border border-[#eadfce] bg-white p-2 text-xs"
                required
              />
              <textarea
                placeholder="Contenu du message..."
                value={newQuickContent}
                onChange={(e) => setNewQuickContent(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#eadfce] bg-white p-2 text-xs"
                required
              />
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Raccourci optionnel (ex: /brief)"
                  value={newQuickShortcut}
                  onChange={(e) => setNewQuickShortcut(e.target.value)}
                  className="rounded-lg border border-[#eadfce] bg-white p-2 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[#9e001f] px-4 py-1.5 text-xs font-black text-white hover:bg-[#7e0019]"
                >
                  Ajouter
                </button>
              </div>
            </form>

            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {quickReplies.map((qr) => (
                <div
                  key={qr.id}
                  className="flex items-start justify-between rounded-xl border border-[#eadfce] p-3 text-xs"
                >
                  <div>
                    <h5 className="font-black text-[#2a211a]">{qr.title}</h5>
                    <p className="mt-1 text-[#725f4d]">{qr.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuickReply(qr.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowQuickRepliesModal(false)}
                className="rounded-full border border-[#eadfce] px-5 py-2 text-xs font-bold text-[#725f4d]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl p-4 shadow-2xl text-xs font-bold transition-all ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "warning"
              ? "bg-amber-600 text-white"
              : toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-[#2a211a] text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "error"
              ? "error"
              : toast.type === "warning"
              ? "warning"
              : toast.type === "success"
              ? "check_circle"
              : "info"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}
