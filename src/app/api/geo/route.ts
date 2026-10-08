import { NextRequest, NextResponse } from "next/server";
import { getCountryInfo, getSupportedLanguageForCountry } from "@/lib/country-data";
import { normalizeCurrency } from "@/lib/currency";

export function GET(request: NextRequest) {
  const testCountry =
    request.nextUrl.searchParams.get("test_country") ||
    request.nextUrl.searchParams.get("country") ||
    request.headers.get("x-test-country");

  const countryCode =
    testCountry ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.cookies.get("ea_country")?.value ||
    "BJ";

  const country = getCountryInfo(countryCode);
  const city = request.headers.get("x-vercel-ip-city") || request.cookies.get("ea_city")?.value || "";

  // Détermination déterministe de la langue supportée (fr, en, es, pt, ar, sw)
  const acceptLangHeader = request.headers.get("accept-language");
  const language = getSupportedLanguageForCountry(country, acceptLangHeader);
  const currency = normalizeCurrency(country.currency, "XOF");

  return NextResponse.json(
    {
      country: country.name,
      countryCode: country.code,
      city: city ? decodeURIComponent(city) : null,
      language,
      currency,
      source: testCountry ? "simulation" : request.headers.get("x-vercel-ip-country") ? "vercel" : "fallback",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

