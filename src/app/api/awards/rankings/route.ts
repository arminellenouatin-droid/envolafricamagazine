import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { calculateCompetitionOfficialRankings } from "@/lib/awards/scoring-engine";
import type { RankingStatus } from "@/lib/awards/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get("competition_id");

  if (!competitionId) {
    return NextResponse.json({ error: "competition_id requis" }, { status: 400 });
  }

  try {
    const ranking = await calculateCompetitionOfficialRankings(competitionId);
    return NextResponse.json({ success: true, ranking });
  } catch (error: any) {
    console.error("Erreur calcul ranking:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du calcul du classement" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!["admin", "organizer", "redacteur_chef", "gerant"].includes(user.role)) {
    return NextResponse.json(
      { error: "Accès refusé : privilèges organisateur ou administrateur requis" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const competitionId = String(body.competition_id || "");
  const action = String(body.action || "calculate") as "calculate" | "freeze" | "publish";

  if (!competitionId) {
    return NextResponse.json({ error: "competition_id requis" }, { status: 400 });
  }

  const statusMap: Record<string, RankingStatus> = {
    calculate: "calculated",
    freeze: "frozen",
    publish: "published",
  };

  const targetStatus = statusMap[action] || "calculated";

  try {
    const ranking = await calculateCompetitionOfficialRankings(competitionId, {
      status: targetStatus,
      publishedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      action,
      ranking,
      message:
        action === "publish"
          ? "Classement officiel publié avec succès !"
          : action === "freeze"
          ? "Classement officiel gelé pour validation."
          : "Classement calculé avec succès.",
    });
  } catch (error: any) {
    console.error("Erreur action ranking:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l’opération sur le classement" },
      { status: 500 }
    );
  }
}
