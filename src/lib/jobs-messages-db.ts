import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "./supabase-admin";
import { readJobsDB } from "./jobs-db";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const MESSAGES_FILE = path.join(DATA_DIR, "jobs-messages.json");

export interface JobsSubscriptionStatus {
  active: boolean;
  audience?: "candidate" | "employer";
  planCode?: string;
  startsAt?: string;
  endsAt?: string | null;
  reason?: string;
}

export interface JobsParticipant {
  id: string;
  conversationId: string;
  userId: string;
  fullName: string;
  role: "candidate" | "employer" | "recruiter" | "admin";
  headline?: string;
  avatarUrl?: string;
  companyName?: string;
  isSubscriptionActive: boolean;
  subscriptionExpiresAt?: string | null;
  status: "active" | "left" | "removed";
  lastReadAt?: string;
  joinedAt: string;
}

export interface JobsAttachment {
  id: string;
  messageId: string;
  type: "document" | "image" | "video" | "voice";
  url: string;
  name: string;
  size: number;
  duration?: number;
  mimeType?: string;
  createdAt: string;
}

export interface JobsMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "candidate" | "employer" | "recruiter" | "admin" | "system";
  senderAvatar?: string;
  content: string;
  type: "text" | "voice" | "image" | "video" | "document" | "system";
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedFor?: string[];
  replyToId?: string;
  replyToMessage?: {
    id: string;
    senderName: string;
    content: string;
    type: string;
  };
  reactions: Record<string, string[]>; // emoji -> [userIds]
  readBy: string[];
  createdAt: string;
  attachments: JobsAttachment[];
}

export interface JobsConversation {
  id: string;
  title?: string;
  type: "direct" | "group";
  jobOfferId?: string;
  jobOfferTitle?: string;
  creatorId: string;
  isReadOnly: boolean;
  readOnlyReason?: string;
  status: "active" | "archived" | "blocked";
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content?: string;
    senderId?: string;
    senderName?: string;
    createdAt?: string;
    type?: string;
  };
  unreadCount?: number;
  participants: JobsParticipant[];
}

export interface JobsCallSession {
  id: string;
  conversationId: string;
  initiatorId: string;
  initiatorName: string;
  callType: "audio" | "video";
  isGroup: boolean;
  status: "initiated" | "ringing" | "connected" | "ended" | "declined" | "missed";
  participants: string[];
  sdpOffer?: any;
  sdpAnswer?: any;
  iceCandidates?: any[];
  durationSeconds: number;
  createdAt: string;
  endedAt?: string;
}

export interface JobsBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason?: string;
  createdAt: string;
}

export interface JobsReport {
  id: string;
  conversationId: string;
  reporterId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
  category: "spam" | "scam" | "harassment" | "fake_job" | "inappropriate" | "other";
  description: string;
  status: "pending" | "resolved" | "dismissed";
  adminNotes?: string;
  createdAt: string;
}

interface JobsDataStore {
  conversations: JobsConversation[];
  participants: JobsParticipant[];
  messages: JobsMessage[];
  attachments: JobsAttachment[];
  calls: JobsCallSession[];
  blocks: JobsBlock[];
  reports: JobsReport[];
  subscriptions: Record<string, JobsSubscriptionStatus>;
}

function initDataStore(): JobsDataStore {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    const empty: JobsDataStore = {
      conversations: [],
      participants: [],
      messages: [],
      attachments: [],
      calls: [],
      blocks: [],
      reports: [],
      subscriptions: {},
    };
    try {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(empty, null, 2), "utf-8");
    } catch {}
    return empty;
  }
  try {
    const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      conversations: [],
      participants: [],
      messages: [],
      attachments: [],
      calls: [],
      blocks: [],
      reports: [],
      subscriptions: {},
    };
  }
}

function writeDataStore(data: JobsDataStore) {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write jobs-messages.json:", err);
  }
}

/**
 * Vérifie si un utilisateur possède un abonnement Jobs actif.
 * Vérifie d'abord dans Supabase (jobs_subscriptions) puis dans le store local.
 */
