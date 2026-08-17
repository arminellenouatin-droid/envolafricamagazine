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

export function validateDocumentUrl(value: string): string | null {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return validateExternalUrl(value)?.toString() || null;
}

export function internalDocumentHref(value: string, name?: string, mimeType?: string): string | null {
  const url = validateDocumentUrl(value);
  return url ? `/lecteur-document?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "document")}&type=${encodeURIComponent(mimeType || "")}` : null;
}
