import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createOpaqueToken, createTokenExpiry, hashOpaqueToken, normalizeEmail } from "@/lib/security-crypto";

function emailHash(email: string) {
  return hashOpaqueToken(`${process.env.LOGIN_ATTEMPT_HASH_SECRET || process.env.JWT_SECRET || "local-login-salt"}:${normalizeEmail(email)}`);
}

function valueHash(value: string) {
  return hashOpaqueToken(`${process.env.LOGIN_ATTEMPT_HASH_SECRET || process.env.JWT_SECRET || "local-login-salt"}:${value}`);
}

export async function isLoginBlocked(email: string, ip?: string) {
  const client = getSupabaseAdmin();
  if (!client) return false;
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const emailKey = emailHash(email);
  const ipKey = ip ? valueHash(ip) : null;
  const { data, error } = await client.from("login_attempts").select("email_hash,ip_hash").eq("succeeded", false).gte("attempted_at", since).or(`email_hash.eq.${emailKey}${ipKey ? `,ip_hash.eq.${ipKey}` : ""}`).limit(50);
  if (error) throw error;
  const emailFailures = (data || []).filter((item) => item.email_hash === emailKey).length;
  const ipFailures = ipKey ? (data || []).filter((item) => item.ip_hash === ipKey).length : 0;
  return emailFailures >= 5 || ipFailures >= 20;
}

export async function recordLoginAttempt(email: string, ip: string | undefined, succeeded: boolean) {
  const client = getSupabaseAdmin();
  if (!client) return;
  const { error } = await client.from("login_attempts").insert({ email_hash: emailHash(email), ip_hash: ip ? valueHash(ip) : null, succeeded });
  if (error) throw error;
}

export async function recordSessionEvent(input: { userId?: string; type: "login" | "logout" | "heartbeat" | "session_expired"; ip?: string; userAgent?: string; country?: string; platform?: string }) {
  const client = getSupabaseAdmin();
  if (!client) return;
  const { error } = await client.from("session_events").insert({ user_id: input.userId || null, event_type: input.type, platform: input.platform || "web", ip_hash: input.ip ? valueHash(input.ip) : null, user_agent_hash: input.userAgent ? valueHash(input.userAgent) : null, country: input.country || null });
  if (error) throw error;
}

export async function issueEmailVerificationToken(userId: string, purpose = "account_verification") {
  const client = getSupabaseAdmin();
  if (!client) return null;
  const rawToken = createOpaqueToken(32);
  const { error: deleteError } = await client.from("email_verification_tokens").delete().eq("user_id", userId).eq("purpose", purpose);
  if (deleteError) throw deleteError;
  const { error } = await client.from("email_verification_tokens").insert({ user_id: userId, token_hash: hashOpaqueToken(rawToken), purpose, expires_at: createTokenExpiry(24) });
  if (error) throw error;
  return rawToken;
}

export async function consumeEmailVerificationToken(rawToken: string, purpose = "account_verification") {
  const client = getSupabaseAdmin();
  if (!client) return null;
  const { data, error } = await client.from("email_verification_tokens").select("id,user_id,expires_at,consumed_at").eq("token_hash", hashOpaqueToken(rawToken)).eq("purpose", purpose).maybeSingle();
  if (error) throw error;
  if (!data || data.consumed_at || new Date(data.expires_at).getTime() <= Date.now()) return null;
  const { error: consumeError } = await client.from("email_verification_tokens").update({ consumed_at: new Date().toISOString() }).eq("id", data.id);
  if (consumeError) throw consumeError;
  return data.user_id as string | null;
}
