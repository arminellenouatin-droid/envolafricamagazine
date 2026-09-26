import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  let author = "Membre WAB";
  let headline = "Réseau World Africa Business";
  let content = "Découvrez cette publication exclusive sur World Africa Business (WAB).";
  let type = "text";
  let avatarUrl = "";

  if (id) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { data } = await supabase
          .from("wab_posts")
          .select("content, content_type, wab_profiles:author_id(headline, avatar_url, users:user_id(prenom, nom, full_name, avatar)), wab_pages:page_id(name, logo_url)")
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

          const clean = (postData.content || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          if (clean) {
            content = clean.length > 200 ? clean.slice(0, 200) + "…" : clean;
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
          const clean = (local.content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          if (clean) content = clean.length > 200 ? clean.slice(0, 200) + "…" : clean;
        }
      } catch {}
    }
  }

  const isVideo = type === "video";
  const badgeText = isVideo
    ? "▶ VIDÉO EXCLUSIVE WAB"
    : type === "opportunity"
    ? "★ OPPORTUNITÉ D’AFFAIRES"
    : type === "document"
    ? "📄 DOCUMENT & RAPPORT"
    : "PUBLICATION RÉSEAU";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #06192b 0%, #001325 50%, #1c060b 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle decorative background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background: isVideo ? "radial-gradient(circle, rgba(158, 0, 31, 0.4) 0%, transparent 70%)" : "radial-gradient(circle, rgba(0, 104, 116, 0.4) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
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
                boxShadow: "0 4px 14px rgba(158, 0, 31, 0.4)",
              }}
            >
              E
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "2px", color: "#f0b27e" }}>
                WORLD AFRICA BUSINESS
              </span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                Écosystème Envol Africa
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 22px",
              borderRadius: "30px",
              backgroundColor: isVideo ? "#9e001f" : "#006874",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "1px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {badgeText}
          </div>
        </div>

        {/* Center: Post Content / Video Play Preview */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            margin: "30px 0",
          }}
        >
          {isVideo && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9e001f",
                  fontSize: "30px",
                  fontWeight: 900,
                  boxShadow: "0 0 30px rgba(255,255,255,0.4)",
                }}
              >
                ▶
              </div>
              <span style={{ fontSize: "20px", fontWeight: 700, color: "#f0b27e" }}>
                Regarder la vidéo sur WAB
              </span>
            </div>
          )}

          <div
            style={{
              fontSize: content.length > 120 ? "32px" : "38px",
              fontWeight: 800,
              lineHeight: 1.35,
              color: "#ffffff",
              maxHeight: "220px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {content}
          </div>
        </div>

        {/* Bottom Author Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: "24px",
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
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={author}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #006874",
                }}
              />
            ) : (
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#006874",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                {author.charAt(0)}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff" }}>
                {author}
              </span>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)" }}>
                {headline}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            <span>envolafrica.site</span>
            <span>·</span>
            <span>Réseau B2B Panafricain</span>
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
