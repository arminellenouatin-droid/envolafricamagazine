import { NextRequest, NextResponse } from "next/server";

const MONEROO_API_KEY = process.env.MONEROO_SECRET_KEY || process.env.MONEROO_API_KEY;
const MONEROO_METHODS_URL = "https://api.moneroo.io/v1/utils/payment/methods";

export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get("country") || "BJ").toUpperCase();
  const currency = (request.nextUrl.searchParams.get("currency") || "XOF").toUpperCase();

  if (!MONEROO_API_KEY) {
    return NextResponse.json({ methods: [], source: "fallback" });
  }

  try {
    const response = await fetch(MONEROO_METHODS_URL, {
      headers: { Authorization: `Bearer ${MONEROO_API_KEY}`, Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return NextResponse.json({ methods: [], source: "moneroo-error" }, { status: 200 });

    const payload = await response.json();
    const candidates = Array.isArray(payload) ? payload : Array.isArray(payload.data) ? payload.data : Array.isArray(payload.methods) ? payload.methods : [];
    const methods = candidates.filter((method: Record<string, unknown>) => {
      const methodCurrency = String(method.currency ?? method.currency_code ?? "").toUpperCase();
      const countries = Array.isArray(method.countries) ? method.countries.map(String).map((value) => value.toUpperCase()) : [];
      return methodCurrency === currency && (countries.length === 0 || countries.includes(country));
    }).map((method: Record<string, unknown>) => ({
      code: String(method.code ?? method.slug ?? method.id ?? ""),
      label: String(method.name ?? method.label ?? method.title ?? method.code ?? ""),
      logo: typeof method.logo === "string" ? method.logo : typeof method.logo_url === "string" ? method.logo_url : undefined,
      icon: typeof method.icon === "string" ? method.icon : undefined,
    })).filter((method: { code: string }) => method.code);

    return NextResponse.json({ methods, source: "moneroo", country, currency }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ methods: [], source: "moneroo-error" }, { status: 200 });
  }
}
