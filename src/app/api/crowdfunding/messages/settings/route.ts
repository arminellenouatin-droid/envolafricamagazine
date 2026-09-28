import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { updateCampaignSettings } from "@/lib/crowdfunding-messages-db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

    const body = await req.json();
    const { projetId, showAmountsToInvestors, allowInvestorCalls } = body;
    if (!projetId) {
      return NextResponse.json({ error: "projetId requis." }, { status: 400 });
    }

    const success = await updateCampaignSettings(projetId, user.id, {
      showAmountsToInvestors,
      allowInvestorCalls,
    });

    if (!success) {
      return NextResponse.json({ error: "Action non autorisée. Seul le porteur peut modifier les paramètres de confidentialité." }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
