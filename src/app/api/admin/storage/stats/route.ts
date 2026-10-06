import { NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getR2Config, isR2Configured } from "@/lib/storage/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentUserForAdmin("admin");
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
  }

  try {
    const config = isR2Configured() ? getR2Config() : {
      R2_BUCKET_PUBLIC: "envol-public",
      R2_BUCKET_PRIVATE: "envol-private",
      R2_SOFT_LIMIT_BYTES: 9_663_676_416,
    };

    // 1. Lister tous les objets actifs
    const { data: objects, error } = await supabase
      .from("storage_objects")
      .select("id,module,kind,size,status,created_at");

    if (error) {
      return NextResponse.json({ error: "Impossible de récupérer les statistiques" }, { status: 500 });
    }

    const items = objects || [];
    let totalBytes = 0;
    const byModule: Record<string, { count: number; bytes: number }> = {};
    const byStatus: Record<string, number> = { ready: 0, pending: 0, deleted: 0 };
    let orphanPendingCount = 0;
    const oneHourAgo = Date.now() - 3600 * 1000;

    for (const obj of items) {
      const size = Number(obj.size || 0);
      const mod = obj.module || "other";
      const status = obj.status || "pending";

      byStatus[status] = (byStatus[status] || 0) + 1;

      if (status === "ready") {
        totalBytes += size;
        if (!byModule[mod]) byModule[mod] = { count: 0, bytes: 0 };
        byModule[mod].count += 1;
        byModule[mod].bytes += size;
      }

      if (status === "pending" && Date.parse(obj.created_at) < oneHourAgo) {
        orphanPendingCount += 1;
      }
    }

    const softLimitBytes = config.R2_SOFT_LIMIT_BYTES;
    const usagePercent = Number(((totalBytes / softLimitBytes) * 100).toFixed(2));
    const alert80Percent = usagePercent >= 80;

    return NextResponse.json({
      success: true,
      stats: {
        totalBytes,
        totalMegabytes: Number((totalBytes / (1024 * 1024)).toFixed(2)),
        softLimitBytes,
        softLimitGigabytes: Number((softLimitBytes / (1024 * 1024 * 1024)).toFixed(2)),
        usagePercent,
        alert80Percent,
        totalObjects: items.length,
        byStatus,
        byModule,
        orphanPendingCount,
      },
      buckets: {
        public: config.R2_BUCKET_PUBLIC,
        private: config.R2_BUCKET_PRIVATE,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
