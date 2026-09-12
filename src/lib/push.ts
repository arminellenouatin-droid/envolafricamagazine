import webpush from "web-push";
import { getFirebaseAdminMessaging } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { absoluteSiteUrl } from "@/lib/site-metadata";

type PushSubscriptionRow = {
  endpoint: string | null;
  keys: { p256dh?: string; auth?: string } | null;
  fcm_fid: string | null;
};

type PushPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
  image?: string;
};

function getLegacyVapidConfig() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function isInvalidFirebaseRegistration(code?: string) {
  return code === "messaging/registration-token-not-registered"
    || code === "messaging/invalid-registration-token"
    || code === "messaging/invalid-argument";
}

async function sendFirebaseNotifications(rows: PushSubscriptionRow[], payload: PushPayload) {
  const messaging = getFirebaseAdminMessaging();
  const supabase = getSupabaseAdmin();
  if (!messaging || !supabase) return { sent: 0, skipped: true };

  const fids = Array.from(new Set(rows.map((row) => row.fcm_fid).filter((fid): fid is string => Boolean(fid))));
  if (!fids.length) return { sent: 0, skipped: false };

  let sent = 0;
  for (const batch of chunks(fids, 500)) {
    const response = await messaging.sendEachForMulticast({
      fids: batch,
      data: {
        title: payload.title,
        body: payload.body,
        href: payload.href || "/notifications",
        tag: payload.tag || "envol-africa",
        ...(payload.image ? { image: absoluteSiteUrl(payload.image) } : {}),
      },
      webpush: {
        headers: { TTL: "86400", Urgency: "normal" },
        fcmOptions: { link: absoluteSiteUrl(payload.href || "/notifications") },
      },
    });
    sent += response.successCount;

    const invalidFids = response.responses.flatMap((item, index) =>
      !item.success && isInvalidFirebaseRegistration(item.error?.code) ? [batch[index]] : [],
    );
    if (invalidFids.length) await supabase.from("push_subscriptions").delete().in("fcm_fid", invalidFids);
  }
  return { sent, skipped: false };
}

async function sendLegacyWebPush(rows: PushSubscriptionRow[], payload: PushPayload) {
  const vapid = getLegacyVapidConfig();
  const supabase = getSupabaseAdmin();
  if (!vapid || !supabase) return { sent: 0, skipped: true };
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  let sent = 0;
  for (const row of rows) {
    if (!row.endpoint || !row.keys?.p256dh || !row.keys.auth) continue;
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.keys.p256dh, auth: row.keys.auth } },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (error: unknown) {
      const statusCode = typeof error === "object" && error && "statusCode" in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
    }
  }
  return { sent, skipped: false };
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { sent: 0, skipped: true };

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint,keys,fcm_fid")
    .eq("profile_id", userId)
    .limit(100);
  if (error || !data?.length) return { sent: 0, skipped: Boolean(error) };

  const rows = data as PushSubscriptionRow[];
  const [firebase, legacy] = await Promise.all([
    sendFirebaseNotifications(rows, payload).catch((error) => {
      console.error("[push] Firebase delivery failed", error instanceof Error ? error.message : "Unknown provider error");
      return { sent: 0, skipped: true };
    }),
    sendLegacyWebPush(rows, payload).catch((error) => {
      console.error("[push] Legacy Web Push delivery failed", error instanceof Error ? error.message : "Unknown provider error");
      return { sent: 0, skipped: true };
    }),
  ]);
  return { sent: firebase.sent + legacy.sent, skipped: firebase.skipped && legacy.skipped };
}
