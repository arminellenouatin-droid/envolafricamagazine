const MONEROO_API_KEY = process.env.MONEROO_API_KEY;
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
  };
  return_url: string;
  methods?: string[];
  metadata?: Record<string, any>;
}

function getApiKey(): string | null {
  if (!MONEROO_API_KEY) {
    console.warn("MONEROO_API_KEY manquant - mode mock activé pour dev");
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
      checkout_url: `${data.return_url}?mock_success=1&payment_id=mock_${Date.now()}`,
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
        methods: data.methods || ["card", "mtn_bj", "orange_bj", "moov_bj", "mtn_ci", "orange_ci", "wave", "mtn", "orange_sn"],
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
          checkout_url: `${data.return_url}?mock_success=1&payment_id=mock_${Date.now()}`,
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
        checkout_url: `${data.return_url}?mock_success=1&payment_id=mock_${Date.now()}`,
        mock: true,
        error: String(e),
      };
    }
    throw e;
  }
}

export async function verifyMonerooPayment(paymentId: string) {
  if (paymentId.startsWith("mock_")) {
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
    return result.data || result;
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
