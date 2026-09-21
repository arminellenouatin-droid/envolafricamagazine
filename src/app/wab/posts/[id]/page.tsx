import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

const CANONICAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://www.envolafrica.site";

type Props = {
  params: Promise<{ id: string }>;
};

async function getPostData(id: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from("wab_posts")
      .select("*, wab_profiles:author_id(id,user_id,headline,avatar_url,users:user_id(prenom,nom,full_name,avatar)), wab_pages:page_id(id,name,logo_url)")
      .eq("id", id)
      .eq("moderation_status", "published")
      .maybeSingle();

    if (data) {
      const user = Array.isArray(data.wab_profiles?.users) ? data.wab_profiles.users[0] : data.wab_profiles?.users;
      const author = data.wab_pages?.name || user?.full_name || [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Membre WAB";

      let imageUrl = `${CANONICAL_SITE_URL}/mobile-header-logo.png`;
      const mediaList = Array.isArray(data.media) ? data.media : [];
      const imageMedia = mediaList.find((m: any) => m.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(m.name || m.path));

      if (imageMedia) {
        if (imageMedia.mediaUrl && typeof imageMedia.mediaUrl === "string" && /^https?:\/\//i.test(imageMedia.mediaUrl)) {
          imageUrl = imageMedia.mediaUrl;
        } else if (imageMedia.path && /^https?:\/\//i.test(imageMedia.path)) {
          imageUrl = imageMedia.path;
        } else if (imageMedia.path) {
          if (imageMedia.path.startsWith("/")) {
            imageUrl = `${CANONICAL_SITE_URL}${imageMedia.path}`;
          } else {
            try {
              const { data: signedData } = await supabase.storage.from("wab-media").createSignedUrl(imageMedia.path, 60 * 60 * 24 * 365);
              if (signedData?.signedUrl) {
                imageUrl = signedData.signedUrl;
              } else {
                imageUrl = supabase.storage.from("wab-media").getPublicUrl(imageMedia.path).data.publicUrl;
              }
            } catch {
              imageUrl = supabase.storage.from("wab-media").getPublicUrl(imageMedia.path).data.publicUrl;
            }
          }
        }
      } else {
        const fallback = data.wab_pages?.logo_url || data.wab_profiles?.avatar_url || user?.avatar || `${CANONICAL_SITE_URL}/mobile-header-logo.png`;
        imageUrl = fallback.startsWith("/") ? `${CANONICAL_SITE_URL}${fallback}` : fallback;
      }

      const cleanContent = (data.content || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const title = data.source_title || `${author} sur World Africa Business`;
      const description = cleanContent.slice(0, 180) + (cleanContent.length > 180 ? "…" : "");

      return { id: data.id, author, title, description, imageUrl, cleanContent };
    }
  }

  const localPost = readWabDB().posts.find((item) => item.id === id && item.moderationStatus === "published");
  if (localPost) {
    const cleanContent = (localPost.content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    let imageUrl = localPost.media?.[0]?.path || `${CANONICAL_SITE_URL}/mobile-header-logo.png`;
    if (imageUrl.startsWith("/")) imageUrl = `${CANONICAL_SITE_URL}${imageUrl}`;
    return {
      id: localPost.id,
      author: localPost.author,
      title: localPost.sourceTitle || `${localPost.author} sur World Africa Business`,
      description: cleanContent.slice(0, 180) + (cleanContent.length > 180 ? "…" : ""),
      imageUrl,
      cleanContent,
    };
  }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostData(id);

  if (!post) {
    return {
      title: "Publication | World Africa Business (WAB)",
      description: "Découvrez cette publication sur World Africa Business.",
      metadataBase: new URL(CANONICAL_SITE_URL),
    };
  }

  const postUrl = `${CANONICAL_SITE_URL}/wab/posts/${id}`;

  return {
    metadataBase: new URL(CANONICAL_SITE_URL),
    title: `${post.title} | Envol Africa WAB`,
    description: post.description,
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url: postUrl,
      siteName: "World Africa Business (WAB) | Envol Africa",
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.imageUrl],
    },
  };
}

export default async function WabSharedPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostData(id);
  const targetWabUrl = `/wab#post-${id}`;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(targetWabUrl)});`,
        }}
      />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${targetWabUrl}`} />
      </noscript>

      <div className="w-full max-w-lg rounded-3xl border border-[#d1e9e6] bg-white p-6 shadow-xl text-center">
        {post?.imageUrl && (
          <div className="mb-4 overflow-hidden rounded-2xl bg-[#f5fbfa] max-h-64">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="font-display text-lg font-bold text-[#082843]">{post?.title || "Publication WAB"}</h1>
        <p className="mt-2 text-xs text-[#43474d] line-clamp-3">{post?.description}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={targetWabUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#006874] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#004f58]"
          >
            <span>Accéder à la publication sur WAB</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
