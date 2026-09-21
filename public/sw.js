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
  const title = payload.title || "ENVOL AFRICA";

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
  const mediaImage = toAbsolute(payload.image || payload.imageUrl);
  const logoReduit = toAbsolute("/logo-reduit.png") || toAbsolute("/favicon.png");

  // Miniature Chrome : le logo réduit
  const iconUrl = toAbsolute(payload.icon) || logoReduit;
  const badgeUrl = toAbsolute(payload.badge) || toAbsolute("/favicon-32x32.png") || logoReduit;
  const targetHref = toAbsolute(payload.href || payload.link || "/");

  const options = {
    body: payload.body || "Une nouvelle publication est disponible sur Envol Africa.",
    icon: iconUrl, // Miniature : logo réduit
    badge: badgeUrl,
    image: mediaImage, // Grande image : photo de l'article
    tag: payload.tag || "eam-publication",
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
