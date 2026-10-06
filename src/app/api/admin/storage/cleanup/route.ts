import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "@/lib/storage/client";
import { isR2Configured } from "@/lib/storage/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Vérification de sécurité : secret CRON Vercel ou rôle Admin
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  if (!isCronAuthorized) {
    const adminAuth = await getCurrentUserForAdmin("admin");
    if (adminAuth.error) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  try {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();

    // 1. Trouver les objets pending de plus d'une heure
    const { data: orphans, error } = await supabase
      .from("storage_objects")
      .select("id,bucket,key")
      .eq("status", "pending")
      .lt("created_at", oneHourAgo)
      .limit(100);

    if (error) {
      return NextResponse.json({ error: "Impossible d'interroger les orphelins" }, { status: 500 });
    }

    const items = orphans || [];
    let cleanedCount = 0;
    const r2 = isR2Configured() ? getR2Client() : null;

    for (const item of items) {
      if (r2 && item.key) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: item.bucket,
              Key: item.key,
            })
          );
        } catch {
          // Si l'objet n'a jamais été uploadé dans R2, ignorer
        }
      }

      await supabase.from("storage_objects").delete().eq("id", item.id);
      cleanedCount++;
    }

    return NextResponse.json({
      success: true,
      cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur de nettoyage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
