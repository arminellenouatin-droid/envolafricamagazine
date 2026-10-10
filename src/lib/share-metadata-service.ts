/**
 * ============================================================================
 * SHARE METADATA SERVICE — ENVOL AFRICA
 * ============================================================================
 * Moteur universel et centralisé de métadonnées sociales et de partage.
 * Conforme aux standards Open Graph, Twitter Cards, WhatsApp Link Preview,
 * Facebook Sharing, Telegram et LinkedIn.
 *
 * Garantit :
 * - URLs canoniques 100% absolues HTTPS
 * - Images 1200x630 optimisées avec fallbacks éditoriaux
 * - Métadonnées vidéo (og:video, og:video:secure_url, og:image avec badge Play)
 * - Formatage WhatsApp infaillible (\n\n)
 * ============================================================================
 */

import type { Metadata } from "next";

export const CANONICAL_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://www.envolafrica.site"
).replace(/\/+$/, "");

export type ShareContentType =
  | "article"
  | "video"
  | "post"
  | "salon"
  | "group"
  | "page"
  | "magazine"
  | "crowdfunding"
  | "product"
  | "boutique"
  | "job"
  | "candidate"
  | "vote"
  | "competition"
  | "default";

export interface ShareContentTarget {
  type: ShareContentType;
  id?: string;
  slug?: string;
  vendor?: string;
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  videoWidth?: number;
  videoHeight?: number;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string | null;
  section?: string;
  badge?: string | null;
  stats?: {
    views?: number;
    likes?: number;
    shares?: number;
    goalAmount?: number;
    currentAmount?: number;
    price?: number;
    currency?: string;
  };
}

/**
 * Construit l'URL canonique publique absolue pour tout type de contenu Envol Africa
 */
export function buildShareUrl(target: {
  type: ShareContentType;
  id?: string;
  slug?: string;
  vendor?: string;
}): string {
  const base = CANONICAL_SITE_URL;
  const { type, id, slug, vendor } = target;

  switch (type) {
    case "article":
      return `${base}/article/${encodeURIComponent(slug || id || "")}`;
    case "video":
    case "post":
      return `${base}/wab/posts/${encodeURIComponent(id || slug || "")}`;
    case "salon":
      return `${base}/wab/salons/${encodeURIComponent(id || slug || "")}`;
    case "group":
      return `${base}/wab/groupes/${encodeURIComponent(id || slug || "")}`;
    case "page":
      return `${base}/wab/pages/${encodeURIComponent(id || slug || "")}`;
    case "magazine":
      return `${base}/kiosque/${encodeURIComponent(slug || id || "")}`;
    case "crowdfunding":
      return `${base}/financement/projets/${encodeURIComponent(id || slug || "")}`;
    case "product":
      return `${base}/marketplace/produits/${encodeURIComponent(id || slug || "")}`;
    case "boutique":
      if (vendor && slug) {
        return `${base}/marketplace/boutique/${encodeURIComponent(vendor)}/${encodeURIComponent(slug)}`;
      }
      return `${base}/marketplace/boutique/${encodeURIComponent(slug || id || "")}`;
    case "job":
      return `${base}/emploi/offres/${encodeURIComponent(id || slug || "")}`;
    case "candidate":
      return `${base}/africa-awards/candidates/${encodeURIComponent(id || slug || "")}`;
    case "vote":
      return `${base}/africa-awards/vote/${encodeURIComponent(id || slug || "")}`;
    case "competition":
      return `${base}/africa-awards/competitions/${encodeURIComponent(slug || id || "")}`;
    default:
      return slug ? `${base}/${slug.replace(/^\//, "")}` : base;
  }
}

/**
 * Résout une URL d'image en URL absolue HTTPS sécurisée
 */
export function resolveAbsoluteImageUrl(rawUrl?: string | null, fallbackPath = "/logo-couleur-entete-new.png"): string {
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return `${CANONICAL_SITE_URL}${fallbackPath.startsWith("/") ? "" : "/"}${fallbackPath}`;
  }
  const clean = rawUrl.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    // Si c'est http sur notre domaine ou domaine public, forcer https
    return clean.replace(/^http:\/\//, "https://");
  }
  if (clean.startsWith("//")) {
    return `https:${clean}`;
  }
  return `${CANONICAL_SITE_URL}${clean.startsWith("/") ? "" : "/"}${clean}`;
}

/**
 * Nettoie le texte pour les métadonnées (suppression balises HTML, espaces multiples, entités)
 */
export function sanitizeMetaText(text?: string | null, maxLength = 180): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Génère une URL d'image Open Graph dynamique 1200x630 générée à la volée via Satori
 */
