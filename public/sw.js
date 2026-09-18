self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = payload.title || "Envol Africa";

  const toAbsolute = (url) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    try {
      return new URL(url, self.location.origin).href;
    } catch {
      return url;
    }
  };

  const mediaImage = toAbsolute(payload.image || payload.imageUrl);
  const defaultLogo = toAbsolute("/mobile-header-logo.png");
  const iconUrl = mediaImage || toAbsolute(payload.icon) || defaultLogo;
  const badgeUrl = toAbsolute(payload.badge) || defaultLogo;
  const targetHref = payload.href || payload.link || "/";

  const options = {
    body: payload.body || "Une nouvelle publication est disponible sur Envol Africa.",
    icon: iconUrl,
    badge: badgeUrl,
    image: mediaImage,
    tag: payload.tag || "eam-publication",
    requireInteraction: true,
    data: { href: targetHref, link: targetHref, image: mediaImage },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedHref = event.notification.data?.href || event.notification.data?.link || "/";
  const targetUrl = new URL(requestedHref, self.location.origin);
  if (targetUrl.origin !== self.location.origin) {
    targetUrl.href = new URL("/", self.location.origin).href;
  }
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find(
        (client) => "focus" in client && new URL(client.url).origin === self.location.origin
      );
      if (existing) return existing.focus().then(() => existing.navigate(targetUrl.href));
      return clients.openWindow(targetUrl.href);
    })
  );
});
