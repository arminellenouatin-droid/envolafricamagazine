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

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "Envol Africa Magazine";
  const options = {
    body: notification.body || data.body || "Un nouvel article est disponible sur Envol Africa.",
    icon: notification.icon || data.icon || "/mobile-header-logo.png",
    badge: "/mobile-header-logo.png",
    image: notification.image || data.image || undefined,
    tag: data.tag || "envol-africa-article",
    data: {
      href: data.href || data.link || "/",
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
