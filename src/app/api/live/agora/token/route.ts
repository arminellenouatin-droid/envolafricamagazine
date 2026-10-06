import { NextResponse } from "next/server";
import { z } from "zod";
import { canViewLive, getAuthUser } from "@/lib/live/agora/auth-adapter";
import { getServiceClient } from "@/lib/live/agora/db";
import { rateLimit } from "@/lib/live/agora/rate-limit";
import { LIVE_ROLES, type LiveRole, type TokenPayload } from "@/lib/live/agora/roles";
import { buildRtcToken, randomAudienceUid } from "@/lib/live/agora/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    liveId: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/),
    asRole: z.enum(LIVE_ROLES).default("audience"),
  })
  .strict();

const noStore = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });

  // 20 demandes / minute / utilisateur (couvre les renouvellements + reconnexions)
  if (!rateLimit(`agora-token:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: noStore });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400, headers: noStore });
  const { liveId, asRole } = parsed.data;

  const db = getServiceClient();
  const { data: channel } = await db
    .from("agora_live_channels")
    .select("channel_name,status")
    .eq("live_id", liveId)
    .maybeSingle();
  if (!channel) return NextResponse.json({ error: "live_not_found" }, { status: 404, headers: noStore });
  if (channel.status === "ended") return NextResponse.json({ error: "live_ended" }, { status: 410, headers: noStore });

  // Le rôle est TOUJOURS décidé par le serveur à partir de la base — jamais par le client.
  const { data: participant } = await db
    .from("agora_live_participants")
    .select("role,uid")
    .eq("live_id", liveId)
    .eq("user_id", user.id)
    .maybeSingle();

  const granted: LiveRole = (participant?.role as LiveRole | undefined) ?? "audience";
  if (asRole !== "audience" && asRole !== granted) {
    return NextResponse.json({ error: "forbidden_role" }, { status: 403, headers: noStore });
  }
  // On donne le rôle demandé s'il est autorisé ; un participant peut aussi simplement regarder.
  const effective: LiveRole = asRole === "audience" ? "audience" : granted;

  if (effective === "audience" && !(await canViewLive(user, liveId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
  }

  const uid = effective === "audience" ? randomAudienceUid() : (participant!.uid as number);
  const { appId, token, expiresAt } = buildRtcToken({ channelName: channel.channel_name, uid, role: effective });

  const payload: TokenPayload = { appId, channel: channel.channel_name, token, uid, role: effective, expiresAt };
  return NextResponse.json(payload, { headers: noStore });
}
