import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { createFounderByAdmin } from "@/lib/affiliation/service";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const { user, error, status } = await getCurrentUserForAdmin("admin");
  if (error || !user) {
    return NextResponse.json({ error: error || "Non autorisé" }, { status: status || 403 });
  }

  try {
    const body = await req.json();
    const { userId, customReferralCode, email } = body;

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Base de données indisponible" }, { status: 503 });
    }

    let targetUserId = userId;

    // Si on fournit un email plutôt qu'un ID
    if (!targetUserId && email) {
      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (!targetUser) {
        return NextResponse.json({ error: `Aucun utilisateur trouvé avec l'email ${email}` }, { status: 404 });
      }
      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "ID utilisateur ou email requis" }, { status: 400 });
    }

    const affiliate = await createFounderByAdmin(targetUserId, customReferralCode);

    return NextResponse.json({
      success: true,
      affiliate,
      message: "Compte Fondateur racine créé / mis à jour avec succès.",
    });
  } catch (err: any) {
    console.error("[api/admin/affiliate/founder] Error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création du compte fondateur" },
      { status: 500 }
    );
  }
}
