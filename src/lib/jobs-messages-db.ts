import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "./supabase-admin";
import { readJobsDB } from "./jobs-db";

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
  client_msg_id?: string;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  error?: string;
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

// In-memory fallback uniquement pour les environnements de test / local sans Supabase
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

declare global {
  // eslint-disable-next-line no-var
  var __jobsMemoryStore: JobsDataStore | undefined;
}

function getMemoryStore(): JobsDataStore {
  if (!global.__jobsMemoryStore) {
    global.__jobsMemoryStore = {
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
  return global.__jobsMemoryStore;
}

/**
 * Vérifie si un utilisateur possède un abonnement Jobs actif.
 * Vérifie dans Supabase (jobs_subscriptions) puis dans le store en mémoire.
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

  // 2. In-memory check
  const memStore = getMemoryStore();
  const localSub = memStore.subscriptions[userId];
  if (localSub && localSub.active) {
    if (!localSub.endsAt || new Date(localSub.endsAt).getTime() > Date.now()) {
      return localSub;
    }
  }

  // 3. Si l'utilisateur a créé une offre d'emploi ou a un profil candidat actif dans jobs-db
  try {
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
      memStore.subscriptions[userId] = fallbackStatus;
      return fallbackStatus;
    }
  } catch {}

  return {
    active: false,
    reason: "Aucun abonnement Jobs actif trouvé.",
  };
}

/**
 * Active ou met à jour manuellement un abonnement pour un utilisateur (test/webhook)
 */
export async function setMockJobsSubscription(userId: string, audience: "candidate" | "employer", durationDays = 30) {
  const memStore = getMemoryStore();
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + durationDays * 86400000).toISOString();

  memStore.subscriptions[userId] = {
    active: true,
    audience,
    planCode: audience === "employer" ? "employer_month" : "candidate_month",
    startsAt,
    endsAt,
  };
  return memStore.subscriptions[userId];
}

/**
 * Enrichit une conversation Jobs avec le statut des participants et le dernier message
 */
async function enrichConversation(conv: JobsConversation, currentUserId: string): Promise<JobsConversation> {
  let anyExpired = false;
  let userSelfActive = true;
  let peerActive = true;

  const enrichedParticipants: JobsParticipant[] = [];

  for (const p of conv.participants || []) {
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
  };
}

/**
 * Liste toutes les conversations d'un utilisateur dans l'espace Jobs
 */
export async function listJobsConversations(userId: string): Promise<JobsConversation[]> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      // 1. Récupérer les IDs de conversation où l'utilisateur participe
      const { data: myParticipations, error: partError } = await supabase
        .from("jobs_conversation_participants")
        .select("conversation_id, last_read_at, role, status")
        .eq("user_id", userId)
        .eq("status", "active");

      if (!partError && myParticipations && myParticipations.length > 0) {
        const convIds = myParticipations.map((p) => p.conversation_id);
        const myLastReadMap = new Map(myParticipations.map((p) => [p.conversation_id, p.last_read_at]));

        // 2. Charger les conversations correspondantes
        const { data: convRows, error: convError } = await supabase
          .from("jobs_conversations")
          .select("id, title, type, job_offer_id, job_offer_title, creator_id, status, created_at, updated_at")
          .in("id", convIds)
          .order("updated_at", { ascending: false });

        if (!convError && convRows) {
          // 3. Charger tous les participants de ces conversations
          const { data: allParticipants } = await supabase
            .from("jobs_conversation_participants")
            .select("id, conversation_id, user_id, role, status, last_read_at, joined_at")
            .in("conversation_id", convIds);

          const participantUserIds = Array.from(new Set((allParticipants || []).map((p) => p.user_id)));
          const { data: userProfiles } = participantUserIds.length > 0
            ? await supabase.from("users").select("id, nom, prenom, avatar").in("id", participantUserIds)
            : { data: [] };

          const userProfileMap = new Map((userProfiles || []).map((u) => [
            u.id,
            { name: `${u.prenom || ""} ${u.nom || ""}`.trim() || "Utilisateur Jobs", avatar: u.avatar },
          ]));

          // 4. Charger le dernier message de chaque conversation
          const { data: messagesData } = await supabase
            .from("jobs_messages")
            .select("id, conversation_id, sender_id, sender_name, content, type, created_at")
            .in("conversation_id", convIds)
            .order("created_at", { ascending: true });

          const messagesByConv = new Map<string, any[]>();
          for (const m of messagesData || []) {
            if (!messagesByConv.has(m.conversation_id)) messagesByConv.set(m.conversation_id, []);
            messagesByConv.get(m.conversation_id)!.push(m);
          }

          const result: JobsConversation[] = [];

          for (const conv of convRows) {
            const convParts = (allParticipants || []).filter((p) => p.conversation_id === conv.id).map((p) => {
              const prof = userProfileMap.get(p.user_id);
              return {
                id: p.id,
                conversationId: p.conversation_id,
                userId: p.user_id,
                fullName: prof?.name || "Participant Jobs",
                avatarUrl: prof?.avatar,
                role: p.role,
                isSubscriptionActive: true,
                status: p.status,
                lastReadAt: p.last_read_at,
                joinedAt: p.joined_at,
              } as JobsParticipant;
            });

            const msgs = messagesByConv.get(conv.id) || [];
            const lastMsg = msgs[msgs.length - 1];
            const myLastRead = myLastReadMap.get(conv.id);
            const myLastReadTime = myLastRead ? new Date(myLastRead).getTime() : 0;
            const unreadCount = msgs.filter(
              (m) => m.sender_id !== userId && new Date(m.created_at).getTime() > myLastReadTime
            ).length;

            const structuredConv: JobsConversation = {
              id: conv.id,
              title: conv.title,
              type: conv.type,
              jobOfferId: conv.job_offer_id,
              jobOfferTitle: conv.job_offer_title,
              creatorId: conv.creator_id,
              status: conv.status,
              createdAt: conv.created_at,
              updatedAt: conv.updated_at,
              isReadOnly: false,
              unreadCount,
              participants: convParts,
              lastMessage: lastMsg ? {
                content: lastMsg.content,
                senderId: lastMsg.sender_id,
                senderName: lastMsg.sender_name,
                createdAt: lastMsg.created_at,
                type: lastMsg.type,
              } : undefined,
            };

            result.push(await enrichConversation(structuredConv, userId));
          }

          return result;
        }
      }
    } catch (e) {
      console.warn("[listJobsConversations] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const memStore = getMemoryStore();
  const myParticipants = memStore.participants.filter((p) => p.userId === userId && p.status === "active");
  const convIds = new Set(myParticipants.map((p) => p.conversationId));
  const userConversations = memStore.conversations.filter((c) => convIds.has(c.id));
  const enriched: JobsConversation[] = [];
  for (const c of userConversations) {
    enriched.push(await enrichConversation(c, userId));
  }
  return enriched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Récupère une conversation spécifique
 */
export async function getJobsConversation(conversationId: string, userId: string): Promise<JobsConversation | null> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data: conv, error } = await supabase
        .from("jobs_conversations")
        .select("id, title, type, job_offer_id, job_offer_title, creator_id, status, created_at, updated_at")
        .eq("id", conversationId)
        .maybeSingle();

      if (!error && conv) {
        const { data: participants } = await supabase
          .from("jobs_conversation_participants")
          .select("id, conversation_id, user_id, role, status, last_read_at, joined_at")
          .eq("conversation_id", conversationId);

        const isParticipant = (participants || []).some((p) => p.user_id === userId && p.status === "active");
        if (!isParticipant) return null;

        const participantUserIds = (participants || []).map((p) => p.user_id);
        const { data: userProfiles } = await supabase
          .from("users")
          .select("id, nom, prenom, avatar")
          .in("id", participantUserIds);

        const profileMap = new Map((userProfiles || []).map((u) => [
          u.id,
          { name: `${u.prenom || ""} ${u.nom || ""}`.trim() || "Utilisateur Jobs", avatar: u.avatar },
        ]));

        const convParts: JobsParticipant[] = (participants || []).map((p) => {
          const prof = profileMap.get(p.user_id);
          return {
            id: p.id,
            conversationId: p.conversation_id,
            userId: p.user_id,
            fullName: prof?.name || "Participant Jobs",
            avatarUrl: prof?.avatar,
            role: p.role,
            isSubscriptionActive: true,
            status: p.status,
            lastReadAt: p.last_read_at,
            joinedAt: p.joined_at,
          };
        });

        const structuredConv: JobsConversation = {
          id: conv.id,
          title: conv.title,
          type: conv.type,
          jobOfferId: conv.job_offer_id,
          jobOfferTitle: conv.job_offer_title,
          creatorId: conv.creator_id,
          status: conv.status,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          isReadOnly: false,
          participants: convParts,
        };

        return await enrichConversation(structuredConv, userId);
      }
    } catch (e) {
      console.warn("[getJobsConversation] Fallback in-memory:", e);
    }
  }

  const memStore = getMemoryStore();
  const conv = memStore.conversations.find((c) => c.id === conversationId);
  if (!conv) return null;
  const isParticipant = memStore.participants.some((p) => p.conversationId === conversationId && p.userId === userId);
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
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      // Pour une discussion 1:1, vérifier si elle existe déjà
      if (params.type !== "group") {
        const { data: myConvs } = await supabase
          .from("jobs_conversation_participants")
          .select("conversation_id")
          .eq("user_id", params.creatorId)
          .eq("status", "active");

        if (myConvs && myConvs.length > 0) {
          const convIds = myConvs.map((c) => c.conversation_id);
          const { data: matching } = await supabase
            .from("jobs_conversation_participants")
            .select("conversation_id")
            .in("conversation_id", convIds)
            .eq("user_id", params.targetUserId)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

          if (matching) {
            const existing = await getJobsConversation(matching.conversation_id, params.creatorId);
            if (existing) {
              if (params.initialMessage) {
                await sendJobsMessage({
                  conversationId: existing.id,
                  senderId: params.creatorId,
                  senderName: params.creatorName || "Utilisateur",
                  content: params.initialMessage,
                });
              }
              return existing;
            }
          }
        }
      }

      // Créer la conversation dans Supabase
      const newId = uuidv4();
      const creatorSub = await checkUserJobsSubscription(params.creatorId);
      const targetSub = await checkUserJobsSubscription(params.targetUserId);

      const { data: insertedConv, error: convErr } = await supabase
        .from("jobs_conversations")
        .insert({
          id: newId,
          title: params.title || (params.jobOfferTitle ? `Échange: ${params.jobOfferTitle}` : undefined),
          type: params.type || "direct",
          job_offer_id: params.jobOfferId,
          job_offer_title: params.jobOfferTitle,
          creator_id: params.creatorId,
          status: "active",
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (!convErr && insertedConv) {
        // Insérer les deux participants
        await supabase.from("jobs_conversation_participants").insert([
          {
            id: uuidv4(),
            conversation_id: newId,
            user_id: params.creatorId,
            role: creatorSub.audience === "employer" ? "employer" : "candidate",
            status: "active",
            last_read_at: now,
            joined_at: now,
          },
          {
            id: uuidv4(),
            conversation_id: newId,
            user_id: params.targetUserId,
            role: targetSub.audience === "employer" ? "employer" : "candidate",
            status: "active",
            last_read_at: now,
            joined_at: now,
          },
        ]);

        if (params.initialMessage) {
          await sendJobsMessage({
            conversationId: newId,
            senderId: params.creatorId,
            senderName: params.creatorName || "Utilisateur",
            content: params.initialMessage,
          });
        }

        const created = await getJobsConversation(newId, params.creatorId);
        if (created) return created;
      }
    } catch (e) {
      console.warn("[createJobsConversation] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const memStore = getMemoryStore();
  const convId = uuidv4();
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
    participants: [
      {
        id: uuidv4(),
        conversationId: convId,
        userId: params.creatorId,
        fullName: params.creatorName || "Recruteur / Candidat",
        role: creatorSub.audience === "employer" ? "employer" : "candidate",
        isSubscriptionActive: creatorSub.active,
        status: "active",
        lastReadAt: now,
        joinedAt: now,
      },
      {
        id: uuidv4(),
        conversationId: convId,
        userId: params.targetUserId,
        fullName: params.targetUserName || "Contact Jobs",
        role: targetSub.audience === "employer" ? "employer" : "candidate",
        isSubscriptionActive: targetSub.active,
        status: "active",
        lastReadAt: now,
        joinedAt: now,
      },
    ],
  };

  memStore.conversations.push(newConv);
  memStore.participants.push(...newConv.participants);

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
 * Récupère les messages d'une conversation Jobs
 */
export async function listJobsMessages(conversationId: string, userId: string): Promise<JobsMessage[]> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      // 1. Vérifier participant et mettre à jour last_read_at
      const { data: part, error: partErr } = await supabase
        .from("jobs_conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (!partErr && part) {
        await supabase
          .from("jobs_conversation_participants")
          .update({ last_read_at: now })
          .eq("id", part.id);

        // 2. Charger les messages
        const { data: rows, error: msgErr } = await supabase
          .from("jobs_messages")
          .select("id, conversation_id, sender_id, sender_name, sender_role, sender_avatar, content, type, is_edited, edited_at, is_deleted, deleted_for, reply_to_id, reactions, read_by, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(200);

        if (!msgErr && rows) {
          const msgIds = rows.map((r) => r.id);
          const { data: attachments } = msgIds.length > 0
            ? await supabase.from("jobs_attachments").select("id, message_id, type, url, name, size, duration, mime_type, created_at").in("message_id", msgIds)
            : { data: [] };

          const attMap = new Map<string, JobsAttachment[]>();
          for (const a of attachments || []) {
            if (!attMap.has(a.message_id)) attMap.set(a.message_id, []);
            attMap.get(a.message_id)!.push({
              id: a.id,
              messageId: a.message_id,
              type: a.type,
              url: a.url,
              name: a.name,
              size: Number(a.size || 0),
              duration: a.duration,
              mimeType: a.mime_type,
              createdAt: a.created_at,
            });
          }

          // Filtrer les messages supprimés pour cet utilisateur
          const valid = rows.filter((r) => !((r.deleted_for || []) as string[]).includes(userId));

          return valid.map((r) => {
            const replyOrig = r.reply_to_id ? rows.find((orig) => orig.id === r.reply_to_id) : undefined;
            return {
              id: r.id,
              conversationId: r.conversation_id,
              senderId: r.sender_id,
              senderName: r.sender_name,
              senderRole: r.sender_role,
              senderAvatar: r.sender_avatar,
              content: r.content || "",
              type: r.type,
              isEdited: r.is_edited,
              editedAt: r.edited_at,
              isDeleted: r.is_deleted,
              deletedFor: r.deleted_for || [],
              replyToId: r.reply_to_id,
              replyToMessage: replyOrig ? {
                id: replyOrig.id,
                senderName: replyOrig.sender_name,
                content: replyOrig.is_deleted ? "Ce message a été supprimé" : replyOrig.content,
                type: replyOrig.type,
              } : undefined,
              reactions: r.reactions || {},
              readBy: r.read_by || [],
              createdAt: r.created_at,
              attachments: attMap.get(r.id) || [],
            };
          });
        }
      }
    } catch (e) {
      console.warn("[listJobsMessages] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const memStore = getMemoryStore();
  const isPart = memStore.participants.some((p) => p.conversationId === conversationId && p.userId === userId);
  if (!isPart) throw new Error("Accès refusé : vous n'êtes pas participant.");
  return memStore.messages.filter((m) => m.conversationId === conversationId && !m.deletedFor?.includes(userId));
}

/**
 * Envoie un message dans une conversation Jobs
 * Bloque l'envoi si l'un des abonnements a expiré.
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
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const messageId = uuidv4();

  // Vérifier abonnement Jobs
  const sub = await checkUserJobsSubscription(params.senderId);
  if (!sub.active) {
    throw new Error("Votre abonnement Jobs a expiré. Veuillez activer un pass pour envoyer des messages.");
  }

  if (supabase) {
    try {
      // 1. Vérifier participant et conversation
      const { data: conv } = await supabase
        .from("jobs_conversations")
        .select("id")
        .eq("id", params.conversationId)
        .maybeSingle();

      if (!conv) throw new Error("Conversation Jobs introuvable.");

      const { data: participants } = await supabase
        .from("jobs_conversation_participants")
        .select("id, user_id, role")
        .eq("conversation_id", params.conversationId)
        .eq("status", "active");

      const senderPart = (participants || []).find((p) => p.user_id === params.senderId);
      if (!senderPart) throw new Error("Vous n'êtes pas autorisé à envoyer de message dans cette conversation.");

      // Vérifier les blocages
      const otherUserIds = (participants || []).filter((p) => p.user_id !== params.senderId).map((p) => p.user_id);
      if (otherUserIds.length > 0) {
        const { data: blocks } = await supabase
          .from("jobs_blocks")
          .select("id")
          .or(`and(blocker_id.eq.${params.senderId},blocked_id.in.(${otherUserIds.join(",")})),and(blocked_id.eq.${params.senderId},blocker_id.in.(${otherUserIds.join(",")}))`);

        if (blocks && blocks.length > 0) {
          throw new Error("Échange impossible : un blocage est actif entre les correspondants.");
        }
      }

      // 2. Insérer le message
      const { data: insertedMsg, error: insertErr } = await supabase
        .from("jobs_messages")
        .insert({
          id: messageId,
          conversation_id: params.conversationId,
          sender_id: params.senderId,
          sender_name: params.senderName,
          sender_role: params.senderRole || senderPart.role || "candidate",
          sender_avatar: params.senderAvatar,
          content: params.content,
          type: params.type || "text",
          reply_to_id: params.replyToId,
          reactions: {},
          read_by: [params.senderId],
          created_at: now,
        })
        .select()
        .single();

      if (!insertErr && insertedMsg) {
        // 3. Insérer les pièces jointes éventuelles
        const formattedAttachments: JobsAttachment[] = [];
        if (params.attachments && params.attachments.length > 0) {
          const toInsert = params.attachments.map((att) => ({
            id: uuidv4(),
            message_id: messageId,
            type: att.type,
            url: att.url,
            name: att.name,
            size: att.size || 0,
            duration: att.duration,
            mime_type: att.mimeType,
            created_at: now,
          }));

          await supabase.from("jobs_attachments").insert(toInsert);
          formattedAttachments.push(...toInsert.map((a) => ({
            id: a.id,
            messageId: a.message_id,
            type: a.type as any,
            url: a.url,
            name: a.name,
            size: a.size,
            duration: a.duration,
            mimeType: a.mime_type,
            createdAt: a.created_at,
          })));
        }

        // 4. Mettre à jour l'horodatage de la conversation
        await supabase
          .from("jobs_conversations")
          .update({ updated_at: now })
          .eq("id", params.conversationId);

        return {
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
          attachments: formattedAttachments,
        };
      }
    } catch (e: any) {
      if (e?.message?.includes("abonnement") || e?.message?.includes("blocage")) throw e;
      console.warn("[sendJobsMessage] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const memStore = getMemoryStore();
  const newMsg: JobsMessage = {
    id: messageId,
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderRole: params.senderRole || "candidate",
    senderAvatar: params.senderAvatar,
    content: params.content,
    type: params.type || "text",
    replyToId: params.replyToId,
    reactions: {},
    readBy: [params.senderId],
    createdAt: now,
    attachments: (params.attachments || []).map((a) => ({
      ...a,
      id: uuidv4(),
      messageId,
      createdAt: now,
    })),
  };
  memStore.messages.push(newMsg);
  return newMsg;
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
  const supabase = getSupabaseAdmin();
  const now = Date.now();

  if (supabase) {
    try {
      const { data: msg } = await supabase
        .from("jobs_messages")
        .select("*")
        .eq("id", params.messageId)
        .maybeSingle();

      if (msg) {
        const isAuthor = msg.sender_id === params.userId;
        const messageTime = new Date(msg.created_at).getTime();
        const isWithin15Min = now - messageTime <= 15 * 60 * 1000;

        if (params.action === "react") {
          if (!params.emoji) throw new Error("Emoji manquant.");
          const reactions = msg.reactions || {};
          const users = reactions[params.emoji] || [];
          if (users.includes(params.userId)) {
            reactions[params.emoji] = users.filter((u: string) => u !== params.userId);
            if (reactions[params.emoji].length === 0) delete reactions[params.emoji];
          } else {
            reactions[params.emoji] = [...users, params.userId];
          }
          await supabase.from("jobs_messages").update({ reactions }).eq("id", params.messageId);
          msg.reactions = reactions;
        } else if (params.action === "edit") {
          if (!isAuthor) throw new Error("Seul l'auteur peut modifier ce message.");
          if (!isWithin15Min) throw new Error("La modification n'est permise que dans les 15 minutes.");
          if (!params.newContent?.trim()) throw new Error("Contenu vide.");
          await supabase.from("jobs_messages").update({
            content: params.newContent.trim(),
            is_edited: true,
            edited_at: new Date().toISOString(),
          }).eq("id", params.messageId);
          msg.content = params.newContent.trim();
          msg.is_edited = true;
        } else if (params.action === "delete_for_all") {
          if (!isAuthor) throw new Error("Seul l'auteur peut supprimer pour tous.");
          if (!isWithin15Min) throw new Error("La suppression pour tous n'est permise que dans les 15 minutes.");
          await supabase.from("jobs_messages").update({
            is_deleted: true,
            content: "Ce message a été supprimé",
          }).eq("id", params.messageId);
          msg.is_deleted = true;
          msg.content = "Ce message a été supprimé";
        } else if (params.action === "delete_for_me") {
          const deletedFor = msg.deleted_for || [];
          if (!deletedFor.includes(params.userId)) deletedFor.push(params.userId);
          await supabase.from("jobs_messages").update({ deleted_for: deletedFor }).eq("id", params.messageId);
          msg.deleted_for = deletedFor;
        }

        return {
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderRole: msg.sender_role,
          senderAvatar: msg.sender_avatar,
          content: msg.content,
          type: msg.type,
          isEdited: msg.is_edited,
          editedAt: msg.edited_at,
          isDeleted: msg.is_deleted,
          deletedFor: msg.deleted_for || [],
          replyToId: msg.reply_to_id,
          reactions: msg.reactions || {},
          readBy: msg.read_by || [],
          createdAt: msg.created_at,
          attachments: [],
        };
      }
    } catch (e: any) {
      if (e?.message) throw e;
    }
  }

  // In-memory fallback
  const memStore = getMemoryStore();
  const m = memStore.messages.find((item) => item.id === params.messageId);
  if (!m) throw new Error("Message introuvable.");
  return m;
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
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      if (params.action === "poll") {
        const { data: myConvs } = await supabase
          .from("jobs_conversation_participants")
          .select("conversation_id")
          .eq("user_id", params.userId)
          .eq("status", "active");

        const convIds = (myConvs || []).map((c) => c.conversation_id);
        if (convIds.length === 0) return { activeCalls: [] };

        const { data: calls } = await supabase
          .from("jobs_calls")
          .select("*")
          .in("conversation_id", convIds)
          .in("status", ["initiated", "ringing", "connected"])
          .order("created_at", { ascending: false });

        return {
          activeCalls: (calls || []).map((c) => ({
            id: c.id,
            conversationId: c.conversation_id,
            initiatorId: c.initiator_id,
            initiatorName: c.initiator_name,
            callType: c.call_type,
            isGroup: c.is_group,
            status: c.status,
            participants: c.participants || [],
            durationSeconds: c.duration_seconds || 0,
            createdAt: c.created_at,
            endedAt: c.ended_at,
          })),
        };
      }

      if (params.action === "initiate") {
        if (!params.conversationId) throw new Error("Conversation ID requis.");
        const callId = uuidv4();

        const { data: newCall, error } = await supabase
          .from("jobs_calls")
          .insert({
            id: callId,
            conversation_id: params.conversationId,
            initiator_id: params.userId,
            initiator_name: params.userName || "Utilisateur Jobs",
            call_type: params.callType || "audio",
            is_group: Boolean(params.isGroup),
            status: "ringing",
            participants: [params.userId],
            duration_seconds: 0,
            created_at: now,
          })
          .select()
          .single();

        if (!error && newCall) {
          return {
            id: newCall.id,
            conversationId: newCall.conversation_id,
            initiatorId: newCall.initiator_id,
            initiatorName: newCall.initiator_name,
            callType: newCall.call_type,
            isGroup: newCall.is_group,
            status: newCall.status,
            participants: newCall.participants || [],
            durationSeconds: 0,
            createdAt: newCall.created_at,
          };
        }
      }

      if (params.action === "answer" || params.action === "signal") {
        if (!params.callId) throw new Error("Call ID requis.");
        await supabase
          .from("jobs_calls")
          .update({ status: "connected" })
          .eq("id", params.callId);

        return {
          id: params.callId,
          conversationId: params.conversationId || "",
          initiatorId: params.userId,
          initiatorName: params.userName || "",
          callType: params.callType || "audio",
          isGroup: Boolean(params.isGroup),
          status: "connected",
          participants: [params.userId],
          durationSeconds: 0,
          createdAt: now,
        };
      }

      if (params.action === "end") {
        if (!params.callId) throw new Error("Call ID requis.");
        await supabase
          .from("jobs_calls")
          .update({ status: "ended", ended_at: now })
          .eq("id", params.callId);

        return {
          id: params.callId,
          conversationId: params.conversationId || "",
          initiatorId: params.userId,
          initiatorName: params.userName || "",
          callType: params.callType || "audio",
          isGroup: false,
          status: "ended",
          participants: [],
          durationSeconds: 1,
          createdAt: now,
          endedAt: now,
        };
      }
    } catch (e: any) {
      console.warn("[handleJobsCall] Fallback in-memory:", e);
    }
  }

  // Fallback in-memory
  const memStore = getMemoryStore();
  if (params.action === "poll") return { activeCalls: memStore.calls.filter((c) => c.status !== "ended") };
  const dummyCall: JobsCallSession = {
    id: params.callId || uuidv4(),
    conversationId: params.conversationId || "",
    initiatorId: params.userId,
    initiatorName: params.userName || "Contact Jobs",
    callType: params.callType || "audio",
    isGroup: false,
    status: params.action === "end" ? "ended" : "connected",
    participants: [params.userId],
    durationSeconds: 0,
    createdAt: now,
  };
  return dummyCall;
}

/**
 * Blocages utilisateurs dans Jobs
 */
export async function toggleJobsBlock(blockerId: string, blockedId: string, reason?: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("jobs_blocks")
        .select("id")
        .eq("blocker_id", blockerId)
        .eq("blocked_id", blockedId)
        .maybeSingle();

      if (existing) {
        await supabase.from("jobs_blocks").delete().eq("id", existing.id);
        return { blocked: false };
      } else {
        await supabase.from("jobs_blocks").insert({
          id: uuidv4(),
          blocker_id: blockerId,
          blocked_id: blockedId,
          reason,
          created_at: new Date().toISOString(),
        });
        return { blocked: true };
      }
    } catch (e) {
      console.warn("[toggleJobsBlock] Fallback in-memory:", e);
    }
  }

  const memStore = getMemoryStore();
  const idx = memStore.blocks.findIndex((b) => b.blockerId === blockerId && b.blockedId === blockedId);
  if (idx >= 0) {
    memStore.blocks.splice(idx, 1);
    return { blocked: false };
  }
  memStore.blocks.push({ id: uuidv4(), blockerId, blockedId, reason, createdAt: new Date().toISOString() });
  return { blocked: true };
}

/**
 * Signalements d'incidents Jobs
 */
export async function reportJobsIncident(params: {
  reporterId: string;
  conversationId: string;
  reportedUserId?: string;
  reportedMessageId?: string;
  category: "spam" | "scam" | "harassment" | "fake_job" | "inappropriate" | "other";
  description: string;
}) {
  const supabase = getSupabaseAdmin();
  const reportId = uuidv4();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      await supabase.from("jobs_reports").insert({
        id: reportId,
        conversation_id: params.conversationId,
        reporter_id: params.reporterId,
        reported_user_id: params.reportedUserId,
        reported_message_id: params.reportedMessageId,
        category: params.category,
        description: params.description,
        status: "pending",
        created_at: now,
      });
    } catch (e) {
      console.warn("[reportJobsIncident] Fallback in-memory:", e);
    }
  }

  const report: JobsReport = {
    id: reportId,
    reporterId: params.reporterId,
    conversationId: params.conversationId,
    reportedUserId: params.reportedUserId,
    reportedMessageId: params.reportedMessageId,
    category: params.category,
    description: params.description,
    status: "pending",
    createdAt: now,
  };
  getMemoryStore().reports.push(report);
  return report;
}
