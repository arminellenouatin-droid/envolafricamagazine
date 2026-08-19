import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendPushToUser } from "@/lib/push";

type NotificationInput = {
  userId: string;
  platform: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  entityType?: string;
  entityId?: string;
  dedupeKey?: string;
};

export type UnifiedNotification = {
  id: string;
  platform: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatar?: string | null;
};

type UnifiedMessage = {
  id: string;
  platform: string;
  threadId: string | null;
  senderId: string | null;
  recipientId: string;
  body: string;
  subject: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  senderName?: string | null;
  senderAvatar?: string | null;
};

export async function createGlobalNotification(input: NotificationInput) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, created: false };
  const row = {
    profile_id: input.userId,
    platform: input.platform,
    type: input.type,
    title: input.title.slice(0, 180),
    body: input.body.slice(0, 500),
    link: input.link ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    dedupe_key: input.dedupeKey ?? null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("notifications").upsert(row, { onConflict: "dedupe_key", ignoreDuplicates: Boolean(input.dedupeKey) }).select("id").maybeSingle();
  if (error) return { configured: true as const, created: false, error };
  if (data?.id) {
    await sendPushToUser(input.userId, { title: input.title, body: input.body, href: input.link, tag: input.dedupeKey || `${input.platform}-${input.type}` });
  }
  return { configured: true as const, created: Boolean(data?.id), id: data?.id ?? null };
}

function mapNotification(item: { id: string; platform?: string | null; type: string | null; title: string | null; body: string | null; link?: string | null; href?: string | null; read_at: string | null; created_at: string | null; actor_id?: string | null; actor_name?: string | null; actor_avatar?: string | null }, fallbackPlatform: string): UnifiedNotification {
  return {
    id: item.id,
    platform: item.platform || fallbackPlatform,
    type: item.type || "system",
    title: item.title || "Envol Africa",
    body: item.body || "Vous avez une nouvelle notification.",
    link: item.link ?? item.href ?? null,
    readAt: item.read_at,
    createdAt: item.created_at || new Date(0).toISOString(),
    actorId: item.actor_id ?? null,
    actorName: item.actor_name ?? null,
    actorAvatar: item.actor_avatar ?? null,
  };
}

export async function notifyPushSubscribers(input: Omit<NotificationInput, "userId"> & { dedupePrefix: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, count: 0 };
  const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("profile_id").not("profile_id", "is", null).limit(5000);
  if (error) return { configured: true as const, count: 0, error };
  const userIds = Array.from(new Set((subscriptions ?? []).map((item) => item.profile_id).filter((id): id is string => typeof id === "string")));
  const results = await Promise.all(userIds.map((userId) => createGlobalNotification({ ...input, userId, dedupeKey: `${input.dedupePrefix}:${userId}` })));
  return { configured: true as const, count: results.filter((result) => result.created).length };
}

