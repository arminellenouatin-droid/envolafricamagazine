import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSpacesForUser } from "@/lib/crowdfunding-messages-db";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromCookie();
    if (!user) {
      return NextResponse.json({ error: "Connexion requise pour accéder aux espaces d'investissement." }, { status: 401 });
    }

    const spaces = await getSpacesForUser(user.id, user.role);

    return NextResponse.json({
      spaces,
      userId: user.id,
      userName: `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email || "Utilisateur",
    });
  } catch (error) {
    console.error("Error fetching crowdfunding spaces:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des espaces." }, { status: 500 });
  }
}
