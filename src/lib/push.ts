import webpush from "web-push";
import { getFirebaseAdminMessaging, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type PushPayload = {
  title: string;
  body: string;
  href?: string;
  tag?: string;
  image?: string;
};

type PushSubscriptionRow = {
  id?: string;
  endpoint: string | null;
  keys: { p256dh?: string; auth?: string } | null;
  fcm_fid: string | null;
  profile_id?: string | null;
};

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

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

function isInvalidFirebaseRegistration(code?: string) {
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token" ||
    code === "messaging/invalid-argument"
  );
}

export function toAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    // Forcer le domaine officiel canonique et éliminer tout lien vers les domaines secondaires ou obsolètes
    return url
      .replace(/https?:\/\/envolafricamagazinealokpe\.vercel\.app/g, "https://envolafrica.site")
      .replace(/https?:\/\/envolafrica\.vercel\.app/g, "https://envolafrica.site");
  }
  const baseUrl = "https://envolafrica.site";
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
}

/**
 * Envoie une notification Chrome / Web Push à TOUS les abonnés ayant accepté les notifications
 * lors de la publication d'un article ou d'un événement global.
 */
export async function sendPushToAllSubscribers(payload: PushPayload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { sent: 0, total: 0, skipped: true };

  const messaging = getFirebaseAdminMessaging();
  let fcmSent = 0;

  // 1. Récupération de tous les abonnements FCM (visiteurs + connectés) ordonnés par fraîcheur
  const { data: fcmSubs, error: fcmError } = await supabase
    .from("push_subscriptions")
    .select("fcm_fid, profile_id, updated_at")
    .not("fcm_fid", "is", null)
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (fcmError) {
    console.error("[push] Erreur lecture push_subscriptions :", fcmError.message);
  }

  // Dédoublonnage : si un profil est présent plusieurs fois (ex: suite à la navigation sur plusieurs domaines),
  // on ne conserve que son token le plus récent pour éviter les réceptions multiples.
  const seenProfiles = new Set<string>();
  const tokensList: string[] = [];

  for (const s of fcmSubs || []) {
    if (!s.fcm_fid) continue;
    if (s.profile_id) {
      if (seenProfiles.has(s.profile_id)) continue;
      seenProfiles.add(s.profile_id);
    }
    tokensList.push(s.fcm_fid);
  }

  const tokens = Array.from(new Set(tokensList));

  const absoluteImage = toAbsoluteUrl(payload.image);
  const absoluteLogo = toAbsoluteUrl("/mobile-header-logo.png");
  // L'icône réduite demandée : l'image de la publication si disponible, sinon le logo du site
  const notificationIcon = absoluteImage || absoluteLogo;
  const targetHref = toAbsoluteUrl(payload.href) || "https://envolafrica.site";

  if (messaging && tokens.length > 0) {
    for (const batch of chunks(tokens, 500)) {
      try {
        const response = await messaging.sendEachForMulticast({
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: absoluteImage,
          },
          data: {
            title: String(payload.title || "Envol Africa"),
            body: String(payload.body || ""),
            href: String(targetHref),
            link: String(targetHref),
            image: String(absoluteImage || ""),
            imageUrl: String(absoluteImage || ""),
            icon: String(notificationIcon || ""),
            badge: String(absoluteLogo || ""),
            tag: String(payload.tag || "envol-africa"),
          },
          webpush: {
            headers: {
              Urgency: "high",
            },
            notification: {
              title: payload.title,
              body: payload.body,
              icon: notificationIcon,
              image: absoluteImage,
              badge: absoluteLogo,
              tag: payload.tag || "envol-africa",
              requireInteraction: true,
            },
            fcmOptions: {
              link: targetHref,
            },
          },
        });

        fcmSent += response.successCount;

        // Nettoyage automatique des tokens expirés ou invalidés par les utilisateurs
        const invalidTokens = response.responses.flatMap((res, idx) =>
          !res.success && isInvalidFirebaseRegistration(res.error?.code) ? [batch[idx]] : []
        );

        if (invalidTokens.length > 0) {
          await supabase.from("push_subscriptions").delete().in("fcm_fid", invalidTokens);
        }
      } catch (err) {
        console.error("[push] Erreur envoi multicast FCM :", err);
      }
    }
  }

  // 2. Envoi aux abonnés Web Push classiques (fallback)
  let legacySent = 0;
  const vapid = getVapidConfig();
  if (vapid) {
    const { data: legacySubs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, keys")
      .is("fcm_fid", null)
      .not("endpoint", "is", null)
      .limit(1000);

    if (legacySubs?.length) {
      webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
      const legacyPayload = {
        title: payload.title,
        body: payload.body,
        href: targetHref,
        link: targetHref,
        image: absoluteImage,
        icon: notificationIcon,
        badge: absoluteLogo,
        tag: payload.tag || "envol-africa",
      };
      for (const row of legacySubs as PushSubscriptionRow[]) {
        if (!row.endpoint || !row.keys?.p256dh || !row.keys.auth) continue;
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.keys.p256dh, auth: row.keys.auth } },
            JSON.stringify(legacyPayload)
          );
          legacySent += 1;
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
          }
        }
      }
    }
  }

  return {
    sent: fcmSent + legacySent,
    total: tokens.length,
    firebaseSent: fcmSent,
    legacySent,
    skipped: !messaging && !vapid,
  };
}

