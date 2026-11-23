import { NextRequest, NextResponse } from "next/server";
import { findMagazineById, listMagazines, type Magazine } from "@/lib/core-db";
import { getCurrentUserFromCookie } from "@/lib/auth";

function sanitizePublicMagazine(magazine: Magazine, isAuthorized: boolean): Magazine {
  if (isAuthorized) {
    return magazine;
  }
  const defaultPreviewPages = Array.isArray(magazine.previewImages) && magazine.previewImages.length > 0
    ? magazine.previewImages
    : [1, 2, 3, 4, 5, 6, 7].map((p) => `/api/magazines/${encodeURIComponent(magazine.id)}/preview?page=${p}&lang=fr`);

  return {
    ...magazine,
    pdfs: {}, // Le PDF complet n'est jamais transmis aux visiteurs non abonnés / non acheteurs
    previewImages: defaultPreviewPages,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    const isAuthorized = Boolean(
      user && (
        ["admin", "gerant", "redacteur_chef"].includes(user.role) ||
        (user.subscription?.status === "active" && new Date(user.subscription.endDate) > new Date())
      )
    );

    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const magazine = await findMagazineById(id);
      if (!magazine) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ magazine: sanitizePublicMagazine(magazine, isAuthorized) });
    }

    const allMagazines = await listMagazines();
    return NextResponse.json({
      magazines: allMagazines.map((m) => sanitizePublicMagazine(m, isAuthorized)),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Magazines temporairement indisponibles" }, { status: 503 });
  }
}
