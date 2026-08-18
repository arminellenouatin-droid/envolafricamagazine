import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: group, error } = await supabase.from("wab_groups").select("*").eq("id", id).eq("status", "active").maybeSingle();
    if (error || !group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    const { count } = await supabase.from("wab_group_members").select("user_id", { count: "exact", head: true }).eq("group_id", id).eq("status", "active");
    const { data: membership } = user ? await supabase.from("wab_group_members").select("role,status").eq("group_id", id).eq("user_id", user.id).maybeSingle() : { data: null };
    return NextResponse.json({ group: { id: group.id, ownerUserId: group.owner_user_id, name: group.name, slug: group.slug, description: group.description, logoUrl: group.logo_url, privacy: group.privacy, status: group.status, memberCount: count ?? 0 }, membership });
  }
  const db = readWabDB();
  const group = db.groups.find((item) => item.id === id && item.status === "active");
  if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  return NextResponse.json({ group: { ...group, memberCount: db.groupMembers.filter((member) => member.groupId === id && member.status === "active").length }, membership: user ? db.groupMembers.find((member) => member.groupId === id && member.userId === user.id) ?? null : null });
}
