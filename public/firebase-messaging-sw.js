self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedHref = event.notification.data && event.notification.data.href
    ? event.notification.data.href
    : "/notifications";
  const targetUrl = new URL(requestedHref, self.location.origin);
  if (targetUrl.origin !== self.location.origin) targetUrl.href = new URL("/notifications", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find((client) => "focus" in client && new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        return existing.navigate(targetUrl.href);
      }
      return clients.openWindow(targetUrl.href);
    }),
  );
});

importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD023bnEtT_jF75sPQoGSCaSBRjWJpObUE",
  authDomain: "envolafrica-8d361.firebaseapp.com",
  projectId: "envolafrica-8d361",
  storageBucket: "envolafrica-8d361.firebasestorage.app",
  messagingSenderId: "121742686844",
  appId: "1:121742686844:web:2007007104e6b25833a7f9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "Envol Africa";
  const options = {
    body: notification.body || data.body || "Une nouvelle activité est disponible.",
    icon: "/mobile-header-logo.png",
    badge: "/mobile-header-logo.png",
    image: notification.image || data.image || undefined,
    tag: data.tag || "envol-africa",
    data: { href: data.href || "/notifications" },
  };

  return self.registration.showNotification(title, options);
});
