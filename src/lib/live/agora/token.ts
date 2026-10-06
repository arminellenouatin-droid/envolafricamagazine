import "server-only";
import { randomInt } from "node:crypto";
import { RtcRole, RtcTokenBuilder } from "agora-token";
import { getAgoraConfig } from "./config";
import { AUDIENCE_UID_MAX, AUDIENCE_UID_MIN, type LiveRole, canPublish } from "./roles";

const TTL_PUBLISHER_S = 3 * 60 * 60; // 3 h (animateur / candidats), renouvelé automatiquement côté client
const TTL_VIEWER_S = 60 * 60;        // 1 h (spectateurs / modérateurs), renouvelé automatiquement

export function randomAudienceUid(): number {
  return randomInt(AUDIENCE_UID_MIN, AUDIENCE_UID_MAX);
}

export function buildRtcToken(params: { channelName: string; uid: number; role: LiveRole }) {
  const { NEXT_PUBLIC_AGORA_APP_ID: appId, AGORA_APP_CERTIFICATE: cert } = getAgoraConfig();
  const publish = canPublish(params.role);
  const ttl = publish ? TTL_PUBLISHER_S : TTL_VIEWER_S;

  // agora-token v2 : les durées sont RELATIVES (secondes à partir de maintenant).
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    cert,
    params.channelName,
    params.uid,
    publish ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
    ttl,
    ttl,
  );
  return { appId, token, expiresAt: Math.floor(Date.now() / 1000) + ttl };
}
