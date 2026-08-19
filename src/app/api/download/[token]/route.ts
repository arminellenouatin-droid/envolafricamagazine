import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/download";
import { findMagazineById, findUserById, listOrders } from "@/lib/core-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

  const selectedFile = magazine.pdfs?.[payload.format === "numerique" ? "fr" : (payload.format || "fr")] || magazine.pdfs?.fr;
  let downloadUrl = selectedFile || magazine.cover;
  const privateMatch = selectedFile ? /^private-pdf:\/\/([^/]+)\/(.+)$/.exec(selectedFile) : null;
  if (privateMatch) {
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.json({ error: "Stockage privé indisponible" }, { status: 503 });
    const signed = await client.storage.from(privateMatch[1]).createSignedUrl(privateMatch[2], 300);
    if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: "Impossible de générer le lien temporaire" }, { status: 503 });
    downloadUrl = signed.data.signedUrl;
  }
  return NextResponse.json({
    success: true,
    message: "Lien sécurisé valide",
    magazine: { id: magazine.id, title: magazine.title, numero: magazine.numero },
    expiresAt: new Date(Math.min(payload.exp, Math.floor(Date.now() / 1000) + 300) * 1000).toISOString(),
    downloadUrl,
    type: payload.type,
    format: payload.format,
  });
}
