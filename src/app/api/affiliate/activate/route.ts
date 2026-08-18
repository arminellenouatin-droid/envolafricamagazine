import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const client = getSupabaseAdmin();
  if (client) {
    const { data, error } = await client.from("users").update({ role: "affiliate" }).eq("id", user.id).select("id, role, affiliate_code").single();
    if (error) return NextResponse.json({ error: "Impossible d’activer l’affiliation" }, { status: 500 });
    return NextResponse.json({ user: { ...user, role: data.role, affiliateCode: data.affiliate_code || user.affiliateCode } });
  }
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Base de données temporairement indisponible" }, { status: 503 });
  const db = readDB(); const localUser = db.users.find((item) => item.id === user.id);
  if (!localUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  localUser.role = "affiliate"; writeDB(db);
  return NextResponse.json({ user: { ...localUser, affiliateCode: localUser.affiliateCode } });
}
