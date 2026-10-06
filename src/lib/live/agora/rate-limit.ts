import "server-only";

/**
 * Limiteur simple en mémoire (fenêtre glissante).
 * ⚠️ En serverless (Vercel) chaque instance a sa propre mémoire : c'est une protection "best effort".
 * Pour un vrai plafond global, remplace par Upstash Redis (@upstash/ratelimit) — même signature.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}
