// Rate limiting §10.3 - placeholder pour Vercel Edge, à remplacer par Upstash Redis en prod
// Endpoints marqués 🛡️ dans API_ENDPOINTS.md doivent avoir rate limiting

type RateLimitEntry = { count: number, resetAt: number };
const store = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, limit: number = 10, windowMs: number = 60_000): { allowed: boolean, remaining: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

export function getClientIp(req: Request): string {
  // Vercel headers
  const forwarded = (req as any).headers?.get?.("x-forwarded-for") || (req as any).headers?.["x-forwarded-for"];
  if (forwarded) return (forwarded as string).split(",")[0].trim();
  return "unknown";
}

// Middleware helper
export function withRateLimit(handler: any, limit = 10, windowMs = 60_000) {
  return async (req: any, ...args: any[]) => {
    const ip = getClientIp(req);
    const key = `${req.url || req.nextUrl?.pathname}:${ip}`;
    const result = rateLimit(key, limit, windowMs);
    if (!result.allowed) {
      return new Response(JSON.stringify({ error: { code: "RATE_LIMIT", message: "Trop de requêtes, réessayez plus tard" } }), { status: 429, headers: { "Content-Type": "application/json", "Retry-After": Math.ceil(windowMs/1000).toString() } });
    }
    return handler(req, ...args);
  };
}
