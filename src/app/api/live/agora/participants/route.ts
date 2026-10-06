import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageLives, getAuthUser } from "@/lib/live/agora/auth-adapter";
import { getServiceClient } from "@/lib/live/agora/db";
import { ensureAgoraChannel } from "@/lib/live/agora/session";
import { PRIVILEGED_ROLES, type RosterEntry } from "@/lib/live/agora/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const liveIdSchema = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);

/** GET ?liveId=… → liste uid ↔ utilisateur ↔ rôle (pour afficher le bon candidat/animateur sur la bonne vidéo). */
export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const liveId = liveIdSchema.safeParse(new URL(req.url).searchParams.get("liveId"));
  if (!liveId.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { data, error } = await getServiceClient()
    .from("agora_live_participants")
    .select("uid,user_id,role")
    .eq("live_id", liveId.data);
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });

  const roster: RosterEntry[] = (data ?? []).map((r) => ({ uid: r.uid, userId: r.user_id, role: r.role }));
  return NextResponse.json({ roster }, { headers: { "Cache-Control": "no-store" } });
}

const upsertSchema = z
  .object({ liveId: liveIdSchema, userId: z.string().uuid(), role: z.enum(PRIVILEGED_ROLES) })
  .strict();

/** POST : l'organisateur désigne l'animateur, les candidats sur scène, les modérateurs. */
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canManageLives(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { liveId, userId, role } = parsed.data;

  try {
    await ensureAgoraChannel(liveId);
    const { data, error } = await getServiceClient()
      .from("agora_live_participants")
      .upsert({ live_id: liveId, user_id: userId, role }, { onConflict: "live_id,user_id" })
      .select("uid,role")
      .single();
    if (error) throw error;
    return NextResponse.json({ uid: data.uid, role: data.role });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const deleteSchema = z.object({ liveId: liveIdSchema, userId: z.string().uuid() }).strict();

/** DELETE : retire quelqu'un de la scène (il redevient simple spectateur au prochain token). */
export async function DELETE(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!canManageLives(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const { error } = await getServiceClient()
    .from("agora_live_participants")
    .delete()
    .eq("live_id", parsed.data.liveId)
    .eq("user_id", parsed.data.userId);
  if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
