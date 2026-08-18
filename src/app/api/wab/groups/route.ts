import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB, type WabGroup } from "@/lib/wab-db";
import { createWabGroup, listWabGroups } from "@/lib/wab-supabase";

function slugify(value: string) { return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80); }
function serialize(group: WabGroup | { id: string; owner_user_id: string; name: string; slug: string; description?: string | null; logo_url?: string | null; avatar_url?: string | null; cover_url?: string | null; privacy: string; status: string; created_at: string; updated_at: string }) {
  return "owner_user_id" in group ? { id: group.id, ownerUserId: group.owner_user_id, name: group.name, slug: group.slug, description: group.description ?? "", logoUrl: group.logo_url ?? undefined, avatarUrl: group.avatar_url ?? group.logo_url ?? undefined, coverUrl: group.cover_url ?? undefined, privacy: group.privacy, status: group.status, createdAt: group.created_at, updatedAt: group.updated_at } : group;
}

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ groups: [] }, { status: 401 });
  const supabase = await listWabGroups(user.id);
  if (supabase.configured) return NextResponse.json({ groups: (supabase.groups ?? []).map(serialize), memberships: supabase.memberships ?? [] });
  const db = readWabDB();
  const groups = db.groups.filter((group) => group.status === "active" && (group.ownerUserId === user.id || db.groupMembers.some((member) => member.groupId === group.id && member.userId === user.id && member.status === "active")));
  return NextResponse.json({ groups, memberships: db.groupMembers.filter((member) => member.userId === user.id) });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  if (!name) return NextResponse.json({ error: "Le nom du groupe est obligatoire." }, { status: 400 });
  const input = { name, slug: slugify(name), description: typeof body.description === "string" ? body.description.trim().slice(0, 500) : undefined, logoUrl: typeof body.logoUrl === "string" ? body.logoUrl.trim().slice(0, 500) : undefined, avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 500) : undefined, coverUrl: typeof body.coverUrl === "string" ? body.coverUrl.trim().slice(0, 500) : undefined, privacy: body.privacy === "private" ? "private" as const : "community" as const };
  const supabase = await createWabGroup(user.id, input);
  if (supabase.configured) { if (!supabase.group) return NextResponse.json({ error: supabase.error?.message || "Impossible de créer le groupe." }, { status: 400 }); return NextResponse.json({ group: serialize(supabase.group) }, { status: 201 }); }
  const db = readWabDB();
  if (db.groups.some((group) => group.ownerUserId === user.id && group.slug === input.slug)) return NextResponse.json({ error: "Un groupe portant ce nom existe déjà." }, { status: 409 });
  const now = new Date().toISOString();
  const group = { id: crypto.randomUUID(), ownerUserId: user.id, ...input, status: "active" as const, createdAt: now, updatedAt: now };
  db.groups.push(group); db.groupMembers.push({ groupId: group.id, userId: user.id, role: "owner", status: "active", createdAt: now }); writeWabDB(db);
  return NextResponse.json({ group }, { status: 201 });
}
