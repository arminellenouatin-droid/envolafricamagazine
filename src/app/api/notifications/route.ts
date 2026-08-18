import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getUnifiedNotifications, markUnifiedNotificationsRead } from "@/lib/ecosystem-inbox";

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ notifications: [], unreadCount: 0, authenticated: false });
  const result = await getUnifiedNotifications(user.id);
  return NextResponse.json({ ...result, authenticated: true });
}

export async function PATCH() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const ok = await markUnifiedNotificationsRead(user.id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
