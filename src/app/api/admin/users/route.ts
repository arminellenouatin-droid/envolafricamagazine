import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { findUserById, listUsers, updateUserAdmin } from "@/lib/core-db";
import { writeDB } from "@/lib/db";

function publicUser(user: Awaited<ReturnType<typeof findUserById>>) {
  if (!user) return null;
  return { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, lang: user.lang, currency: user.currency, createdAt: user.createdAt, isVerified: user.isVerified, twoFactorEnabled: user.twoFactorEnabled, country: user.country, phone: user.phone, affiliateCode: user.affiliateCode, subscription: user.subscription, favorites: user.favorites };
}

export async function GET() {
  const { error, status } = await getCurrentUserForAdmin("gerant");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const users = await listUsers();
    return NextResponse.json({ users: users.map(publicUser).filter(Boolean) });
  } catch (cause) {
    console.error("[admin/users] lecture impossible", cause);
    return NextResponse.json({ error: "Impossible de charger les utilisateurs" }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  const { user: adminUser, db, error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json() as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const target = await findUserById(id);
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    const role = typeof body.role === "string" ? body.role : undefined;
    if (target.id === adminUser!.id && role && role !== "admin") return NextResponse.json({ error: "Vous ne pouvez pas changer votre propre rôle admin" }, { status: 403 });
    if (role && !["user", "subscriber", "redacteur", "redacteur_chef", "gerant", "admin"].includes(role)) return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    const updates = {
      role,
      nom: typeof body.nom === "string" ? body.nom.trim() : undefined,
      prenom: typeof body.prenom === "string" ? body.prenom.trim() : undefined,
      email: typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined,
      country: typeof body.country === "string" ? body.country.trim().toUpperCase() : undefined,
      isVerified: typeof body.isVerified === "boolean" ? body.isVerified : undefined,
    };
    const updated = db ? (() => {
      const localTarget = db.users.find((item) => item.id === id);
      if (!localTarget) throw new Error("Utilisateur introuvable");
      Object.assign(localTarget, updates);
      writeDB(db);
      return localTarget;
    })() : await updateUserAdmin(id, updates);
    return NextResponse.json({ success: true, user: publicUser(updated) });
  } catch (cause) {
    console.error("[admin/users] mise à jour impossible", cause);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user: adminUser, db, error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    if (id === adminUser!.id) return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer" }, { status: 403 });
    if (!db) return NextResponse.json({ error: "Suppression utilisateur non disponible dans cette interface" }, { status: 409 });
    const index = db.users.findIndex((item) => item.id === id);
    if (index === -1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    db.users.splice(index, 1);
    writeDB(db);
    return NextResponse.json({ success: true });
  } catch (cause) {
    console.error("[admin/users] suppression impossible", cause);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
