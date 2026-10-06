import { NextResponse } from "next/server";
import { z } from "zod";
import { canManageLives, getAuthUser } from "@/lib/live/agora/auth-adapter";
import { getServiceClient } from "@/lib/live/agora/db";
import { endAgoraSession, ensureAgoraChannel, startAgoraSession } from "@/lib/live/agora/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    liveId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
    action: z.enum(["create", "start", "end"]),
  })
  .strict();

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  const { liveId, action } = parsed.data;

  // Autorisation : organisateur, ou animateur (host) de CE live pour start/end.
  let allowed = canManageLives(user);
  if (!allowed && action !== "create") {
    const { data: p } = await getServiceClient()
      .from("agora_live_participants")
      .select("role")
      .eq("live_id", liveId)
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = p?.role === "host";
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    if (action === "create") await ensureAgoraChannel(liveId);
    if (action === "start") await startAgoraSession(liveId);
    if (action === "end") await endAgoraSession(liveId);
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