export function buildDynamicOgImageUrl(options: {
  title: string;
  type: ShareContentType;
  author?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  isVideo?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set("title", options.title.slice(0, 100));
  params.set("type", options.type);
  if (options.author) params.set("author", options.author.slice(0, 50));
  if (options.badge) params.set("badge", options.badge);
  if (options.imageUrl) params.set("img", options.imageUrl);
  if (options.isVideo) params.set("video", "1");

  return `${CANONICAL_SITE_URL}/api/og/share?${params.toString()}`;
}

/**
 * Moteur universel de métadonnées SSR (generateMetadata) pour Next.js App Router
 */
export function buildShareMetadata(target: ShareContentTarget): Metadata {
  const canonicalUrl = buildShareUrl({
    type: target.type,
    id: target.id,
    slug: target.slug,
    vendor: target.vendor,
  });

  const isVideo = target.type === "video" || Boolean(target.videoUrl);
  const cleanTitle = (target.title || "Envol Africa").trim();
  const cleanDesc =
    sanitizeMetaText(target.description) ||
    "Découvrez ce contenu exclusif sur la plateforme panafricaine Envol Africa.";

  // Choix de l'image Open Graph (1200x630)
  let ogImageUrl: string;
  if (target.type === "magazine" && target.imageUrl && target.imageUrl.trim()) {
    if (target.imageUrl.includes("/api/og/")) {
      ogImageUrl = resolveAbsoluteImageUrl(target.imageUrl);
    } else {
      const absCover = resolveAbsoluteImageUrl(target.imageUrl);
      ogImageUrl = buildDynamicOgImageUrl({
        title: cleanTitle,
        type: "magazine",
        badge: target.badge || "ÉDITION KIOSQUE",
        imageUrl: absCover,
      });
    }
  } else if (isVideo && target.id && (target.type === "video" || target.type === "post")) {
    // Pour une vidéo WAB : privilégier l'image avec bouton de lecture Play central
    ogImageUrl = `${CANONICAL_SITE_URL}/api/og/wab-post?id=${encodeURIComponent(target.id)}`;
  } else if (target.imageUrl && target.imageUrl.trim()) {
    ogImageUrl = resolveAbsoluteImageUrl(target.imageUrl);
  } else if (isVideo) {
    // Si c'est une vidéo sans thumbnail, utiliser l'image dynamique avec bouton Play
    ogImageUrl = buildDynamicOgImageUrl({
      title: cleanTitle,
      type: "video",
      author: target.author,
      badge: "VIDÉO EXCLUSIVE",
      isVideo: true,
    });
  } else {
    // Fallback dynamique brandé avec typographie et logo
    ogImageUrl = buildDynamicOgImageUrl({
      title: cleanTitle,
      type: target.type,
      author: target.author,
      badge: target.badge,
    });
  }

  // Type Open Graph conforme au protocole officiel
  let ogType: "website" | "article" | "video.other" | "profile" | "book" = "website";
  if (isVideo) {
    ogType = "video.other";
  } else if (target.type === "article") {
    ogType = "article";
  } else if (target.type === "candidate") {
    ogType = "profile";
  } else if (target.type === "magazine") {
    ogType = "book";
  }

  const siteName =
    target.type === "video" || target.type === "post" || target.type === "salon" || target.type === "group" || target.type === "page"
      ? "World Africa Business (WAB) • Envol Africa"
      : target.type === "candidate" || target.type === "vote" || target.type === "competition"
      ? "Africa Awards • Envol Africa"
      : target.type === "job"
      ? "Envol Africa Jobs"
      : target.type === "crowdfunding"
      ? "AfricaCrowdFunding • Envol Africa"
      : target.type === "product" || target.type === "boutique"
      ? "Marketplace • Envol Africa"
      : "Envol Africa Magazine";

  const metadata: Metadata = {
    metadataBase: new URL(CANONICAL_SITE_URL),
    title: cleanTitle,
    description: cleanDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: cleanTitle,
      description: cleanDesc,
      url: canonicalUrl,
      siteName,
      type: ogType as any,
      locale: "fr_FR",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl.startsWith("https://") ? ogImageUrl : undefined,
          width: 1200,
          height: 630,
          alt: cleanTitle,
          type: ogImageUrl.includes(".png") || ogImageUrl.includes("/api/og/") ? "image/png" : "image/jpeg",
        },
        ...(target.type === "magazine" && target.imageUrl && !target.imageUrl.includes("/api/og/")
          ? [
              {
                url: resolveAbsoluteImageUrl(target.imageUrl),
                secureUrl: resolveAbsoluteImageUrl(target.imageUrl).startsWith("https://")
                  ? resolveAbsoluteImageUrl(target.imageUrl)
                  : undefined,
                alt: `Couverture ${cleanTitle}`,
                type: "image/jpeg",
              },
            ]
          : []),
      ],
      ...(target.publishedTime ? { publishedTime: target.publishedTime } : {}),
      ...(target.modifiedTime ? { modifiedTime: target.modifiedTime } : {}),
      ...(target.author ? { authors: [target.author] } : {}),
      ...(target.section ? { section: target.section } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: cleanDesc,
      images: [ogImageUrl],
    },
  };

  // Ajout des métadonnées vidéo si disponible
  if (isVideo && target.videoUrl && metadata.openGraph) {
    const absoluteVideoUrl = resolveAbsoluteImageUrl(target.videoUrl);
    (metadata.openGraph as any).videos = [
      {
        url: absoluteVideoUrl,
        secureUrl: absoluteVideoUrl.replace(/^http:\/\//, "https://"),
        type: "video/mp4",
        width: target.videoWidth || 1280,
        height: target.videoHeight || 720,
      },
    ];
  }

  return metadata;
}

/**
 * Construit les URLs directes de partage social pour tous les réseaux
 */
export function buildSocialShareLinks(params: {
  url: string;
  title: string;
  summary?: string;
  imageUrl?: string;
}) {
  const fullUrl = resolveAbsoluteImageUrl(params.url, "");
  const title = params.title.trim();
  const summary = sanitizeMetaText(params.summary, 120);

  // Construction du message WhatsApp optimisé avec double saut de ligne
  // Garantit la détection infaillible de l'URL par le scraper WhatsApp
  const whatsappText = summary
    ? `${title} — ${summary}\n\n${fullUrl}`
    : `${title}\n\n${fullUrl}`;

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedWhatsapp = encodeURIComponent(whatsappText);
  const encodedTwitter = encodeURIComponent(title);
  const encodedTelegram = encodeURIComponent(title);

  return {
    url: fullUrl,
    whatsapp: `https://wa.me/?text=${encodedWhatsapp}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://x.com/intent/post?text=${encodedTwitter}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTelegram}`,
  };
}
