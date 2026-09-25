/* eslint-disable no-undef */
// Service Worker pour Firebase Cloud Messaging (Envol Africa)

const OFFICIAL_LOGO = "https://www.envolafrica.site/logo-reduit.png";
const OFFICIAL_BADGE = "https://www.envolafrica.site/favicon-32x32.png";

// Prise en compte immédiate de cette version sans attendre la fermeture des onglets
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Interception absolue : garantit que TOUT appel à showNotification (y compris interne à Firebase Compat)
// charge TOUJOURS le logo réduit d'Envol Africa en icône miniature (icon) et préserve l'image de l'article en grand (image)
if (typeof ServiceWorkerRegistration !== "undefined" && ServiceWorkerRegistration.prototype.showNotification) {
  const _originalShowNotification = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, options = {}) {
    options = options || {};

    // Forcer l'icône miniature sur le logo officiel réduit
    options.icon = OFFICIAL_LOGO;
    options.badge = OFFICIAL_BADGE;

    // Si une grande image est passée dans options ou dans payload.data, la préserver comme grande photo
    if (options.data && (options.data.image || options.data.imageUrl) && !options.image) {
      options.image = options.data.image || options.data.imageUrl;
    }

    const finalTitle = title || "ENVOL AFRICA";
    return _originalShowNotification.call(this, finalTitle, options);
  };
}

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
    return url
      .replace(/https?:\/\/envolafricamagazinealokpe\.vercel\.app/g, "https://envolafrica.site")
      .replace(/https?:\/\/envolafrica\.vercel\.app/g, "https://envolafrica.site");
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `https://envolafrica.site${cleanPath}`;
}

messaging.onBackgroundMessage((payload) => {
  const hostname = self.location.hostname;
  const isObsoleteDomain = hostname.includes("alokpe") || hostname.includes("envolafricamagazinealokpe");
  const isAllowedHost = hostname === "envolafrica.site" || hostname === "localhost" || hostname === "127.0.0.1";

  // Si la notification arrive sur l'ancien domaine ou un miroir secondaire non-autorisé :
  if (isObsoleteDomain || !isAllowedHost) {
    // 1. Se désinscrire auprès du PushManager
    if (self.registration && self.registration.pushManager) {
      self.registration.pushManager.getSubscription().then((sub) => {
        if (sub) sub.unsubscribe().catch(() => {});
      }).catch(() => {});
    }
    // 2. Désinstaller le Service Worker de ce domaine
    if (self.registration && self.registration.unregister) {
      self.registration.unregister().catch(() => {});
    }
    // 3. Annuler l'affichage de la notification
    return;
  }

  const data = payload.data || {};
  const notification = payload.notification || {};
  const title = notification.title || data.title || "ENVOL AFRICA";
  const body = notification.body || data.body || "Nouvelle publication disponible sur Envol Africa.";

  // Grande image : la photo de l'article ou publication
  const mediaImage = toAbsoluteUrl(notification.image || notification.imageUrl || data.image || data.imageUrl);
  const targetHref = toAbsoluteUrl(data.href || data.link || "/");

  const options = {
    body,
    icon: OFFICIAL_LOGO, // Miniature : logo réduit
    badge: OFFICIAL_BADGE,
    image: mediaImage, // Grande image : photo de l'article
    tag: data.tag || "envol-africa-article",
    requireInteraction: true,
    data: {
      href: targetHref,
      link: targetHref,
      image: mediaImage,
    },
  };

  // Diffuser immédiatement aux fenêtres actives pour affichage du tiroir / bannière haute dans l'application
  if (self.clients && self.clients.matchAll) {
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      windowClients.forEach((client) => {
        client.postMessage({
          type: "EAM_IN_APP_NOTIFICATION",
          title,
          body,
          href: targetHref,
          image: mediaImage,
          icon: OFFICIAL_LOGO,
        });
      });
    }).catch(() => {});
  }

  return self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawHref = event.notification.data && event.notification.data.href
    ? event.notification.data.href
    : "/";

  // Toujours rediriger vers le domaine canonique officiel envolafrica.site
  let targetUrl;
  try {
    targetUrl = new URL(rawHref, "https://envolafrica.site");
    if (!targetUrl.origin.includes("envolafrica.site")) {
      targetUrl = new URL(targetUrl.pathname + targetUrl.search, "https://envolafrica.site");
    }
  } catch {
    targetUrl = new URL("/", "https://envolafrica.site");
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const existing = windows.find((client) => "focus" in client && client.url.includes("envolafrica.site"));
      if (existing) {
        await existing.focus();
        return existing.navigate(targetUrl.href);
      }
      return clients.openWindow(targetUrl.href);
    })
  );
});
