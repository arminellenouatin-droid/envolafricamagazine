import crypto from "crypto";

const CHARIOW_API_BASE = "https://api.chariow.com/v1";

/**
 * URLs et IDs des produits créés directement dans la boutique Chariow par le propriétaire
 */
export const CHARIOW_PRODUCT_URLS = {
  magazineNumerique: "https://toerbwke.mychariow.shop/prd_ac3bruo2",
  abonnementChefEntreprise: "https://toerbwke.mychariow.shop/prd_g8iz7mej",
  don: "https://toerbwke.mychariow.shop/prd_d1v11apk",
} as const;

export const CHARIOW_PRODUCT_IDS = {
  magazineNumerique: "prd_ac3bruo2",
  abonnementChefEntreprise: "prd_g8iz7mej",
  don: "prd_d1v11apk",
} as const;

export interface ChariowPhone {
  number: string;
  country_code: string;
}

export interface ChariowCheckoutParams {
  product_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: ChariowPhone;
  discount_code?: string;
  payment_currency?: string;
  redirect_url?: string;
  customer_ip?: string;
  custom_metadata?: Record<string, string>;
}

export interface ChariowCheckoutResult {
  ok: boolean;
  step?: "payment" | "completed" | "already_purchased";
  checkout_url?: string | null;
  sale_id?: string | null;
  message?: string;
  error?: string;
}

/**
 * Vérifie si les identifiants Chariow sont présents dans l'environnement.
 */
export function isChariowConfigured(): boolean {
  return Boolean(process.env.CHARIOW_SECRET_KEY);
}

/**
 * Pays disposant d'un support Mobile Money natif via Moneroo.
 * Tous les autres pays (Centrafrique, Tchad, Madagascar, Gambie, RDC, International...) sont routés vers Chariow.
 */
const MONEROO_NATIVE_COUNTRIES = new Set(["BJ", "TG", "CI", "SN", "CM", "ML", "BF"]);

export function isMonerooNativeCountry(countryCode?: string): boolean {
  if (!countryCode) return false;
  return MONEROO_NATIVE_COUNTRIES.has(countryCode.toUpperCase().trim());
}

export function getRecommendedPaymentGateway(countryCode?: string): "moneroo" | "chariow" {
  if (countryCode && isMonerooNativeCountry(countryCode)) {
    return "moneroo";
  }
  return "chariow";
}

/**
 * Initialise une session de paiement sécurisée via l'API Chariow Checkout.
 */
export async function createChariowCheckout(
  params: ChariowCheckoutParams
): Promise<ChariowCheckoutResult> {
  const secretKey = process.env.CHARIOW_SECRET_KEY;
  if (!secretKey) {
    return {
      ok: false,
      error: "Passerelle Chariow non configurée (CHARIOW_SECRET_KEY manquante).",
    };
  }

  // Nettoyage et formatage du téléphone
  const cleanPhone = {
    number: params.phone.number.replace(/\D/g, ""),
    country_code: params.phone.country_code.toUpperCase().trim(),
  };

  const payload: Record<string, any> = {
    product_id: params.product_id,
    email: params.email.trim().toLowerCase(),
    first_name: params.first_name.trim() || "Client",
    last_name: params.last_name.trim() || "Envol Africa",
    phone: cleanPhone,
  };

  if (params.redirect_url) payload.redirect_url = params.redirect_url;
  if (params.customer_ip) payload.customer_ip = params.customer_ip;
  if (params.discount_code) payload.discount_code = params.discount_code.trim();
  if (params.payment_currency) payload.payment_currency = params.payment_currency.toUpperCase();
  if (params.custom_metadata) {
    // Chariow limite à 10 clés de 255 caractères max
    const sanitizedMetadata: Record<string, string> = {};
    Object.entries(params.custom_metadata).slice(0, 10).forEach(([k, v]) => {
      sanitizedMetadata[k.slice(0, 40)] = String(v).slice(0, 255);
    });
    payload.custom_metadata = sanitizedMetadata;
  }

  try {
    const response = await fetch(`${CHARIOW_API_BASE}/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.data) {
      const errorMsg =
        result?.message ||
        (result?.errors ? JSON.stringify(result.errors) : `Erreur HTTP ${response.status}`);
      return {
        ok: false,
        error: `Échec Chariow Checkout: ${errorMsg}`,
      };
    }

    const data = result.data;
    return {
      ok: true,
      step: data.step,
      checkout_url: data.payment?.checkout_url || null,
      sale_id: data.purchase?.id || null,
      message: data.message || undefined,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Erreur de connexion à l'API Chariow.",
    };
  }
}

/**
 * Vérifie mathématiquement la signature HMAC-SHA256 envoyée par Chariow Pulse.
 * Règle impérative de sécurité : calculée sur les octets bruts (raw buffer).
 */
export function verifyPulseSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null
): boolean {
  const signingSecret = process.env.CHARIOW_PULSE_SIGNING_SECRET;
  if (!signingSecret || !signatureHeader) {
    return false;
  }

  // Format attendu: sha256=<64 caractères hex>
  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const receivedDigest = parts[1].toLowerCase().trim();

  const computedDigest = crypto
    .createHmac("sha256", signingSecret)
    .update(typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody)
    .digest("hex")
    .toLowerCase();

  try {
    const a = Buffer.from(receivedDigest, "hex");
    const b = Buffer.from(computedDigest, "hex");

    if (a.length !== b.length || a.length !== 32) {
      return false;
    }

    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
