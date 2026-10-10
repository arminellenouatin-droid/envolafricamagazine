import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const CANONICAL_BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://www.envolafrica.site"
).replace(/\/+$/, "");

async function fetchImageAsBase64(url?: string | null): Promise<string> {
  if (!url) return "";
  try {
    let targetUrl = url.trim();
    if (targetUrl.startsWith("/")) {
      targetUrl = `${CANONICAL_BASE}${targetUrl}`;
    } else if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `${CANONICAL_BASE}/${targetUrl}`;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const arrayBuffer = await res.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);
    let mime = res.headers.get("content-type") || "image/jpeg";

    if (mime.includes("webp") || url.toLowerCase().includes(".webp")) {
      try {
        buffer = await sharp(buffer).png().toBuffer();
        mime = "image/png";
      } catch (err) {
        console.warn("[OG Share] Échec conversion WebP -> PNG:", err);
      }
    }

    const base64 = buffer.toString("base64");
    return `data:${mime};base64,${base64}`;
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Envol Africa").trim();
  const type = searchParams.get("type") || "article";
  const author = searchParams.get("author") || "";
  const customBadge = searchParams.get("badge") || "";
  const rawImg = searchParams.get("img") || "";
  const isVideo = searchParams.get("video") === "1" || type === "video";

  let badge = customBadge;
  let accentColor = "#9e001f"; // Envol Burgundy default

  if (!badge) {
    switch (type) {
      case "video":
        badge = "▶ VIDÉO EXCLUSIVE";
        accentColor = "#9e001f";
        break;
      case "article":
        badge = "ARTICLE DE FOND";
        accentColor = "#9e001f";
        break;
      case "salon":
        badge = "🎙 SALON LIVE EN DIRECT";
        accentColor = "#006874";
        break;
      case "group":
        badge = "COMMUNAUTÉ WAB";
        accentColor = "#006874";
        break;
      case "page":
        badge = "PAGE PROFESSIONNELLE";
        accentColor = "#006874";
        break;
      case "magazine":
        badge = "ÉDITION KIOSQUE";
        accentColor = "#9e001f";
        break;
      case "crowdfunding":
        badge = "CAMPAGNE D'INVESTISSEMENT";
        accentColor = "#d97706";
        break;
      case "product":
        badge = "MARKETPLACE SÉCURISÉE";
        accentColor = "#b45309";
        break;
      case "job":
        badge = "OFFRE D'EMPLOI";
        accentColor = "#087e8b";
        break;
      case "candidate":
        badge = "CANDIDAT OFFICIEL";
        accentColor = "#d4af37";
        break;
      case "vote":
        badge = "VOTE OFFICIEL EN DIRECT";
        accentColor = "#d4af37";
        break;
      case "competition":
        badge = "AFRICA AWARDS";
        accentColor = "#d4af37";
        break;
      default:
        badge = "ENVOL AFRICA";
        accentColor = "#9e001f";
    }
  }

  // Pre-fetch image
  const backgroundBase64 = rawImg ? await fetchImageAsBase64(rawImg) : "";
  const hasBackground = Boolean(backgroundBase64);
  const isMagazine = type === "magazine";

  // Template Spécifique pour les Magazines du Kiosque :
  // Affiche la véritable couverture dans toute sa hauteur (3:4) sans rognage, avec mise en scène éditoriale de luxe
  if (isMagazine && hasBackground) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "48px 64px",
            backgroundColor: "#030c17",
            color: "#ffffff",
            fontFamily: "system-ui, -apple-system, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Fond cinématographique avec la couverture floutée en filigrane */}
          <img
            src={backgroundBase64}
            alt="Ambiance"
            style={{
              position: "absolute",
              top: -50,
              left: -50,
              width: "1300px",
              height: "730px",
              objectFit: "cover",
              filter: "blur(40px)",
              opacity: 0.28,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              background: "linear-gradient(135deg, rgba(3,12,23,0.95) 0%, rgba(58,8,18,0.85) 50%, rgba(3,12,23,0.98) 100%)",
            }}
          />

          {/* CÔTÉ GAUCHE : Textes, Badges et Appel à la lecture */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              width: "640px",
              zIndex: 10,
              paddingRight: "20px",
            }}
          >
            {/* Header Marque */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
                <span style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "2px", color: "#f0b27e" }}>
                  ENVOL AFRICA
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                  Le Magazine Économique Panafricain
                </span>
              </div>
            </div>

            {/* Titre et Détails du Magazine */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", margin: "auto 0" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  padding: "8px 18px",
                  borderRadius: "30px",
                  backgroundColor: "#9e001f",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  boxShadow: "0 4px 15px rgba(158,0,31,0.5)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                {badge || "ÉDITION OFFICIELLE KIOSQUE"}
              </div>

              <h1
                style={{
                  fontSize: title.length > 50 ? "38px" : "44px",
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: "#ffffff",
                  margin: 0,
                  textShadow: "0 3px 12px rgba(0,0,0,0.85)",
                }}
              >
                {title}
              </h1>

              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#cbd5e1",
                  lineHeight: 1.4,
                }}
              >
                Grandes enquêtes, dossiers sectoriels et analyses stratégiques exclusives.
              </div>
            </div>

            {/* Footer Kiosque */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(240, 178, 126, 0.15)",
                  border: "1px solid rgba(240, 178, 126, 0.5)",
                  borderRadius: "20px",
                  padding: "6px 16px",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#f0b27e",
                }}
              >
                Disponible en Numérique, Papier & Audio
              </div>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                • www.envolafrica.site/kiosque
              </span>
            </div>
          </div>

          {/* CÔTÉ DROIT : La véritable couverture du magazine dans toute sa splendeur */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              width: "420px",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.5)",
                border: "3px solid rgba(255,255,255,0.8)",
              }}
            >
              <img
                src={backgroundBase64}
                alt="Couverture du Magazine"
                style={{
                  width: "360px",
                  height: "510px",
                  objectFit: "cover",
                }}
              />
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

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 64px",
          backgroundColor: "#030c17",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Visual if provided */}
        {hasBackground ? (
          <img
            src={backgroundBase64}
            alt="Visuel d'illustration"
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
              background:
                type === "candidate" || type === "vote" || type === "competition"
                  ? "radial-gradient(circle at 80% 20%, #3a2e0a 0%, #0d0b04 60%, #050505 100%)"
                  : type === "crowdfunding"
                  ? "radial-gradient(circle at 80% 20%, #3b2207 0%, #150c02 60%, #06050a 100%)"
                  : type === "job"
                  ? "radial-gradient(circle at 80% 20%, #093740 0%, #061820 60%, #02080d 100%)"
                  : "radial-gradient(circle at 80% 20%, #3a0812 0%, #120407 60%, #030811 100%)",
            }}
          />
        )}

        {/* Dark Gradient Overlay for Maximum Legibility */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: hasBackground
              ? "linear-gradient(180deg, rgba(3,12,23,0.55) 0%, rgba(3,12,23,0.7) 45%, rgba(3,12,23,0.95) 100%)"
              : "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)",
          }}
        />

        {/* Video Play Button Overlay if Video */}
        {isVideo && (
          <div
            style={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              backgroundColor: "rgba(158, 0, 31, 0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.7), 0 0 30px rgba(158,0,31,0.5)",
              border: "3px solid rgba(255,255,255,0.8)",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "16px solid transparent",
                borderBottom: "16px solid transparent",
                borderLeft: "26px solid #ffffff",
                marginLeft: "6px",
              }}
            />
          </div>
        )}

        {/* Top Header: Badge & Brand */}
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
              gap: "10px",
              padding: "10px 20px",
              backgroundColor: accentColor,
              borderRadius: "999px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {badge}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "#f8fafc",
              }}
            >
              ENVOL AFRICA
            </span>
          </div>
        </div>

        {/* Bottom Content: Title & Author */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
            zIndex: 10,
            maxWidth: "1050px",
          }}
        >
          <h1
            style={{
              fontSize: title.length > 60 ? "40px" : "48px",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              margin: 0,
              textShadow: "0 3px 12px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "4px",
            }}
          >
            {author ? (
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                }}
              >
                Par {author}
              </span>
            ) : null}

            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#94a3b8",
              }}
            >
              www.envolafrica.site
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
