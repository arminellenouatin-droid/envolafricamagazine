import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type PushSubscriptionRow = { endpoint: string; keys: { p256dh: string; auth: string } };

function getVapidConfig() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; href?: string; tag?: string }) {
  const vapid = getVapidConfig();
  const supabase = getSupabaseAdmin();
  if (!vapid || !supabase) return { sent: 0, skipped: true };
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  const { data, error } = await supabase.from("push_subscriptions").select("endpoint,keys").eq("profile_id", userId).limit(50);
  if (error || !data?.length) return { sent: 0, skipped: Boolean(error) };

  let sent = 0;
  for (const row of data as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification({ endpoint: row.endpoint, keys: row.keys }, JSON.stringify(payload));
      sent += 1;
    } catch (error: unknown) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
    }
  }
  return { sent, skipped: false };
}
