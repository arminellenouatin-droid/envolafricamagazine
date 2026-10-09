import { NextRequest, NextResponse } from "next/server";
import { recordClick } from "@/lib/ads/engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "";

    const { destinationUrl } = await recordClick(token, {
      ip: clientIp,
    });

    // Sécurisation stricte de l'URL de redirection (Anti Open-Redirect / SSRF)
    let sanitizedRedirect = "/";
    if (destinationUrl.startsWith("/")) {
      sanitizedRedirect = destinationUrl;
    } else {
      try {
        const parsed = new URL(destinationUrl);
        if (parsed.protocol === "https:" || (parsed.protocol === "http:" && process.env.NODE_ENV !== "production")) {
          sanitizedRedirect = parsed.toString();
        }
      } catch {
        sanitizedRedirect = "/";
      }
    }

    return NextResponse.redirect(sanitizedRedirect, 302);
  } catch (err: any) {
    console.error("Erreur serveur ad click redirect:", err);
    return NextResponse.redirect(new URL("/", req.url), 302);
  }
}
