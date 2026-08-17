const MONEROO_API_KEY = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_API_KEY;
const MONEROO_BASE = "https://api.moneroo.io/v1";

export interface MonerooPaymentData {
  amount: number;
  currency: string;
  description: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
        phone?: string;
    country?: string;
  };
  return_url: string;
  methods?: string[];
  restrict_country_code?: string;
  metadata?: Record<string, unknown>;
}

export class MonerooNotConfiguredError extends Error {
  constructor() {
    super("MONEROO_API_KEY n’est pas configurée");
    this.name = "MonerooNotConfiguredError";
  }
}

function getApiKey(): string | null {
  if (!MONEROO_API_KEY) {
    if (process.env.NODE_ENV === "production") throw new MonerooNotConfiguredError();
    console.warn("MONEROO_API_KEY manquant - mode mock activé hors production");
    return null;
  }
  return MONEROO_API_KEY;
}

export async function initMonerooPayment(data: MonerooPaymentData) {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Mode mock si clé manquante (dev only)
    return {
      id: `mock_${Date.now()}`,
      checkout_url: `${data.return_url}${data.return_url.includes("?") ? "&" : "?"}mock_success=1&payment_id=mock_${Date.now()}`,
      mock: true,
      warning: "MONEROO_API_KEY manquant - paiement mock",
    };
  }
  try {
    const res = await fetch(`${MONEROO_BASE}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        customer: data.customer,
        return_url: data.return_url,
        ...(data.methods && data.methods.length > 0 ? { methods: data.methods } : {}),
        ...(data.restrict_country_code ? { restrict_country_code: data.restrict_country_code } : {}),
        metadata: data.metadata,
      }),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("Moneroo init failed", result);
      // En cas d'échec API, fallback mock uniquement en dev
      if (process.env.NODE_ENV !== 'production') {
        return {
          id: `mock_${Date.now()}`,
          checkout_url: `${data.return_url}${data.return_url.includes("?") ? "&" : "?"}mock_success=1&payment_id=mock_${Date.now()}`,
          mock: true,
          raw: result,
        };
      }
      throw new Error(result.message || "Erreur Moneroo");
    }
    const d = result.data || result;
    return {
      id: d.id,
      checkout_url: d.checkout_url,
      mock: false,
      raw: result,
    };
  } catch (e) {
    console.error("Moneroo exception", e);
    if (process.env.NODE_ENV !== 'production') {
      return {
        id: `mock_${Date.now()}`,
        checkout_url: `${data.return_url}${data.return_url.includes("?") ? "&" : "?"}mock_success=1&payment_id=mock_${Date.now()}`,
        mock: true,
        error: String(e),
      };
    }
    throw e;
  }
}

export async function verifyMonerooPayment(paymentId: string) {
  if (paymentId.startsWith("mock_")) {
    if (process.env.NODE_ENV === "production") return { status: "failed", error: "Paiement mock interdit en production", id: paymentId };
    return { status: "success", amount: 0, mock: true, id: paymentId };
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    return { status: "failed", error: "MONEROO_API_KEY manquant" };
  }
  try {
    const res = await fetch(`${MONEROO_BASE}/payments/${paymentId}/verify`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("Verify failed", result);
      return { status: "failed", raw: result };
    }
    const payment = result.data || result;
    const rawCurrency = payment.currency;
    const currencyCode = typeof rawCurrency === "string"
      ? rawCurrency.toUpperCase()
      : rawCurrency && typeof rawCurrency === "object" && typeof rawCurrency.code === "string"
        ? rawCurrency.code.toUpperCase()
        : undefined;
    return {
      ...payment,
      status: typeof payment.status === "string" ? payment.status.toLowerCase() : payment.status,
      amount: typeof payment.amount === "number" ? payment.amount : Number(payment.amount),
      currency: currencyCode,
    };
  } catch (e) {
    console.error("Verify exception", e);
    return { status: "failed", error: String(e) };
  }
}

export function formatAmountForCurrency(amountXOF: number, targetCurrency: string, rates: Record<string, number>): number {
  const rate = rates[targetCurrency] || 1;
  if (targetCurrency === "XOF") return amountXOF;
  return Math.round(amountXOF * rate);
}