export async function checkUserJobsSubscription(userId: string): Promise<JobsSubscriptionStatus> {
  if (!userId) {
    return { active: false, reason: "Identifiant utilisateur manquant." };
  }

  // 1. Supabase check
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("jobs_subscriptions")
        .select("id, audience, plan_code, starts_at, ends_at, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          active: true,
          audience: data.audience as "candidate" | "employer",
          planCode: data.plan_code,
          startsAt: data.starts_at,
          endsAt: data.ends_at,
        };
      }
    } catch {
      // Continue to local fallback
    }
  }

  // 2. Local fallback check
  const store = initDataStore();
  const localSub = store.subscriptions[userId];
  if (localSub && localSub.active) {
    if (!localSub.endsAt || new Date(localSub.endsAt).getTime() > Date.now()) {
      return localSub;
    }
  }

  // Si l'utilisateur a créé une offre d'emploi dans jobs.json ou profil candidat, on accorde un accès actif par défaut en environnement de test
  const jobsData = readJobsDB();
  const isPoster = (jobsData.offers || []).some((o) => o.createdBy === userId);
  const isCandidate = (jobsData.candidates || []).some((c) => c.id === userId);

  if (isPoster || isCandidate) {
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const fallbackStatus: JobsSubscriptionStatus = {
      active: true,
      audience: isPoster ? "employer" : "candidate",
      planCode: isPoster ? "employer_month" : "candidate_month",
      startsAt: new Date().toISOString(),
      endsAt: end,
    };
    store.subscriptions[userId] = fallbackStatus;
    writeDataStore(store);
    return fallbackStatus;
  }

  return {
    active: false,
    reason: "Aucun abonnement Jobs actif trouvé.",
  };
}

/**
 * Active ou met à jour manuellement un abonnement pour un utilisateur (utile en dev/test ou webhook)
 */
export async function setMockJobsSubscription(userId: string, audience: "candidate" | "employer", durationDays = 30) {
  const store = initDataStore();
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + durationDays * 86400000).toISOString();

  store.subscriptions[userId] = {
    active: true,
    audience,
    planCode: audience === "employer" ? "employer_month" : "candidate_month",
    startsAt,
    endsAt,
  };
  writeDataStore(store);
  return store.subscriptions[userId];
}

/**
 * Récupère ou génère les données de base pour enrichir une conversation
 */
