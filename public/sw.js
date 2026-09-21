const OFFICIAL_LOGO = "https://www.envolafrica.site/logo-reduit.png";
const OFFICIAL_BADGE = "https://www.envolafrica.site/favicon-32x32.png";

// Prise en compte immédiate de cette version
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Interception absolue : garantit que TOUT appel à showNotification
// charge TOUJOURS le logo réduit d'Envol Africa en icône miniature (icon) et préserve l'image de l'article en grand (image)
if (typeof ServiceWorkerRegistration !== "undefined" && ServiceWorkerRegistration.prototype.showNotification) {
  const _originalShowNotification = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, options = {}) {
    options = options || {};
    options.icon = OFFICIAL_LOGO;
    options.badge = OFFICIAL_BADGE;
    if (options.data && (options.data.image || options.data.imageUrl) && !options.image) {
      options.image = options.data.image || options.data.imageUrl;
    }
    const finalTitle = title || "ENVOL AFRICA";
    return _originalShowNotification.call(this, finalTitle, options);
  };
}

self.addEventListener("push", (event) => {
  const hostname = self.location.hostname;
  const isObsoleteDomain = hostname.includes("alokpe") || hostname.includes("envolafricamagazinealokpe");
  const isAllowedHost = hostname === "envolafrica.site" || hostname === "localhost" || hostname === "127.0.0.1";

  if (isObsoleteDomain || !isAllowedHost) {
    if (self.registration && self.registration.pushManager) {
      self.registration.pushManager.getSubscription().then((sub) => {
        if (sub) sub.unsubscribe().catch(() => {});
      }).catch(() => {});
    }
    if (self.registration && self.registration.unregister) {
      self.registration.unregister().catch(() => {});
    }
    return;
  }

  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const data = payload.data || {};
  const notif = payload.notification || {};
  const title = notif.title || data.title || payload.title || "ENVOL AFRICA";
  const body = notif.body || data.body || payload.body || "Une nouvelle publication est disponible sur Envol Africa.";

  const toAbsolute = (url) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url
        .replace(/https?:\/\/envolafricamagazinealokpe\.vercel\.app/g, "https://envolafrica.site")
        .replace(/https?:\/\/envolafrica\.vercel\.app/g, "https://envolafrica.site");
    }
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `https://envolafrica.site${cleanPath}`;
  };

  // Grande image : photo de l'article ou publication
  const mediaImage = toAbsolute(notif.image || notif.imageUrl || data.image || data.imageUrl || payload.image || payload.imageUrl);
  const targetHref = toAbsolute(data.href || data.link || payload.href || payload.link || "/");

  const options = {
    body,
    icon: OFFICIAL_LOGO, // Miniature : logo réduit officiel
    badge: OFFICIAL_BADGE,
    image: mediaImage, // Grande image : photo de l'article
    tag: payload.tag || data.tag || notif.tag || "eam-publication",
    requireInteraction: true,
    data: { href: targetHref, link: targetHref, image: mediaImage },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawHref = event.notification.data?.href || event.notification.data?.link || "/";
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
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find(
        (client) => "focus" in client && client.url.includes("envolafrica.site")
      );
      if (existing) return existing.focus().then(() => existing.navigate(targetUrl.href));
      return clients.openWindow(targetUrl.href);
    })
  );
});
