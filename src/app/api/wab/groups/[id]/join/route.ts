import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { joinWabGroup } from "@/lib/wab-supabase";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const { id } = await context.params;
  const supabase = await joinWabGroup(user.id, id);
  if (supabase.configured) {
    if (!supabase.membership) return NextResponse.json({ error: supabase.error?.message || "Impossible de rejoindre ce groupe." }, { status: 400 });
    return NextResponse.json({ membership: supabase.membership, message: supabase.membership.status === "pending" ? "Votre demande est en attente de validation." : "Vous êtes maintenant membre du groupe." });
  }
  const db = readWabDB();
  const group = db.groups.find((item) => item.id === id && item.status === "active");
  if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  const existing = db.groupMembers.find((member) => member.groupId === id && member.userId === user.id);
  const membership = existing ?? { groupId: id, userId: user.id, role: "member" as const, status: group.privacy === "private" ? "pending" as const : "active" as const, createdAt: new Date().toISOString() };
  if (!existing) db.groupMembers.push(membership); else existing.status = membership.status;
  writeWabDB(db);
  return NextResponse.json({ membership, message: membership.status === "pending" ? "Votre demande est en attente de validation." : "Vous êtes maintenant membre du groupe." });
}
