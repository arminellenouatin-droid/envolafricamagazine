import { NextRequest, NextResponse } from "next/server";
import { verifyDownloadToken } from "@/lib/download";
import { readDB } from "@/lib/db";

export async function GET(req: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const payload = verifyDownloadToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Lien expiré ou invalide - 24h écoulées" }, { status: 403 });
  }

  const db = readDB();
  // Vérifier que l'utilisateur a bien acheté ou est abonné
  const user = db.users.find(u=>u.id===payload.userId);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Vérifier achat ou abonnement
  const hasAccess = db.orders.some(o=>o.userId===payload.userId && o.status==="paid" && o.items.some(i=> (i as any).magazineId===payload.magazineId)) || 
                    (user.subscription?.status==="active" && new Date(user.subscription.endDate) > new Date()) ||
                    user.role==="admin" || user.role==="gerant" || user.role==="redacteur_chef";

  if (!hasAccess) {
    return NextResponse.json({ error: "Accès non autorisé - achat requis" }, { status: 403 });
  }

  // Pour demo, on redirige vers le cover ou on retourne un JSON avec URL sécurisée
  // En prod, on servirait le fichier PDF/audio depuis S3/Supabase Storage avec stream
  const magazine = db.magazines.find(m=>m.id===payload.magazineId);
  if (!magazine) return NextResponse.json({ error: "Magazine introuvable" }, { status: 404 });

  // Génère une URL de téléchargement temporaire (mock)
  // En prod: créer un signed URL S3 avec exp 5 min
  return NextResponse.json({
    success: true,
    message: "Lien sécurisé valide",
    magazine: { id: magazine.id, title: magazine.title, numero: magazine.numero },
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    downloadUrl: magazine.cover, // mock - en prod ce serait le PDF
    type: payload.type,
    format: payload.format,
  });
}
