/* eslint-disable no-undef */
// Service Worker pour Firebase Cloud Messaging (Envol Africa)

importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyD023bnEtT_jF75sPQoGSCaSBRjWJpObUE",
  authDomain: "envolafrica-8d361.firebaseapp.com",
  projectId: "envolafrica-8d361",
  storageBucket: "envolafrica-8d361.firebasestorage.app",
  messagingSenderId: "121742686844",
  appId: "1:121742686844:web:2007007104e6b25833a7f9",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

function toAbsoluteUrl(url) {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  try {
    return new URL(url, self.location.origin).href;
  } catch (e) {
    return url;
  }
}

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = notification.title || data.title || "ENVOL AFRICA";
  const body = notification.body || data.body || "Nouvelle publication disponible sur Envol Africa.";

  // Image principale du média (article, magazine, etc.)
  const mediaImage = toAbsoluteUrl(notification.image || notification.imageUrl || data.image || data.imageUrl);
  const defaultLogo = toAbsoluteUrl("/mobile-header-logo.png");

  // Remplacement de l'icône réduite (favicon) par l'image de la publication
  const iconUrl = mediaImage || toAbsoluteUrl(notification.icon || data.icon) || defaultLogo;
  const badgeUrl = toAbsoluteUrl(notification.badge || data.badge) || defaultLogo;
  const targetHref = data.href || data.link || "/";

  const options = {
    body,
    icon: iconUrl,
    badge: badgeUrl,
    image: mediaImage,
    tag: data.tag || "envol-africa-article",
    requireInteraction: true,
    data: {
      href: targetHref,
      link: targetHref,
      image: mediaImage,
    },
  };

  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedHref = event.notification.data && event.notification.data.href
    ? event.notification.data.href
    : "/";
  const targetUrl = new URL(requestedHref, self.location.origin);
  if (targetUrl.origin !== self.location.origin) {
    targetUrl.href = new URL("/", self.location.origin).href;
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find((client) => "focus" in client && new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        return existing.navigate(targetUrl.href);
      }
      return clients.openWindow(targetUrl.href);
    })
  );
});
