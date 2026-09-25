"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  deleteToken,
  type MessagePayload,
} from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyD023bnEtT_jF75sPQoGSCaSBRjWJpObUE",
  authDomain: "envolafrica-8d361.firebaseapp.com",
  projectId: "envolafrica-8d361",
  storageBucket: "envolafrica-8d361.firebasestorage.app",
  messagingSenderId: "121742686844",
  appId: "1:121742686844:web:2007007104e6b25833a7f9",
};

export const firebaseVapidKey = "BLCthIe3tBR_JtKlC7KoExakvM8ZiB9L1gL0EAljuJgi6KhrslKwmIQa-sKirJHeTVHq2ff6HEAsH87TpeMfBME";

function getClientMessagingApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function canUseFirebaseMessaging(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    return false;
  }
  return await isSupported().catch(() => false);
}

async function saveSubscriptionToken(token: string) {
  const res = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "firebase",
      token,
      fid: token, // compatibilité
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Impossible d'enregistrer le token de notification.");
  }
  localStorage.setItem("eam_fcm_token", token);
}

async function removeSubscriptionToken(token: string) {
  await fetch("/api/notifications/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "firebase",
      token,
      fid: token,
    }),
  }).catch(() => undefined);
  localStorage.removeItem("eam_fcm_token");
}

export async function registerFirebaseMessaging(): Promise<string> {
  const supported = await canUseFirebaseMessaging();
  if (!supported) {
    throw new Error("Les notifications push ne sont pas prises en charge sur ce navigateur.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("L'autorisation de notification a été refusée.");
  }

  const app = getClientMessagingApp();
  const messaging = getMessaging(app);

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  const currentToken = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!currentToken) {
    throw new Error("Impossible d'obtenir un token d'enregistrement Firebase.");
  }

  await saveSubscriptionToken(currentToken);
  return currentToken;
}

export async function unregisterFirebaseMessaging() {
  const token = typeof window !== "undefined" ? localStorage.getItem("eam_fcm_token") : null;
  if (token) {
    await removeSubscriptionToken(token);
  }
  if (await canUseFirebaseMessaging()) {
    try {
      const app = getClientMessagingApp();
      const messaging = getMessaging(app);
      await deleteToken(messaging);
    } catch {
      // Ignorer les erreurs de déconnexion locale
    }
  }
}

function toAbsoluteClientUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).href;
    } catch {
      return url;
    }
  }
  return url;
}

export async function listenForForegroundMessages(callback?: (payload: MessagePayload) => void) {
  if (!(await canUseFirebaseMessaging()) || Notification.permission !== "granted") {
    return () => undefined;
  }
  const app = getClientMessagingApp();
  const messaging = getMessaging(app);

  return onMessage(messaging, async (payload) => {
    callback?.(payload);
    const data = payload.data || {};
    const notification = payload.notification || {};
    const title = notification.title || data.title || "ENVOL AFRICA";
    const body = notification.body || data.body || "Nouvelle notification";
    const href = data.href || data.link || "/";

    const mediaImage = toAbsoluteClientUrl(
      notification.image || (notification as { imageUrl?: string }).imageUrl || data.image || data.imageUrl
    );
    const defaultLogo = toAbsoluteClientUrl("/mobile-header-logo.png");
    const iconUrl = mediaImage || toAbsoluteClientUrl((notification as any).icon || data.icon) || defaultLogo;
    const badgeUrl = toAbsoluteClientUrl((notification as any).badge || data.badge) || defaultLogo;

    // Déclencher le tiroir de notification in-app en haut de l'écran
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("eam_in_app_notification", {
          detail: {
            title,
            body,
            href,
            image: mediaImage,
            icon: iconUrl,
          },
        })
      );
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        body,
        icon: iconUrl,
        badge: badgeUrl,
        image: mediaImage,
        tag: data.tag || "envol-africa-article",
        requireInteraction: true,
        data: { href, link: href, image: mediaImage },
      } as NotificationOptions & { image?: string });
    }
  });
}