/**
 * Envoie une notification push ciblée à un utilisateur spécifique.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { sent: 0, skipped: true };

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys, fcm_fid")
    .eq("profile_id", userId)
    .limit(100);

  if (error || !data?.length) return { sent: 0, skipped: Boolean(error) };

  const rows = data as PushSubscriptionRow[];
  const messaging = getFirebaseAdminMessaging();
  let sent = 0;

  // Envoi FCM
  const fcmTokens = Array.from(
    new Set(rows.map((r) => r.fcm_fid).filter((t): t is string => Boolean(t)))
  );

  const absoluteImage = toAbsoluteUrl(payload.image);
  const absoluteLogo = toAbsoluteUrl("/mobile-header-logo.png");
  // L'icône réduite demandée : l'image de la publication si disponible, sinon le logo du site
  const notificationIcon = absoluteImage || absoluteLogo;
  const targetHref = payload.href || "/";

  if (messaging && fcmTokens.length > 0) {
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: absoluteImage,
        },
        data: {
          title: String(payload.title || "Envol Africa"),
          body: String(payload.body || ""),
          href: String(targetHref),
          link: String(targetHref),
          image: String(absoluteImage || ""),
          imageUrl: String(absoluteImage || ""),
          icon: String(notificationIcon || ""),
          badge: String(absoluteLogo || ""),
          tag: String(payload.tag || "envol-africa"),
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: notificationIcon,
            image: absoluteImage,
            badge: absoluteLogo,
            tag: payload.tag || "envol-africa",
            requireInteraction: true,
          },
          fcmOptions: {
            link: targetHref,
          },
        },
      });
      sent += response.successCount;
    } catch (err) {
      console.error("[push] Erreur envoi individuel FCM :", err);
    }
  }

  // Envoi Legacy
  const vapid = getVapidConfig();
  if (vapid) {
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    const legacyPayload = {
      title: payload.title,
      body: payload.body,
      href: targetHref,
      link: targetHref,
      image: absoluteImage,
      icon: notificationIcon,
      badge: absoluteLogo,
      tag: payload.tag || "envol-africa",
    };
    for (const row of rows) {
      if (!row.endpoint || !row.keys?.p256dh || !row.keys.auth) continue;
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.keys.p256dh, auth: row.keys.auth } },
          JSON.stringify(legacyPayload)
        );
        sent += 1;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
        }
      }
    }
  }

  return { sent, skipped: !messaging && !vapid };
}
