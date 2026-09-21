import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // 1. Redirection 308 permanente de l'ancien domaine obsolète envolafricamagazinealokpe.vercel.app
  if (host.includes("alokpe") || host.includes("envolafricamagazinealokpe")) {
    const canonicalUrl = new URL(`${pathname}${search}`, "https://www.envolafrica.site");
    return NextResponse.redirect(canonicalUrl, 308);
  }

  // 2. Protection des pages d'administration à l'Edge
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("eam_token")?.value;
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
