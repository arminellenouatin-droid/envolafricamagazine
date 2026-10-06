import "server-only";
import { getServiceClient } from "./db";

export const channelNameFor = (liveId: string) => `aa_${liveId}`;

/**
 * Fonctions réutilisables par TON code existant (ex. quand ton API "démarrer le live" est appelée,
 * appelle simplement startAgoraSession(liveId) en plus). Tes écrans et ta logique restent intacts.
 */
export async function ensureAgoraChannel(liveId: string) {
  const db = getServiceClient();
  const { error } = await db
    .from("agora_live_channels")
    .upsert({ live_id: liveId, channel_name: channelNameFor(liveId) }, { onConflict: "live_id", ignoreDuplicates: true });
  if (error) throw new Error("agora_channel_create_failed");
}

export async function startAgoraSession(liveId: string) {
  await ensureAgoraChannel(liveId);
  const { error } = await getServiceClient()
    .from("agora_live_channels")
    .update({ status: "live", started_at: new Date().toISOString(), ended_at: null })
    .eq("live_id", liveId)
    .neq("status", "ended");
  if (error) throw new Error("agora_session_start_failed");
}

export async function endAgoraSession(liveId: string) {
  const { error } = await getServiceClient()
    .from("agora_live_channels")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("live_id", liveId);
  if (error) throw new Error("agora_session_end_failed");
}
