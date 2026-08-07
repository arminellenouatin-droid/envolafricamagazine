import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { writeDB } from "@/lib/db";

export async function GET() {
  const { db, error, status } = await getCurrentUserForAdmin('gerant');
  if (error) return NextResponse.json({ error }, { status });
  // Ne pas renvoyer passwordHash
  const users = db!.users.map(u=> ({
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    role: u.role,
    lang: u.lang,
    currency: u.currency,
    createdAt: u.createdAt,
    isVerified: u.isVerified,
    twoFactorEnabled: u.twoFactorEnabled,
    country: u.country,
    affiliateCode: u.affiliateCode,
    subscription: u.subscription,
    favorites: u.favorites,
  }));
  return NextResponse.json({ users });
}

export async function PUT(req: NextRequest) {
  const { user: adminUser, db, error, status } = await getCurrentUserForAdmin('admin');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await req.json();
    const { id, role, nom, prenom, email, country } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const target = db!.users.find(u=>u.id===id);
    if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    // Empêcher de se rétrograder soi-même
    if (target.id===adminUser!.id && role && role!=='admin') {
      return NextResponse.json({ error: "Vous ne pouvez pas changer votre propre rôle admin" }, { status: 403 });
    }
    if (role) {
      const allowedRoles = ['user','subscriber','redacteur','redacteur_chef','gerant','admin'];
      if (!allowedRoles.includes(role)) return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
      target.role = role;
    }
    if (nom) target.nom = nom;
    if (prenom) target.prenom = prenom;
    if (email) target.email = email;
    if (country) target.country = country;
    writeDB(db!);
    return NextResponse.json({ success: true, user: { id: target.id, role: target.role, email: target.email } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user: adminUser, db, error, status } = await getCurrentUserForAdmin('admin');
  if (error) return NextResponse.json({ error }, { status });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    if (id===adminUser!.id) return NextResponse.json({ error: "Vous ne pouvez pas vous supprimer" }, { status: 403 });
    const idx = db!.users.findIndex(u=>u.id===id);
    if (idx===-1) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    db!.users.splice(idx,1);
    writeDB(db!);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
