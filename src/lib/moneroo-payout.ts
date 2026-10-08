/**
 * Service centralisé Moneroo Payout (Décaissement et Remboursements Externes).
 *
 * Implémente :
 * - POST /v1/payouts/initialize
 * - GET /v1/payouts/{id}/verify
 * - Catalogue dynamique des méthodes autorisées en payout par pays.
 *
 * ATTENTION RÈGLE FINANCIÈRE :
 * Pour le Bénin (BJ/XOF), le catalogue Payout de Moneroo autorise exclusivement :
 * - MTN MoMo Bénin (mtn_bj)
 * - Moov Money Bénin (moov_bj)
 * Celtiis (celtiis_bj) N'EST PAS disponible en Payout Moneroo à ce jour.
 * Tout remboursement pour un client ayant payé par Celtiis doit être orienté
 * prioritairement vers le Portefeuille Central Envol Africa ou traité manuellement.
 */

const MONEROO_API_KEY = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_API_KEY;
const MONEROO_BASE = "https://api.moneroo.io/v1";

export interface MonerooPayoutRecipient {
  phone?: string;
  account_number?: string;
  account_holder?: string;
  country?: string;
  email?: string;
  [key: string]: unknown;
}

export interface MonerooPayoutData {
  amount: number;
  currency: string;
  method: string;
  description: string;
  recipient: MonerooPayoutRecipient;
  customer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface MonerooPayoutResult {
  id: string;
  status: "pending" | "processing" | "success" | "failed" | "cancelled";
  amount: number;
  currency: string;
  method: string;
  mock?: boolean;
  raw?: unknown;
  error?: string;
}

export class MonerooPayoutNotConfiguredError extends Error {
  constructor() {
    super("MONEROO_SECRET_KEY n’est pas configurée pour les décaissements");
    this.name = "MonerooPayoutNotConfiguredError";
  }
}

export class UnsupportedPayoutMethodError extends Error {
  constructor(method: string, country: string) {
    super(
      `La méthode de payout '${method}' n'est pas prise en charge par Moneroo pour le pays '${country}'. ` +
      `Pour le Bénin, seules 'mtn_bj' et 'moov_bj' sont disponibles. Celtiis Cash doit être remboursé via le Portefeuille Central.`
    );
    this.name = "UnsupportedPayoutMethodError";
  }
}

function getApiKey(): string | null {
  if (!MONEROO_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new MonerooPayoutNotConfiguredError();
    console.warn("MONEROO_SECRET_KEY manquant - payout en mode mock (dev/test)");
    return null;
  }
  return MONEROO_API_KEY;
}

/**
 * Catalogue des méthodes de Payout officiellement supportées par Moneroo par pays.
 */
export function getMonerooPayoutMethods(countryCode: string, currency: string): string[] {
  const c = countryCode.toUpperCase();
  const cur = currency.toUpperCase();

  if (cur === "XOF") {
    if (c === "BJ") return ["mtn_bj", "moov_bj"]; // Celtiis NON supporté en Payout Moneroo
    if (c === "CI") return ["mtn_ci", "orange_ci", "moov_ci", "wave_ci"];
    if (c === "SN") return ["orange_sn", "wave_sn", "free_sn"];
    return ["mtn_bj", "moov_bj"];
  }

  return [];
}

export function isPayoutMethodSupported(method: string, countryCode: string, currency: string): boolean {
  const supported = getMonerooPayoutMethods(countryCode, currency);
  return supported.includes(method.toLowerCase());
}

/**
 * Initialise un décaissement (Payout) via l'API Moneroo.
 */
export async function initMonerooPayout(data: MonerooPayoutData): Promise<MonerooPayoutResult> {
  const country = String(data.recipient.country || "BJ").toUpperCase();

  // Validation méthode payout
  if (!isPayoutMethodSupported(data.method, country, data.currency)) {
    throw new UnsupportedPayoutMethodError(data.method, country);
  }

  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error("Montant de payout invalide");
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    // Mode mock si clé absente hors production
    return {
      id: `payout_mock_${Date.now()}`,
      status: "pending",
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      method: data.method,
      mock: true,
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  if (data.idempotencyKey) {
    headers["Idempotency-Key"] = data.idempotencyKey;
  }

  try {
    const res = await fetch(`${MONEROO_BASE}/payouts/initialize`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        description: data.description,
        method: data.method,
        recipient: data.recipient,
        customer: data.customer,
        metadata: data.metadata,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Moneroo payout init failed", result);
      if (process.env.NODE_ENV !== "production") {
        return {
          id: `payout_mock_${Date.now()}`,
          status: "pending",
          amount: data.amount,
          currency: data.currency.toUpperCase(),
          method: data.method,
          mock: true,
          raw: result,
        };
      }
      throw new Error(result.message || "Échec de l'initialisation du décaissement Moneroo");
    }

    const d = result.data || result;
    return {
      id: d.id,
      status: (d.status?.toLowerCase() as MonerooPayoutResult["status"]) || "pending",
      amount: Number(d.amount ?? data.amount),
      currency: String(d.currency ?? data.currency).toUpperCase(),
      method: data.method,
      raw: result,
    };
  } catch (e) {
    console.error("Moneroo payout init exception", e);
    if (process.env.NODE_ENV !== "production") {
      return {
        id: `payout_mock_${Date.now()}`,
        status: "pending",
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        method: data.method,
        mock: true,
        error: String(e),
      };
    }
    throw e;
  }
}

/**
 * Vérifie l'état d'un décaissement Moneroo existant.
 */
export async function verifyMonerooPayout(payoutId: string): Promise<MonerooPayoutResult> {
  if (payoutId.startsWith("payout_mock_")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Décaissement mock interdit en production");
    }
    return {
      id: payoutId,
      status: "success",
      amount: 1000,
      currency: "XOF",
      method: "mtn_bj",
      mock: true,
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new MonerooPayoutNotConfiguredError();
  }

  try {
    const res = await fetch(`${MONEROO_BASE}/payouts/${payoutId}/verify`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Moneroo verify payout failed", result);
      return {
        id: payoutId,
        status: "failed",
        amount: 0,
        currency: "XOF",
        method: "unknown",
        raw: result,
        error: result.message || "Erreur vérification payout",
      };
    }

    const d = result.data || result;
    const rawStatus = typeof d.status === "string" ? d.status.toLowerCase() : "pending";
    let status: MonerooPayoutResult["status"] = "pending";
    if (["success", "successful", "completed", "paid"].includes(rawStatus)) {
      status = "success";
    } else if (["failed", "rejected", "error"].includes(rawStatus)) {
      status = "failed";
    } else if (["cancelled", "canceled"].includes(rawStatus)) {
      status = "cancelled";
    } else if (["processing", "in_progress"].includes(rawStatus)) {
      status = "processing";
    }

    return {
      id: String(d.id || payoutId),
      status,
      amount: Number(d.amount || 0),
      currency: String(d.currency?.code || d.currency || "XOF").toUpperCase(),
      method: String(d.method || ""),
      raw: result,
    };
  } catch (e) {
    console.error("Moneroo payout verify exception", e);
    return {
      id: payoutId,
      status: "failed",
      amount: 0,
      currency: "XOF",
      method: "unknown",
      error: String(e),
    };
  }
}
