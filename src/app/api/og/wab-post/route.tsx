import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

export const runtime = "nodejs";

async function fetchImageAsBase64(url?: string | null): Promise<string> {
  if (!url) return "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const buffer = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch {
    return "";
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getDocMetadata(mimeType: string, name: string) {
  const lowerName = (name || "").toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  if (lowerMime === "application/pdf" || lowerName.endsWith(".pdf")) {
    return {
      badge: "PDF",
      label: "DOCUMENT PDF OFFICIEL",
      accent: "#b3261e",
    };
  }
  if (lowerMime.includes("word") || /\.(doc|docx)$/.test(lowerName)) {
    return {
      badge: "DOCX",
      label: "DOCUMENT WORD (DOCX)",
      accent: "#185abd",
    };
  }
  if (lowerMime.includes("excel") || /\.(xls|xlsx|csv)$/.test(lowerName)) {
    return {
      badge: "EXCEL",
      label: "FEUILLE DE CALCUL EXCEL",
      accent: "#137333",
    };
  }
  if (lowerMime.includes("powerpoint") || /\.(ppt|pptx)$/.test(lowerName)) {
    return {
      badge: "PPT",
      label: "PRÉSENTATION POWERPOINT",
      accent: "#c2410c",
    };
  }
  return {
    badge: "DOC",
    label: "DOCUMENT OFFICIEL WAB",
    accent: "#006874",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  let author = "Membre WAB";
  let headline = "Réseau World Africa Business";
  let content = "Découvrez cette publication exclusive sur World Africa Business (WAB).";
  let type = "text";
  let avatarUrl = "";
  let rawMedia: any[] = [];

  if (id) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data } = await supabase
          .from("wab_posts")
          .select(
            "content, content_type, media, wab_profiles:author_id(headline, avatar_url, users:user_id(prenom, nom, full_name, avatar)), wab_pages:page_id(name, logo_url)"
          )
          .eq("id", id)
          .maybeSingle();

        const postData = data as any;
        if (postData) {
          const profile = Array.isArray(postData.wab_profiles) ? postData.wab_profiles[0] : postData.wab_profiles;
          const page = Array.isArray(postData.wab_pages) ? postData.wab_pages[0] : postData.wab_pages;
          const user = Array.isArray(profile?.users) ? profile.users[0] : profile?.users;

          author =
            page?.name ||
            user?.full_name ||
            [user?.prenom, user?.nom].filter(Boolean).join(" ") ||
            "Membre WAB";

          headline = profile?.headline || "Professionnel sur World Africa Business";
          type = postData.content_type || "text";
          avatarUrl = page?.logo_url || profile?.avatar_url || user?.avatar || "";
          rawMedia = Array.isArray(postData.media) ? postData.media : [];

          const clean = (postData.content || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          if (clean) {
            content = clean.length > 180 ? clean.slice(0, 180) + "…" : clean;
          }
        }
      } catch {}
    }

    if (author === "Membre WAB") {
      try {
        const local = readWabDB().posts.find((p) => p.id === id);
        if (local) {
          author = local.author;
          headline = local.headline || "Membre WAB";
          type = local.type || "text";
          avatarUrl = local.authorAvatarUrl || "";
          rawMedia = local.media || [];
          const clean = (local.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          if (clean) content = clean.length > 180 ? clean.slice(0, 180) + "…" : clean;
        }
      } catch {}
    }
  }

  // Detect media types
  const videoMedia = rawMedia.find(
    (m: any) => m.mimeType?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(m.name || m.path || "")
  );
  const imageMedia = rawMedia.find(
    (m: any) => m.mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(m.name || m.path || "")
  );
  const docMedia = rawMedia.find(
    (m: any) =>
      !m.mimeType?.startsWith("image/") &&
      !m.mimeType?.startsWith("video/") &&
      !m.mimeType?.startsWith("audio/")
  );

  const isVideo = type === "video" || Boolean(videoMedia);
  const isDocument = !isVideo && (type === "document" || Boolean(docMedia));
  const isImage = !isVideo && !isDocument && (type === "image" || Boolean(imageMedia));

  // Resolve visual thumbnail
  let visualUrl = "";
  if (isVideo) {
    visualUrl =
      videoMedia?.thumbnailUrl ||
      videoMedia?.posterUrl ||
      (id ? `https://rtfjwpytiuvoekomevpu.supabase.co/storage/v1/object/public/article-media/thumbnails/video_${id}.jpg` : "");
  } else if (isImage) {
    visualUrl = imageMedia?.mediaUrl || imageMedia?.path || "";
  }

  // Pre-fetch images as Base64 to ensure instant Satori rendering without timeout
  const [visualBase64, avatarBase64] = await Promise.all([
    fetchImageAsBase64(visualUrl),
    fetchImageAsBase64(avatarUrl),
  ]);

  const hasBackgroundVisual = Boolean(visualBase64 || visualUrl);

  // Document metadata if applicable
  const docMeta = isDocument
    ? getDocMetadata(docMedia?.mimeType || "", docMedia?.name || "")
    : null;
  const docName = docMedia?.name || content || "Document WAB";
  const docSizeStr = isDocument ? formatFileSize(docMedia?.size) : "";

  // Badge text & color
  const badgeText = isVideo
    ? "▶ VIDÉO EXCLUSIVE WAB"
    : isDocument
    ? `📄 ${docMeta?.label || "DOCUMENT & RAPPORT"}`
    : type === "opportunity"
    ? "★ OPPORTUNITÉ D'AFFAIRES"
    : "PUBLICATION RÉSEAU";

  const badgeBg = isVideo
    ? "#9e001f"
    : isDocument
    ? docMeta?.accent || "#006874"
    : type === "opportunity"
    ? "#b36b00"
    : "#006874";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          backgroundColor: "#001325",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Visual (Real Video Frame Thumbnail or Image) */}
        {hasBackgroundVisual ? (
          <img
            src={visualBase64 || visualUrl}
            alt="Aperçu visuel"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              background: "linear-gradient(135deg, #06192b 0%, #001325 50%, #1c060b 100%)",
            }}
          />
        )}

        {/* High-Contrast Gradient Overlay for Legibility */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "1200px",
            height: "630px",
            background: hasBackgroundVisual
              ? isVideo
                ? "linear-gradient(180deg, rgba(6, 25, 43, 0.72) 0%, rgba(6, 25, 43, 0.35) 40%, rgba(6, 25, 43, 0.65) 70%, rgba(6, 25, 43, 0.96) 100%)"
                : "linear-gradient(180deg, rgba(6, 25, 43, 0.75) 0%, rgba(6, 25, 43, 0.40) 50%, rgba(6, 25, 43, 0.95) 100%)"
              : "radial-gradient(circle at 80% 20%, rgba(0, 104, 116, 0.35) 0%, transparent 60%)",
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#9e001f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "24px",
                boxShadow: "0 4px 14px rgba(158, 0, 31, 0.6)",
              }}
            >
              E
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "2px", color: "#f0b27e" }}>
                WORLD AFRICA BUSINESS
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                Écosystème Envol Africa
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 22px",
              borderRadius: "30px",
              backgroundColor: badgeBg,
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "1px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            {badgeText}
          </div>
        </div>

        {/* Center Section: Video Play Hero, Document Hero, or Text Focus */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: isVideo ? "center" : "flex-start",
            justifyContent: "center",
            margin: "auto 0",
            zIndex: 10,
            width: "100%",
          }}
        >
          {/* VIDEO HERO: Prominent Play Button over Real Video Frame */}
          {isVideo && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "92px",
                  height: "92px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 45px rgba(0, 0, 0, 0.7), 0 0 25px rgba(240, 178, 126, 0.6)",
                  border: "3px solid #ffffff",
                }}
              >
                <div
                  style={{
                    color: "#9e001f",
                    fontSize: "40px",
                    fontWeight: 900,
                    marginLeft: "6px",
                  }}
                >
                  ▶
                </div>
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                  color: "#f0b27e",
                  backgroundColor: "rgba(6, 25, 43, 0.85)",
                  padding: "6px 20px",
                  borderRadius: "20px",
                  border: "1px solid rgba(240, 178, 126, 0.5)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                REGARDER LA VIDÉO SUR WAB
              </div>
            </div>
          )}

          {/* DOCUMENT HERO: Sleek Document Container */}
          {isDocument && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "22px",
                padding: "24px 32px",
                borderRadius: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.96)",
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                border: `3px solid ${docMeta?.accent || "#006874"}`,
                width: "100%",
                maxWidth: "960px",
              }}
            >
              {/* Document Graphic Icon Badge */}
              <div
                style={{
                  width: "74px",
                  height: "90px",
                  borderRadius: "14px",
                  backgroundColor: docMeta?.accent || "#006874",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                }}
              >
                <span style={{ fontSize: "28px", fontWeight: 900 }}>📄</span>
                <span style={{ fontSize: "14px", fontWeight: 900, marginTop: "4px" }}>
                  {docMeta?.badge || "DOC"}
                </span>
              </div>

              {/* Title & Document Info */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "#082843",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {docName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: docMeta?.accent || "#006874",
                      backgroundColor: "rgba(0,0,0,0.06)",
                      padding: "4px 12px",
                      borderRadius: "10px",
                    }}
                  >
                    {docMeta?.label || "DOCUMENT OFFICIEL"}
                  </span>
                  {docSizeStr && (
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#687274" }}>
                      {docSizeStr}
                    </span>
                  )}
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#006874" }}>
                    • Feuilleter & Télécharger sur WAB
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Post Content Title & Author Profile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            zIndex: 10,
            width: "100%",
          }}
        >
          {/* Post Content / Title */}
          <div
            style={{
              fontSize: content.length > 100 ? "26px" : "32px",
              fontWeight: 800,
              lineHeight: 1.3,
              color: "#ffffff",
              maxHeight: "80px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: "0 2px 10px rgba(0,0,0,0.85)",
            }}
          >
            {content}
          </div>

          {/* Author Details and Network Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              paddingTop: "18px",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              {avatarBase64 || avatarUrl ? (
                <img
                  src={avatarBase64 || avatarUrl}
                  alt={author}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #006874",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: "#006874",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  }}
                >
                  {author.charAt(0)}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "19px", fontWeight: 800, color: "#ffffff", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {author}
                </span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {headline}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "rgba(255,255,255,0.8)",
                fontSize: "14px",
                fontWeight: 700,
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              <span>envolafrica.site</span>
              <span>·</span>
              <span>Réseau B2B Panafricain</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