export async function getUnifiedNotifications(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, notifications: [] as UnifiedNotification[], unreadCount: 0 };
  const [globalResult, wabResult, jobsResult, awardsResult] = await Promise.all([
    supabase.from("notifications").select("id,platform,type,title,body,link,entity_type,entity_id,read_at,created_at").eq("profile_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("wab_notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("jobs_notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabase.from("awards_notifications").select("id,type,title,body,link,read_at,created_at").eq("profile_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  const notificationMessageIds = (globalResult.data ?? []).filter((item) => item.entity_type === "wab_message" && typeof item.entity_id === "string").map((item) => item.entity_id as string);
  const notificationMessages = notificationMessageIds.length ? await supabase.from("wab_messages").select("id,sender_id").in("id", notificationMessageIds) : { data: [] as Array<{ id: string; sender_id: string | null }> };
  const notificationSenderIds = Array.from(new Set((notificationMessages.data ?? []).map((item) => item.sender_id).filter((id): id is string => typeof id === "string")));
  const notificationProfiles = notificationSenderIds.length ? await supabase.from("users").select("id,nom,prenom,avatar").in("id", notificationSenderIds) : { data: [] as Array<{ id: string; nom?: string | null; prenom?: string | null; avatar?: string | null }> };
  const notificationSenderByMessage = new Map((notificationMessages.data ?? []).map((item) => [item.id, item.sender_id]));
  const notificationProfileById = new Map((notificationProfiles.data ?? []).map((profile) => [profile.id, { name: `${profile.prenom || ""} ${profile.nom || ""}`.trim() || null, avatar: profile.avatar || null }]));
  const notifications = [
    ...(globalResult.data ?? []).map((item) => { const senderId = typeof item.entity_id === "string" ? notificationSenderByMessage.get(item.entity_id) : null; const profile = senderId ? notificationProfileById.get(senderId) : undefined; return mapNotification({ ...item, actor_id: senderId, actor_name: profile?.name, actor_avatar: profile?.avatar }, "system"); }),
    ...(wabResult.data ?? []).map((item) => mapNotification(item, "wab")),
    ...(jobsResult.data ?? []).map((item) => mapNotification(item, "jobs")),
    ...(awardsResult.data ?? []).map((item) => mapNotification(item, "awards")),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 150);
  return { configured: true as const, notifications, unreadCount: notifications.filter((item) => !item.readAt).length, errors: [globalResult.error, wabResult.error, jobsResult.error, awardsResult.error].filter(Boolean).length };
}

export async function getUnifiedMessages(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, messages: [] as UnifiedMessage[], unreadCount: 0 };
  const [ecosystemResult, wabConversationsResult, marketplaceConversationsResult] = await Promise.all([
    supabase.from("ecosystem_messages").select("id,platform,thread_id,sender_id,recipient_id,subject,body,href,read_at,created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(100),
    supabase.from("wab_conversations").select("id,participant_a,participant_b").or(`participant_a.eq.${userId},participant_b.eq.${userId}`).limit(50),
    supabase.from("marketplace_conversations").select("id,buyer_id,supplier_id").or(`buyer_id.eq.${userId},supplier_id.eq.${userId}`).limit(50),
  ]);
  const wabIds = (wabConversationsResult.data ?? []).map((item) => item.id);
  const marketplaceIds = (marketplaceConversationsResult.data ?? []).map((item) => item.id);
  const [wabMessagesResult, marketplaceMessagesResult] = await Promise.all([
    wabIds.length ? supabase.from("wab_messages").select("id,conversation_id,sender_id,body,read_at,created_at").in("conversation_id", wabIds).neq("sender_id", userId).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    marketplaceIds.length ? supabase.from("marketplace_messages").select("id,conversation_id,sender_id,body,read_at,created_at").in("conversation_id", marketplaceIds).neq("sender_id", userId).eq("moderation_status", "approved").order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
  ]);
  const senderIds = Array.from(new Set([...(ecosystemResult.data ?? []).map((item) => item.sender_id), ...(wabMessagesResult.data ?? []).map((item) => item.sender_id), ...(marketplaceMessagesResult.data ?? []).map((item) => item.sender_id)].filter((id): id is string => typeof id === "string")));
  const senderProfiles = senderIds.length ? await supabase.from("users").select("id,nom,prenom,avatar").in("id", senderIds) : { data: [] as Array<{ id: string; nom?: string | null; prenom?: string | null; avatar?: string | null }> };
  const profileById = new Map((senderProfiles.data ?? []).map((profile) => [profile.id, { name: `${profile.prenom || ""} ${profile.nom || ""}`.trim() || null, avatar: profile.avatar || null }]));
  const messages: UnifiedMessage[] = [
    ...(ecosystemResult.data ?? []).map((item) => ({ id: item.id, platform: item.platform, threadId: item.thread_id, senderId: item.sender_id, recipientId: item.recipient_id, subject: item.subject, body: item.body, href: item.href, readAt: item.read_at, createdAt: item.created_at, senderName: profileById.get(item.sender_id || "")?.name, senderAvatar: profileById.get(item.sender_id || "")?.avatar })),
    ...(wabMessagesResult.data ?? []).map((item) => ({ id: item.id, platform: "wab", threadId: item.conversation_id, senderId: item.sender_id, recipientId: userId, subject: null, body: item.body, href: `/wab/messages?conversationId=${encodeURIComponent(item.conversation_id)}`, readAt: item.read_at, createdAt: item.created_at, senderName: profileById.get(item.sender_id || "")?.name, senderAvatar: profileById.get(item.sender_id || "")?.avatar })),
    ...(marketplaceMessagesResult.data ?? []).map((item) => ({ id: item.id, platform: "marketplace", threadId: item.conversation_id, senderId: item.sender_id, recipientId: userId, subject: null, body: item.body, href: "/marketplace/messages", readAt: item.read_at, createdAt: item.created_at, senderName: profileById.get(item.sender_id || "")?.name, senderAvatar: profileById.get(item.sender_id || "")?.avatar })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 150);
  return { configured: true as const, messages, unreadCount: messages.filter((item) => !item.readAt).length, errors: [ecosystemResult.error, wabConversationsResult.error, marketplaceConversationsResult.error, wabMessagesResult.error, marketplaceMessagesResult.error].filter(Boolean).length };
}

export async function markUnifiedNotificationsRead(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const results = await Promise.all([
    supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", userId).is("read_at", null),
    supabase.from("wab_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null),
    supabase.from("jobs_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null),
    supabase.from("awards_notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", userId).is("read_at", null),
  ]);
  return !results.some((result) => result.error);
}

export async function markUnifiedMessagesRead(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const [wabConversations, marketplaceConversations] = await Promise.all([
    supabase.from("wab_conversations").select("id").or(`participant_a.eq.${userId},participant_b.eq.${userId}`).limit(50),
    supabase.from("marketplace_conversations").select("id").or(`buyer_id.eq.${userId},supplier_id.eq.${userId}`).limit(50),
  ]);
  const wabIds = (wabConversations.data ?? []).map((item) => item.id);
  const marketplaceIds = (marketplaceConversations.data ?? []).map((item) => item.id);
  const updates = [supabase.from("ecosystem_messages").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null)];
  if (wabIds.length) updates.push(supabase.from("wab_messages").update({ read_at: new Date().toISOString() }).in("conversation_id", wabIds).neq("sender_id", userId).is("read_at", null));
  if (marketplaceIds.length) updates.push(supabase.from("marketplace_messages").update({ read_at: new Date().toISOString() }).in("conversation_id", marketplaceIds).neq("sender_id", userId).is("read_at", null));
  const results = await Promise.all(updates);
  return !results.some((result) => result.error);
}
