import crypto from "node:crypto";

const ADS_SECRET =
  process.env.ENVOL_ADS_SIGNING_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  process.env.SECRET_KEY ||
  "eam_ads_internal_first_party_signing_key_2026";

const IP_SALT =
  process.env.ENVOL_ADS_IP_SALT ||
  "eam_ip_salt_protective_privacy_hash";

export interface AdTokenPayload {
  impressionId: string;
  campaignId: string;
  creativeId: string;
  slotCode: string;
  destinationUrl: string;
  billingModel: "cpm" | "cpc" | "cpv" | "forfait";
  bidAmount: number;
  exp: number; // timestamp ms
  createdAt: number; // timestamp ms
}

/**
 * Encode et signe un jeton publicitaire HMAC-SHA256 pour sécuriser l'ad serving
 */
export function signAdToken(data: Omit<AdTokenPayload, "exp" | "createdAt">, ttlSeconds = 600): string {
  const now = Date.now();
  const payload: AdTokenPayload = {
    ...data,
    createdAt: now,
    exp: now + ttlSeconds * 1000,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADS_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Vérifie et décode un jeton publicitaire signé HMAC-SHA256
 */
export function verifyAdToken(token: string): { valid: boolean; payload?: AdTokenPayload; error?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Jeton manquant" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Format de jeton invalide" };
  }

  const [payloadB64, signature] = parts;

  // Calcul de la signature attendue
  const expectedSignature = crypto
    .createHmac("sha256", ADS_SECRET)
    .update(payloadB64)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: "Signature HMAC invalide" };
  }

  try {
    const rawJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(rawJson) as AdTokenPayload;

    if (Date.now() > payload.exp) {
      return { valid: false, error: "Jeton expiré" };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Contenu de jeton corrompu" };
  }
}

/**
 * Hachage irréversible et anonymisé de l'adresse IP conformément au RGPD
 */
export function hashIpAddress(ip: string): string {
  if (!ip) return "anonymous_ip";
  return crypto.createHmac("sha256", IP_SALT).update(ip.trim()).digest("hex").slice(0, 32);
}

/**
 * Hachage de la session ou empreinte client
 */
export function hashSessionId(session: string): string {
  if (!session) return "anonymous_session";
  return crypto.createHmac("sha256", IP_SALT).update(session.trim()).digest("hex").slice(0, 32);
}
