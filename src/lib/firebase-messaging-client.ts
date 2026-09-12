"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  onUnregistered,
  register as registerMessaging,
  unregister as unregisterMessaging,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD023bnEtT_jF75sPQoGSCaSBRjWJpObUE",
  authDomain: "envolafrica-8d361.firebaseapp.com",
  projectId: "envolafrica-8d361",
  storageBucket: "envolafrica-8d361.firebasestorage.app",
  messagingSenderId: "121742686844",
  appId: "1:121742686844:web:2007007104e6b25833a7f9",
};

const firebaseVapidKey = "BLCthIe3tBR_JtKlC7KoExakvM8ZiB9L1gL0EAljuJgi6KhrslKwmIQa-sKirJHeTVHq2ff6HEAsH87TpeMfBME";

async function saveFirebaseInstallation(fid: string) {
  const response = await fetch("/api/notifications/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "firebase", fid }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Impossible d’enregistrer cet appareil pour les notifications.");
  }
  localStorage.setItem("eam_firebase_fid", fid);
}

async function removeFirebaseInstallation(fid: string) {
  await fetch("/api/notifications/subscribe", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "firebase", fid }),
  }).catch(() => undefined);
  localStorage.removeItem("eam_firebase_fid");
}

function notificationFromPayload(payload: MessagePayload) {
  const data = payload.data || {};
  return {
    title: payload.notification?.title || data.title || "Envol Africa",
    body: payload.notification?.body || data.body || "Une nouvelle activité est disponible.",
    href: data.href || "/notifications",
    image: payload.notification?.image || data.image || undefined,
    tag: data.tag || "envol-africa",
  };
}

export async function canUseFirebaseMessaging() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "Notification" in window
    && await isSupported().catch(() => false);
}

export async function registerFirebaseMessaging() {
  if (!(await canUseFirebaseMessaging())) throw new Error("Les notifications ne sont pas prises en charge par ce navigateur.");
  if (Notification.permission !== "granted") throw new Error("L’autorisation de notification n’a pas été accordée.");

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  return await new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      unsubscribeRegistered();
      unsubscribeUnregistered();
      callback();
    };
    const unsubscribeRegistered = onRegistered(messaging, (fid) => {
      void saveFirebaseInstallation(fid)
        .then(() => finish(() => resolve(fid)))
        .catch((error) => finish(() => reject(error)));
    });
    const unsubscribeUnregistered = onUnregistered(messaging, (fid) => {
      void removeFirebaseInstallation(fid);
    });
    const timeout = window.setTimeout(() => finish(() => reject(new Error("L’enregistrement Firebase a expiré. Réessayez."))), 20000);

    void registerMessaging(messaging, { vapidKey: firebaseVapidKey, serviceWorkerRegistration })
      .catch((error) => finish(() => reject(error)));
  });
}

export async function listenForForegroundFirebaseMessages(onNotification?: (payload: MessagePayload) => void) {
  if (!(await canUseFirebaseMessaging()) || Notification.permission !== "granted") return () => undefined;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  return onMessage(messaging, async (payload) => {
    onNotification?.(payload);
    const notification = notificationFromPayload(payload);
    const registration = await navigator.serviceWorker.ready;
    const options: NotificationOptions & { image?: string } = {
      body: notification.body,
      icon: "/mobile-header-logo.png",
      badge: "/mobile-header-logo.png",
      image: notification.image,
      tag: notification.tag,
      data: { href: notification.href },
    };
    await registration.showNotification(notification.title, options);
  });
}

export async function unregisterFirebaseMessaging() {
  if (typeof window === "undefined") return;
  const fid = localStorage.getItem("eam_firebase_fid");
  if (fid) await removeFirebaseInstallation(fid);
  if (!(await canUseFirebaseMessaging())) return;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  await unregisterMessaging(getMessaging(app)).catch(() => undefined);
}
