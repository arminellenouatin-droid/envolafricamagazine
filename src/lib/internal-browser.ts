const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

export function validateExternalUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (BLOCKED_HOSTS.has(url.hostname.toLowerCase())) return null;
    if (url.username || url.password) return null;
    return url;
  } catch {
    return null;
  }
}

export function internalBrowserHref(value: string): string | null {
  const url = validateExternalUrl(value);
  return url ? `/navigateur?url=${encodeURIComponent(url.toString())}` : null;
}
