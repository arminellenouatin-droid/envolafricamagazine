import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const client = getSupabaseAdmin();
  if (client) {
    let finalCode = user.affiliateCode;
    if (!finalCode || !finalCode.startsWith("EAM-")) {
      finalCode = `EAM-${Math.floor(11000 + Math.random() * 88000)}`;
    }
    const { data, error } = await client
      .from("users")
      .update({ affiliate_accepted: true, affiliate_code: finalCode })
      .eq("id", user.id)
      .select("id, role, affiliate_code, affiliate_accepted")
      .single();
    if (error) return NextResponse.json({ error: "Impossible d’activer l’affiliation" }, { status: 500 });

    const { data: existingAff } = await client
      .from("affiliates")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingAff) {
      await client.from("affiliates").insert({
        id: `aff_${user.id.slice(0, 18)}`,
        user_id: user.id,
        referral_code: data.affiliate_code || finalCode,
        sponsor_id: null,
        level: 1,
        is_active: true,
        magazine_enrolled: true,
        marketplace_enrolled: true,
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        role: data.role,
        affiliateAccepted: true,
        affiliateCode: data.affiliate_code || finalCode,
      },
    });
  }
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
  const db = readDB(); const localUser = db.users.find((item) => item.id === user.id);
  if (!localUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  localUser.affiliateAccepted = true; writeDB(db);
  return NextResponse.json({ user: { ...localUser, affiliateAccepted: true, affiliateCode: localUser.affiliateCode } });
}
