import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";
import WabClient from "../../WabClient";
import type { SinglePostData } from "./WabSinglePostView";

async function getSiteOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  } catch {}
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://envolafrica.vercel.app")
  );
}

type Props = {
  params: Promise<{ id: string }>;
};

async function resolveMediaUrl(supabase: any, pathOrUrl?: string): Promise<string> {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!supabase) return pathOrUrl;

  try {
    const { data } = await supabase.storage.from("wab-media").createSignedUrl(pathOrUrl, 60 * 60 * 24 * 365);
    if (data?.signedUrl) return data.signedUrl;
    return supabase.storage.from("wab-media").getPublicUrl(pathOrUrl).data.publicUrl || "";
  } catch {
    return supabase.storage.from("wab-media").getPublicUrl(pathOrUrl).data.publicUrl || "";
  }
}

async function getPostData(id: string, origin = "https://envolafrica.vercel.app"): Promise<SinglePostData | null> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data } = await supabase
        .from("wab_posts")
        .select(
          "*, wab_profiles:author_id(id,user_id,headline,avatar_url,city,country_code,users:user_id(prenom,nom,full_name,avatar)), wab_pages:page_id(id,name,logo_url)"
        )
        .eq("id", id)
        .eq("moderation_status", "published")
        .maybeSingle();

      if (data) {
        const postData = data as any;
        const profile = Array.isArray(postData.wab_profiles) ? postData.wab_profiles[0] : postData.wab_profiles;
        const page = Array.isArray(postData.wab_pages) ? postData.wab_pages[0] : postData.wab_pages;
        const user = Array.isArray(profile?.users) ? profile.users[0] : profile?.users;

        const author =
          page?.name ||
          user?.full_name ||
          [user?.prenom, user?.nom].filter(Boolean).join(" ") ||
          "Membre WAB";

        const authorAvatarUrl =
          page?.logo_url || profile?.avatar_url || user?.avatar || undefined;

        const headline = profile?.headline || "Professionnel sur World Africa Business";
        const location =
          [profile?.city, profile?.country_code].filter(Boolean).join(", ") ||
          "Afrique";

        const rawMediaList = Array.isArray(postData.media) ? postData.media : [];

        // Résoudre les URLs des médias
        const resolvedMediaList = await Promise.all(
          rawMediaList.map(async (m: any) => {
            const url = m.mediaUrl || (await resolveMediaUrl(supabase, m.path));
            return {
              ...m,
              mediaUrl: url,
            };
          })
        );

        // Détection de vidéo
        const videoMedia = resolvedMediaList.find(
          (m: any) => m.mimeType?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(m.name || m.path)
        );
        const videoUrl = videoMedia?.mediaUrl || undefined;

        // Détection d'image
        const imageMedia = resolvedMediaList.find(
          (m: any) => m.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(m.name || m.path)
        );

        // Si l'image de la publication existe, on l'utilise
        // Sinon (notamment pour les vidéos ou posts texte), on utilise la miniature dynamique 1200x630
        let imageUrl = imageMedia?.mediaUrl;
        if (!imageUrl) {
          imageUrl = `${origin}/api/og/wab-post?id=${id}`;
        }

        return {
          id: data.id,
          author,
          authorAvatarUrl,
          authorUserId: profile?.user_id,
          headline,
          location,
          content: data.content || "",
          type: data.content_type || "text",
          media: resolvedMediaList,
          videoUrl,
          imageUrl,
          views: data.views_count || 0,
          likes: data.likes_count || 0,
          comments: data.comments_count || 0,
          shares: data.shares_count || 0,
          createdAt: data.created_at,
          isBoosted: Boolean(data.is_boosted),
          pageName: page?.name,
          pageLogoUrl: page?.logo_url,
        };
      }
    } catch (e) {
      console.error("[wab/posts] Erreur Supabase getPostData:", e);
    }
  }

  // Fallback local
  try {
    const localPost = readWabDB().posts.find((item) => item.id === id && item.moderationStatus === "published");
    if (localPost) {
      const isVideo = localPost.type === "video" || localPost.media?.some((m) => m.mimeType?.startsWith("video/"));
      const videoMedia = localPost.media?.find((m) => m.mimeType?.startsWith("video/"));
      const imageMedia = localPost.media?.find((m) => m.mimeType?.startsWith("image/"));

      let imageUrl = imageMedia?.path;
      if (!imageUrl) {
        imageUrl = `${origin}/api/og/wab-post?id=${id}`;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = `${origin}${imageUrl}`;
      }

      return {
        id: localPost.id,
        author: localPost.author,
        authorAvatarUrl: localPost.authorAvatarUrl,
        authorUserId: localPost.authorUserId,
        headline: localPost.headline || "Membre WAB",
        location: localPost.location || "Afrique",
        content: localPost.content,
        type: localPost.type,
        media: localPost.media || [],
        videoUrl: videoMedia?.path,
        imageUrl,
        views: localPost.views || 0,
        likes: localPost.likes || 0,
        comments: localPost.comments || 0,
        shares: localPost.shares || 0,
        createdAt: localPost.createdAt,
        isBoosted: Boolean(localPost.isBoosted),
      };
    }
  } catch {}

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const origin = await getSiteOrigin();
  const post = await getPostData(id, origin);

  if (!post) {
    return {
      title: "Publication | World Africa Business (WAB)",
      description: "Découvrez cette publication sur World Africa Business.",
      metadataBase: new URL(origin),
    };
  }

  const cleanContent = (post.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const isVideo = post.type === "video" || Boolean(post.videoUrl);
  const title = isVideo
    ? `▶ Vidéo : ${cleanContent.slice(0, 70)} | ${post.author}`
    : `${cleanContent.slice(0, 70)} | ${post.author} sur WAB`;

  const description = cleanContent.slice(0, 180) + (cleanContent.length > 180 ? "…" : "");
  const postUrl = `${origin}/wab/posts/${id}`;
  const ogImageUrl = post.imageUrl || `${origin}/api/og/wab-post?id=${id}`;

  return {
    metadataBase: new URL(origin),
    title: `${title} | Envol Africa WAB`,
    description,
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url: postUrl,
      siteName: "World Africa Business (WAB) | Envol Africa",
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function WabSharedPostPage({ params }: Props) {
  const { id } = await params;
  const origin = await getSiteOrigin();
  const post = await getPostData(id, origin);

  if (!post) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        <h1 className="font-display text-xl font-bold text-[#082843] mb-2">
          Publication introuvable ou archivée
        </h1>
        <p className="text-xs text-gray-500 max-w-sm mb-6">
          Cette publication a peut-être été supprimée par son auteur ou est temporairement inaccessible.
        </p>
        <Link
          href="/wab"
          className="inline-flex items-center gap-2 rounded-full bg-[#006874] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#004f58] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Retour au fil d’actualité WAB</span>
        </Link>
      </div>
    );
  }

  return <WabClient targetPostId={id} />;
}
