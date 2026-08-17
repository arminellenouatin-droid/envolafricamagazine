import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie, hashPassword, verifyPassword } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";

function isStrongPassword(password: string) {
  return password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { currentPassword?: string; newPassword?: string; confirmPassword?: string } | null;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";
  if (!currentPassword || !newPassword || !confirmPassword) return NextResponse.json({ error: "Les trois champs sont requis." }, { status: 400 });
  if (newPassword !== confirmPassword) return NextResponse.json({ error: "La confirmation ne correspond pas au nouveau mot de passe." }, { status: 400 });
  if (!isStrongPassword(newPassword)) return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." }, { status: 400 });
  if (currentPassword === newPassword) return NextResponse.json({ error: "Le nouveau mot de passe doit être différent de l’ancien." }, { status: 400 });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 403 });
  const passwordHash = await hashPassword(newPassword);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("id", user.id);
    if (error) return NextResponse.json({ error: "Impossible d’enregistrer le nouveau mot de passe." }, { status: 502 });
  } else {
    const db = readDB();
    const localUser = db.users.find((candidate) => candidate.id === user.id);
    if (!localUser) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    localUser.passwordHash = passwordHash;
    writeDB(db);
  }
  return NextResponse.json({ success: true, message: "Mot de passe modifié. Vos prochaines connexions utiliseront le nouveau mot de passe." });
}
