import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ notifications: [], unreadCount: 0 });
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("wab_notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) return NextResponse.json({ error: "Notifications indisponibles." }, { status: 503 });
    return NextResponse.json({ notifications: (data ?? []).map((item) => ({ id: item.id, type: item.type, title: item.title, body: item.body, href: item.href, readAt: item.read_at, createdAt: item.created_at })), unreadCount: (data ?? []).filter((item) => !item.read_at).length });
  }
  const notifications = readWabDB().notifications.filter((item) => item.userId === user.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 50);
  return NextResponse.json({ notifications, unreadCount: notifications.filter((item) => !item.readAt).length });
}

export async function PATCH() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { error } = await supabase.from("wab_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    if (error) return NextResponse.json({ error: "Impossible de marquer les notifications." }, { status: 503 });
    return NextResponse.json({ ok: true });
  }
  const db = readWabDB(); db.notifications.forEach((item) => { if (item.userId === user.id && !item.readAt) item.readAt = new Date().toISOString(); }); writeWabDB(db); return NextResponse.json({ ok: true });
}
