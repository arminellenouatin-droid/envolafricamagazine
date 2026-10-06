const DEFAULT_PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_R2_BASE_URL ||
  process.env.R2_PUBLIC_BASE_URL ||
  "https://pub-df336181dd964534a4866a10762a3327.r2.dev";

export function publicUrl(key: string): string {
  if (!key) return "";
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `${DEFAULT_PUBLIC_BASE_URL}/${cleanKey}`;
}

/**
 * Résolution intelligente de l'URL d'un fichier :
 * - Si c'est déjà une URL complète (ex: ancienne URL Supabase Storage ou Unsplash) : renvoyée telle quelle.
 * - Si c'est une nouvelle clé de stockage R2 (ex: "dev/marketplace/.../xxx.webp") : convertie vers l'URL publique R2.
 */
export function resolveFileUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:")) {
    return value;
  }
  return publicUrl(value);
}
