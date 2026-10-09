const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"]);

function isPrivateIpOrHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) return true;
  // Plages IP privées / link-local / loopback
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

// Domaines partenaires et écosystème explicitement autorisés pour la navigation interne intégrée
const ALLOWED_NAV_DOMAINS = new Set([
  "debitmaster.com",
  "www.debitmaster.com",
  "ateliercouturemanager.com",
  "www.ateliercouturemanager.com",
  "envolafrica.site",
  "www.envolafrica.site",
  "envolafricamag.com",
  "www.envolafricamag.com",
]);

export function validateExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    // Règle de sécurité : HTTPS uniquement
    if (url.protocol !== "https:") return null;
    if (isPrivateIpOrHost(url.hostname)) return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function isAllowedInternalNavDomain(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_NAV_DOMAINS.has(host) || host.endsWith(".debitmaster.com") || host.endsWith(".ateliercouturemanager.com");
}

export function internalBrowserHref(value: string): string | null {
  const url = validateExternalUrl(value);
  return url ? `/navigateur?url=${encodeURIComponent(url.toString())}` : null;
}

export function validateDocumentUrl(value: string): string | null {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return validateExternalUrl(value)?.toString() || null;
}

export function internalDocumentHref(value: string, name?: string, mimeType?: string): string | null {
  const url = validateDocumentUrl(value);
  return url ? `/lecteur-document?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "document")}&type=${encodeURIComponent(mimeType || "")}` : null;
}
