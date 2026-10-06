import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgoraConfig } from "@/lib/live/agora/config";
import { getServiceClient } from "@/lib/live/agora/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Agora NCS (Notifications) — compte les spectateurs connectés en temps réel, côté serveur.
 * Console Agora → ton projet → Notifications (NCS) → URL : https://TON-DOMAINE/api/live/agora/webhook
 * Événements à cocher : 105 (audience join) et 106 (audience leave).
 */
const eventSchema = z.object({
  noticeId: z.string().min(1).max(100),
  eventType: z.number().int(),
  payload: z.object({ channelName: z.string().min(1).max(64) }).passthrough(),
});

function validSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const { AGORA_NCS_SECRET: secret } = getAgoraConfig();
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const raw = await req.text();
  if (raw.length > 100_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
  if (!validSignature(raw, req.headers.get("agora-signature-v2"), secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: true }); // on accepte (ping de test Agora), on ignore

  const { noticeId, eventType, payload } = parsed.data;
  if (eventType === 105 || eventType === 106) {
    const { error } = await getServiceClient().rpc("agora_apply_event", {
      p_notice_id: noticeId,
      p_channel: payload.channelName,
      p_event: eventType,
    });
    // 500 => Agora réessaiera ; l'idempotence en base évite les doublons
    if (error) return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
