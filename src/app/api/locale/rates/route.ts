import { NextResponse } from "next/server";
import { BASE_CURRENCY, SUPPORTED_CURRENCIES, type CurrencyRates } from "@/lib/currency";

let cache: { fetchedAt: number; rates: CurrencyRates } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ base: BASE_CURRENCY, rates: cache.rates, fetchedAt: cache.fetchedAt, cached: true });
  }
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`, { next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "Taux indisponibles" }, { status: 503 });
    const payload = await response.json() as { result?: string; rates?: Record<string, number> };
    if (payload.result !== "success" || !payload.rates) return NextResponse.json({ error: "Réponse de taux invalide" }, { status: 503 });
    const rates = Object.fromEntries(SUPPORTED_CURRENCIES.map((currency) => [currency, currency === BASE_CURRENCY ? 1 : Number(payload.rates?.[currency])]).filter(([, rate]) => Number.isFinite(rate) && Number(rate) > 0)) as CurrencyRates;
    cache = { fetchedAt: Date.now(), rates };
    return NextResponse.json({ base: BASE_CURRENCY, rates, fetchedAt: cache.fetchedAt, cached: false }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Impossible de récupérer les taux" }, { status: 503 });
  }
}
