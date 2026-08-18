import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/download";
import { findMagazineById, findUserById, listOrders } from "@/lib/core-db";

export async function GET(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const payload = verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Lien expiré ou invalide - 24h écoulées" }, { status: 403 });
  }

  // Vérifier que l'utilisateur existe dans la base active
  const user = await findUserById(payload.userId);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Vérifier achat ou abonnement dans Supabase
  const orders = await listOrders(payload.userId);
  const hasAccess = orders.some((order) => order.status === "paid" && order.items.some((item) => item.magazineId === payload.magazineId)) ||
                    (user.subscription?.status === "active" && new Date(user.subscription.endDate) > new Date()) ||
                    ["admin", "gerant", "redacteur_chef"].includes(user.role);

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès non autorisé - achat requis" }, { status: 403 });
  }

  // Pour demo, on retourne encore la couverture ; le fichier final devra venir de Storage signé.
  const magazine = payload.magazineId ? await findMagazineById(payload.magazineId) : null;
  if (!magazine) return NextResponse.json({ error: "Magazine introuvable" }, { status: 404 });

  // Génère une URL de téléchargement temporaire (mock)
  // En prod: créer un signed URL S3 avec exp 5 min
  return NextResponse.json({
    success: true,
    message: "Lien sécurisé valide",
    magazine: { id: magazine.id, title: magazine.title, numero: magazine.numero },
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    downloadUrl: magazine.pdfs?.[payload.format === "numerique" ? "fr" : (payload.format || "fr")] || magazine.cover,
    type: payload.type,
    format: payload.format,
  });
}
