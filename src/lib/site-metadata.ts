const DEFAULT_SITE_URL = "https://envolafricamagazinealokpe.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  try {
    return new URL(configured).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteSiteUrl(value?: string | null) {
  if (!value) return new URL("/logo-couleur-entete.png", getSiteUrl()).href;
  try {
    return new URL(value, getSiteUrl()).href;
  } catch {
    return new URL("/logo-couleur-entete.png", getSiteUrl()).href;
  }
}

export function metadataText(value?: string | null, fallback = "Découvrez cette publication sur Envol Africa.") {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, 200);
}
