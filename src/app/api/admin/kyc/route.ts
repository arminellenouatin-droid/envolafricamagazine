import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { listKYCProfiles, adminUpdateKYC, listAMLLogs } from "@/lib/kyc/kyc-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("gerant");
  if (error || !user) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(req.url);
    const filterStatut = searchParams.get("statut") || "all";
    const filterType = searchParams.get("type") || "all";
    const tab = searchParams.get("tab") || "profiles";

    if (tab === "aml") {
      const logs = await listAMLLogs(100);
      return NextResponse.json({ success: true, logs });
    }

    const profiles = await listKYCProfiles({
      statut: filterStatut,
      type: filterType,
    });

    return NextResponse.json({
      success: true,
      profiles,
      counts: {
        total: profiles.length,
        en_attente: profiles.filter((p) => p.statut === "en_attente").length,
        approuve: profiles.filter((p) => p.statut === "approuve").length,
        rejete: profiles.filter((p) => p.statut === "rejete").length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur chargement KYC" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const { userId, statut, motifRejet } = body;

    if (!userId || !["approuve", "rejete"].includes(statut)) {
      return NextResponse.json({ error: "Identifiant utilisateur et statut requis (approuve ou rejete)." }, { status: 400 });
    }

    const updated = await adminUpdateKYC(
      userId,
      statut,
      user.id,
      motifRejet
    );

    return NextResponse.json({
      success: true,
      profile: updated,
      message: statut === "approuve" ? "Dossier KYC validé avec succès ✅" : "Dossier KYC rejeté ❌",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur mise à jour KYC" }, { status: 500 });
  }
}
