/**
 * ============================================================================
 * REALTIME CHAT ENGINE — ENVOL AFRICA
 * ============================================================================
 * Moteur temps réel unifié basé sur Supabase Realtime Broadcast & Presence.
 * Permet l'échange instantané (< 50ms) de messages, accusés de lecture,
 * indicateurs de frappe et signalisation d'appels sans surcharge de la base.
 */

import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";

export type ChatPlatform = "wab" | "marketplace" | "jobs" | "crowdfunding";

export const REALTIME_EVENTS = {
  MESSAGE_NEW: "message:new",
  MESSAGE_READ: "message:read",
  MESSAGE_REACTION: "message:reaction",
  MESSAGE_TYPING: "typing",
  INCOMING_CALL: "call:incoming",
  CALL_SIGNAL: "call:signal",
} as const;

export interface RealtimeMessagePayload<T = any> {
  message: T;
  clientId?: string;
  conversationId: string;
  senderId: string;
}

export interface RealtimeTypingPayload {
  senderId: string;
  senderName?: string;
  isTyping: boolean;
}

export interface RealtimeReadPayload {
  conversationId: string;
  readerId: string;
  messageIds?: string[];
  readAt: string;
}

export interface RealtimeReactionPayload {
  messageId: string;
  emoji: string;
  userId: string;
  conversationId: string;
}

/**
 * Génère le nom de canal unique et déterministe par plateforme et conversation
 */
export function getChatChannelName(platform: ChatPlatform, conversationId: string): string {
  if (!conversationId) return `chat_${platform}_lobby`;
  return `${platform}_chat_${conversationId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/**
 * Génère le nom de canal d'écoute d'appels et d'alertes directes pour un utilisateur
 */
export function getUserChannelName(userId: string): string {
  return `user_stream_${userId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/**
 * Abonne un client au canal Realtime d'une conversation avec gestion propre du cycle de vie
 */
export function subscribeToChatChannel(
  supabase: SupabaseClient | null,
  channelName: string,
  handlers: {
    onMessageNew?: (payload: RealtimeMessagePayload) => void;
    onTyping?: (payload: RealtimeTypingPayload) => void;
    onMessageRead?: (payload: RealtimeReadPayload) => void;
    onMessageReaction?: (payload: RealtimeReactionPayload) => void;
    onPresenceChange?: (onlineUserIds: string[]) => void;
  },
  currentUserId?: string
): RealtimeChannel | null {
  if (!supabase || !channelName) return null;

  try {
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: currentUserId ? { key: currentUserId } : undefined,
      },
    });

    if (handlers.onMessageNew) {
      channel.on("broadcast", { event: REALTIME_EVENTS.MESSAGE_NEW }, ({ payload }) => {
        if (payload) handlers.onMessageNew!(payload);
      });
    }

    if (handlers.onTyping) {
      channel.on("broadcast", { event: REALTIME_EVENTS.MESSAGE_TYPING }, ({ payload }) => {
        if (payload) handlers.onTyping!(payload);
      });
    }

    if (handlers.onMessageRead) {
      channel.on("broadcast", { event: REALTIME_EVENTS.MESSAGE_READ }, ({ payload }) => {
        if (payload) handlers.onMessageRead!(payload);
      });
    }

    if (handlers.onMessageReaction) {
      channel.on("broadcast", { event: REALTIME_EVENTS.MESSAGE_REACTION }, ({ payload }) => {
        if (payload) handlers.onMessageReaction!(payload);
      });
    }

    if (handlers.onPresenceChange && currentUserId) {
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const activeIds = Object.keys(state);
        handlers.onPresenceChange!(activeIds);
      });
    }

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && currentUserId) {
        await channel.track({ online_at: new Date().toISOString(), user_id: currentUserId }).catch(() => {});
      }
    });

    return channel;
  } catch (err) {
    console.warn("[RealtimeChat] Subscription error:", err);
    return null;
  }
}

/**
 * Diffuse instantanément un nouveau message aux autres participants du canal
 */
export async function broadcastNewMessage(
  supabase: SupabaseClient | null,
  channelName: string,
  payload: RealtimeMessagePayload
): Promise<boolean> {
  if (!supabase || !channelName) return false;
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: "broadcast",
      event: REALTIME_EVENTS.MESSAGE_NEW,
      payload,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Diffuse un indicateur de frappe
 */
export async function broadcastTypingState(
  supabase: SupabaseClient | null,
  channelName: string,
  payload: RealtimeTypingPayload
): Promise<boolean> {
  if (!supabase || !channelName) return false;
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: "broadcast",
      event: REALTIME_EVENTS.MESSAGE_TYPING,
      payload,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Diffuse un accusé de lecture
 */
export async function broadcastReadReceipt(
  supabase: SupabaseClient | null,
  channelName: string,
  payload: RealtimeReadPayload
): Promise<boolean> {
  if (!supabase || !channelName) return false;
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: "broadcast",
      event: REALTIME_EVENTS.MESSAGE_READ,
      payload,
    });
    return true;
  } catch {
    return false;
  }
}

export const broadcastMessageRead = broadcastReadReceipt;

/**
 * Diffuse une réaction emoji
 */
export async function broadcastReaction(
  supabase: SupabaseClient | null,
  channelName: string,
  payload: RealtimeReactionPayload
): Promise<boolean> {
  if (!supabase || !channelName) return false;
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: "broadcast",
      event: REALTIME_EVENTS.MESSAGE_REACTION,
      payload,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Diffuse un appel entrant directement sur le canal personnel du destinataire
 */
export async function broadcastIncomingCall(
  supabase: SupabaseClient | null,
  recipientId: string,
  call: any
): Promise<boolean> {
  if (!supabase || !recipientId) return false;
  try {
    const channelName = getUserChannelName(recipientId);
    const channel = supabase.channel(channelName);
    await channel.send({
      type: "broadcast",
      event: REALTIME_EVENTS.INCOMING_CALL,
      payload: { call },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Abonne un utilisateur à son canal personnel pour recevoir des alertes instantanées (ex: appels entrants)
 */
export function subscribeToUserChannel(
  supabase: SupabaseClient | null,
  userId: string,
  handlers: {
    onIncomingCall?: (call: any) => void;
  }
): RealtimeChannel | null {
  if (!supabase || !userId) return null;
  try {
    const channelName = getUserChannelName(userId);
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    if (handlers.onIncomingCall) {
      channel.on("broadcast", { event: REALTIME_EVENTS.INCOMING_CALL }, ({ payload }) => {
        if (payload?.call) handlers.onIncomingCall!(payload.call);
      });
    }

    channel.subscribe();
    return channel;
  } catch (err) {
    console.warn("[RealtimeChat] User channel subscription error:", err);
    return null;
  }
}