async function enrichConversation(conv: JobsConversation, currentUserId: string): Promise<JobsConversation> {
  const store = initDataStore();
  const participants = store.participants.filter((p) => p.conversationId === conv.id);

  // Vérifier le statut de l'abonnement pour CHAQUE participant
  let anyExpired = false;
  let userSelfActive = true;
  let peerActive = true;

  const enrichedParticipants: JobsParticipant[] = [];

  for (const p of participants) {
    const sub = await checkUserJobsSubscription(p.userId);
    const isAct = sub.active;
    if (!isAct) anyExpired = true;
    if (p.userId === currentUserId && !isAct) userSelfActive = false;
    if (p.userId !== currentUserId && !isAct) peerActive = false;

    enrichedParticipants.push({
      ...p,
      isSubscriptionActive: isAct,
      subscriptionExpiresAt: sub.endsAt,
      role: (sub.audience as any) || p.role || "candidate",
    });
  }

  // Messages de cette conversation
  const convMessages = store.messages
    .filter((m) => m.conversationId === conv.id && !m.deletedFor?.includes(currentUserId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const lastMsg = convMessages[convMessages.length - 1];

  // Unread count
  const myParticipant = participants.find((p) => p.userId === currentUserId);
  const lastReadTime = myParticipant?.lastReadAt ? new Date(myParticipant.lastReadAt).getTime() : 0;
  const unreadCount = convMessages.filter(
    (m) => m.senderId !== currentUserId && new Date(m.createdAt).getTime() > lastReadTime
  ).length;

  let readOnlyReason: string | undefined = undefined;
  if (anyExpired) {
    if (!userSelfActive && !peerActive) {
      readOnlyReason = "Votre abonnement Jobs ainsi que celui de votre contact sont arrivés à expiration.";
    } else if (!userSelfActive) {
      readOnlyReason = "Votre abonnement Jobs est arrivé à expiration. Renouvelez votre abonnement pour reprendre les échanges.";
    } else {
      readOnlyReason = "L'abonnement Jobs de votre contact est arrivé à expiration. La discussion reprendra dès son renouvellement.";
    }
  }

  return {
    ...conv,
    isReadOnly: anyExpired,
    readOnlyReason,
    participants: enrichedParticipants,
    unreadCount,
    lastMessage: lastMsg
      ? {
          content: lastMsg.content,
          senderId: lastMsg.senderId,
          senderName: lastMsg.senderName,
          createdAt: lastMsg.createdAt,
          type: lastMsg.type,
        }
      : undefined,
  };
}

/**
 * Liste toutes les conversations d'un utilisateur
 */
export async function listJobsConversations(userId: string): Promise<JobsConversation[]> {
  const store = initDataStore();

  // Obtenir les conversationIds dont userId est participant
  const myParticipants = store.participants.filter((p) => p.userId === userId && p.status === "active");
  const convIds = new Set(myParticipants.map((p) => p.conversationId));

  const userConversations = store.conversations.filter((c) => convIds.has(c.id));

  const enriched: JobsConversation[] = [];
  for (const c of userConversations) {
    enriched.push(await enrichConversation(c, userId));
  }

  // Trier par date de mise à jour décroissante
  return enriched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Récupère une conversation spécifique
 */
export async function getJobsConversation(conversationId: string, userId: string): Promise<JobsConversation | null> {
  const store = initDataStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  if (!conv) return null;

  const isParticipant = store.participants.some((p) => p.conversationId === conversationId && p.userId === userId);
  if (!isParticipant) return null;

  return await enrichConversation(conv, userId);
}

/**
 * Crée ou retrouve une conversation Jobs
 */
export async function createJobsConversation(params: {
  creatorId: string;
  creatorName?: string;
  targetUserId: string;
  targetUserName?: string;
  type?: "direct" | "group";
  title?: string;
  jobOfferId?: string;
  jobOfferTitle?: string;
  initialMessage?: string;
}): Promise<JobsConversation> {
  const store = initDataStore();

  // Pour une conversation directe 1:1, vérifier si elle existe déjà
  if (params.type !== "group") {
    const existing = store.conversations.find((c) => {
      if (c.type === "group") return false;
      const parts = store.participants.filter((p) => p.conversationId === c.id);
      const userIds = parts.map((p) => p.userId);
      return userIds.includes(params.creatorId) && userIds.includes(params.targetUserId);
    });

    if (existing) {
      if (params.initialMessage) {
        await sendJobsMessage({
          conversationId: existing.id,
          senderId: params.creatorId,
          senderName: params.creatorName || "Utilisateur",
          content: params.initialMessage,
        });
      }
      return await enrichConversation(existing, params.creatorId);
    }
  }

  const convId = uuidv4();
  const now = new Date().toISOString();

  // Déterminer les profils / rôles
  const creatorSub = await checkUserJobsSubscription(params.creatorId);
  const targetSub = await checkUserJobsSubscription(params.targetUserId);

  const newConv: JobsConversation = {
    id: convId,
    title: params.title || (params.jobOfferTitle ? `Échange: ${params.jobOfferTitle}` : undefined),
    type: params.type || "direct",
    jobOfferId: params.jobOfferId,
    jobOfferTitle: params.jobOfferTitle,
    creatorId: params.creatorId,
    isReadOnly: !creatorSub.active || !targetSub.active,
    status: "active",
    createdAt: now,
    updatedAt: now,
    participants: [],
  };

  store.conversations.push(newConv);

  // Participant Créateur
  store.participants.push({
    id: uuidv4(),
    conversationId: convId,
    userId: params.creatorId,
    fullName: params.creatorName || "Recruteur / Candidat",
    role: creatorSub.audience === "employer" ? "employer" : "candidate",
    isSubscriptionActive: creatorSub.active,
    subscriptionExpiresAt: creatorSub.endsAt,
    status: "active",
    lastReadAt: now,
    joinedAt: now,
  });

  // Participant Cible
  store.participants.push({
    id: uuidv4(),
    conversationId: convId,
    userId: params.targetUserId,
    fullName: params.targetUserName || "Contact Jobs",
    role: targetSub.audience === "employer" ? "employer" : "candidate",
    isSubscriptionActive: targetSub.active,
    subscriptionExpiresAt: targetSub.endsAt,
    status: "active",
    lastReadAt: now,
    joinedAt: now,
  });

  writeDataStore(store);

  if (params.initialMessage) {
    await sendJobsMessage({
      conversationId: convId,
      senderId: params.creatorId,
      senderName: params.creatorName || "Utilisateur",
      content: params.initialMessage,
    });
  }

  return await enrichConversation(newConv, params.creatorId);
}

/**
 * Récupère les messages d'une conversation
 */
export async function listJobsMessages(conversationId: string, userId: string): Promise<JobsMessage[]> {
  const store = initDataStore();

  const isParticipant = store.participants.some(
    (p) => p.conversationId === conversationId && p.userId === userId
  );
  if (!isParticipant) {
    throw new Error("Accès refusé : vous n'êtes pas participant à cette conversation Jobs.");
  }

  // Mettre à jour lastReadAt
  const participant = store.participants.find(
    (p) => p.conversationId === conversationId && p.userId === userId
  );
  if (participant) {
    participant.lastReadAt = new Date().toISOString();
    writeDataStore(store);
  }

  const messages = store.messages
    .filter((m) => m.conversationId === conversationId && !m.deletedFor?.includes(userId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Remplir les replyTo quotes
  return messages.map((m) => {
    if (m.replyToId) {
      const quoted = store.messages.find((orig) => orig.id === m.replyToId);
      if (quoted) {
        m.replyToMessage = {
          id: quoted.id,
          senderName: quoted.senderName,
          content: quoted.isDeleted ? "Ce message a été supprimé" : quoted.content,
          type: quoted.type,
        };
      }
    }
    return m;
  });
}

/**
 * Envoie un message dans une conversation Jobs
 * Bloque l'envoi si l'un des abonnements a expiré !
 */
export async function sendJobsMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: "candidate" | "employer" | "recruiter" | "admin" | "system";
  senderAvatar?: string;
  content: string;
  type?: "text" | "voice" | "image" | "video" | "document" | "system";
  replyToId?: string;
  attachments?: Omit<JobsAttachment, "id" | "messageId" | "createdAt">[];
}): Promise<JobsMessage> {
  const store = initDataStore();

  const conv = store.conversations.find((c) => c.id === params.conversationId);
  if (!conv) {
    throw new Error("Conversation Jobs introuvable.");
  }

  // Vérifier si le sender est participant
  const senderPart = store.participants.find(
    (p) => p.conversationId === params.conversationId && p.userId === params.senderId
  );
  if (!senderPart) {
    throw new Error("Vous n'êtes pas autorisé à envoyer de message dans cette conversation.");
  }

  // Vérifier les blocages
  const isBlocked = store.blocks.some((b) => {
    const otherParts = store.participants.filter(
      (p) => p.conversationId === params.conversationId && p.userId !== params.senderId
    );
    return otherParts.some(
      (op) =>
        (b.blockerId === params.senderId && b.blockedId === op.userId) ||
        (b.blockerId === op.userId && b.blockedId === params.senderId)
    );
  });
  if (isBlocked) {
    throw new Error("Échange impossible : un blocage est actif entre les correspondants.");
  }

  // RÈGLE CARDINALE DU PRD : VÉRIFIER L'ABONNEMENT DES DEUX PARTIES !
  const participants = store.participants.filter((p) => p.conversationId === params.conversationId);
  for (const p of participants) {
    const sub = await checkUserJobsSubscription(p.userId);
    if (!sub.active) {
      throw new Error(
        p.userId === params.senderId
          ? "Votre abonnement Jobs a expiré. Veuillez activer un pass pour envoyer des messages."
          : "L'abonnement Jobs de votre contact a expiré. La conversation est en lecture seule."
      );
    }
  }

  const messageId = uuidv4();
  const now = new Date().toISOString();

  const newAttachments: JobsAttachment[] = (params.attachments || []).map((att) => ({
    id: uuidv4(),
    messageId,
    type: att.type,
    url: att.url,
    name: att.name,
    size: att.size || 0,
    duration: att.duration,
    mimeType: att.mimeType,
    createdAt: now,
  }));

  const newMessage: JobsMessage = {
    id: messageId,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole || senderPart.role || "candidate",
    senderAvatar: params.senderAvatar,
    content: params.content,
    type: params.type || "text",
    replyToId: params.replyToId,
    reactions: {},
    readBy: [params.senderId],
    createdAt: now,
    attachments: newAttachments,
  };

  store.messages.push(newMessage);
  if (newAttachments.length > 0) {
    store.attachments.push(...newAttachments);
  }

  // Mettre à jour la date de la conversation
  conv.updatedAt = now;
  senderPart.lastReadAt = now;

  writeDataStore(store);
  return newMessage;
}

/**
 * Interactions sur messages : Réactions, Modification (15 min), Suppression
 */
export async function interactJobsMessage(params: {
  messageId: string;
  userId: string;
  action: "react" | "edit" | "delete_for_me" | "delete_for_all";
  emoji?: string;
  newContent?: string;
}): Promise<JobsMessage> {
  const store = initDataStore();
  const msg = store.messages.find((m) => m.id === params.messageId);
  if (!msg) throw new Error("Message Jobs introuvable.");

  const now = Date.now();
  const messageTime = new Date(msg.createdAt).getTime();
  const isAuthor = msg.senderId === params.userId;
  const isWithin15Min = now - messageTime <= 15 * 60 * 1000;

  if (params.action === "react") {
    if (!params.emoji) throw new Error("Emoji manquant.");
    msg.reactions = msg.reactions || {};
    const users = msg.reactions[params.emoji] || [];
    if (users.includes(params.userId)) {
      msg.reactions[params.emoji] = users.filter((u) => u !== params.userId);
      if (msg.reactions[params.emoji].length === 0) {
        delete msg.reactions[params.emoji];
      }
    } else {
      msg.reactions[params.emoji] = [...users, params.userId];
    }
  } else if (params.action === "edit") {
    if (!isAuthor) throw new Error("Seul l'auteur peut modifier ce message.");
    if (!isWithin15Min) throw new Error("La modification n'est permise que dans les 15 minutes suivant l'envoi.");
    if (!params.newContent?.trim()) throw new Error("Le contenu modifié ne peut pas être vide.");

    msg.content = params.newContent.trim();
    msg.isEdited = true;
    msg.editedAt = new Date().toISOString();
  } else if (params.action === "delete_for_all") {
    if (!isAuthor) throw new Error("Seul l'auteur peut supprimer pour tous.");
    if (!isWithin15Min) throw new Error("La suppression pour tous n'est permise que dans les 15 minutes.");

    msg.isDeleted = true;
    msg.content = "Ce message a été supprimé";
    msg.attachments = [];
  } else if (params.action === "delete_for_me") {
    msg.deletedFor = msg.deletedFor || [];
    if (!msg.deletedFor.includes(params.userId)) {
      msg.deletedFor.push(params.userId);
    }
  }

  writeDataStore(store);
  return msg;
}

/**
 * Gestion des appels WebRTC Jobs (Audio et Vidéo)
 */
export async function handleJobsCall(params: {
  action: "initiate" | "signal" | "answer" | "end" | "poll";
  conversationId?: string;
  callId?: string;
  userId: string;
  userName?: string;
  callType?: "audio" | "video";
  isGroup?: boolean;
  sdpOffer?: any;
  sdpAnswer?: any;
  iceCandidate?: any;
}): Promise<JobsCallSession | { activeCalls: JobsCallSession[] }> {
  const store = initDataStore();

  if (params.action === "poll") {
    // Récupérer les appels en cours ou qui sonnent où userId participe
    const myConvs = new Set(
      store.participants.filter((p) => p.userId === params.userId).map((p) => p.conversationId)
    );
    const activeCalls = store.calls.filter(
      (c) =>
        myConvs.has(c.conversationId) &&
        (c.status === "initiated" || c.status === "ringing" || c.status === "connected")
    );
    return { activeCalls };
  }

  if (params.action === "initiate") {
    if (!params.conversationId) throw new Error("Conversation ID requis.");

    // Vérifier abonnement
    const sub = await checkUserJobsSubscription(params.userId);
    if (!sub.active) {
      throw new Error("Abonnement Jobs requis pour lancer un appel.");
    }

    const participants = store.participants.filter((p) => p.conversationId === params.conversationId);
    for (const p of participants) {
      const pSub = await checkUserJobsSubscription(p.userId);
      if (!pSub.active) {
        throw new Error("Tous les participants doivent avoir un abonnement Jobs actif pour les appels.");
      }
    }

    const callId = uuidv4();
    const newCall: JobsCallSession = {
      id: callId,
      conversationId: params.conversationId,
      initiatorId: params.userId,
      initiatorName: params.userName || "Utilisateur Jobs",
      callType: params.callType || "audio",
      isGroup: Boolean(params.isGroup),
      status: "ringing",
      participants: [params.userId],
      sdpOffer: params.sdpOffer,
      durationSeconds: 0,
      createdAt: new Date().toISOString(),
    };

    store.calls.push(newCall);
    writeDataStore(store);
    return newCall;
  }

  if (params.action === "answer" || params.action === "signal") {
    if (!params.callId) throw new Error("Call ID requis.");
    const call = store.calls.find((c) => c.id === params.callId);
    if (!call) throw new Error("Appel Jobs introuvable.");

    if (params.sdpAnswer) {
      call.sdpAnswer = params.sdpAnswer;
      call.status = "connected";
      if (!call.participants.includes(params.userId)) {
        call.participants.push(params.userId);
      }
    }

    if (params.iceCandidate) {
      call.iceCandidates = call.iceCandidates || [];
      call.iceCandidates.push({ from: params.userId, candidate: params.iceCandidate });
    }

    writeDataStore(store);
    return call;
  }

  if (params.action === "end") {
    if (!params.callId) throw new Error("Call ID requis.");
    const call = store.calls.find((c) => c.id === params.callId);
    if (!call) throw new Error("Appel introuvable.");

    call.status = "ended";
    call.endedAt = new Date().toISOString();
    call.durationSeconds = Math.max(
      1,
      Math.round((new Date(call.endedAt).getTime() - new Date(call.createdAt).getTime()) / 1000)
    );

    writeDataStore(store);
    return call;
  }

  throw new Error("Action d'appel Jobs inconnue.");
}

/**
 * Blocages
 */
export async function toggleJobsBlock(blockerId: string, blockedId: string, reason?: string) {
  const store = initDataStore();
  const existingIdx = store.blocks.findIndex(
    (b) => b.blockerId === blockerId && b.blockedId === blockedId
  );

  if (existingIdx >= 0) {
    store.blocks.splice(existingIdx, 1);
    writeDataStore(store);
    return { blocked: false };
  } else {
    store.blocks.push({
      id: uuidv4(),
      blockerId,
      blockedId,
      reason,
      createdAt: new Date().toISOString(),
    });
    writeDataStore(store);
    return { blocked: true };
  }
}

/**
 * Signalements
 */
export async function reportJobsIncident(params: {
  reporterId: string;
  conversationId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
  category: "spam" | "scam" | "harassment" | "fake_job" | "inappropriate" | "other";
  description: string;
}) {
  const store = initDataStore();
  const report: JobsReport = {
    id: uuidv4(),
    reporterId: params.reporterId,
    conversationId: params.conversationId,
    reportedUserId: params.reportedUserId,
    reportedMessageId: params.reportedMessageId,
    category: params.category,
    description: params.description,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  store.reports.push(report);
  writeDataStore(store);
  return report;
}
