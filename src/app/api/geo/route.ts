import { NextRequest, NextResponse } from "next/server";
import { getCountryInfo, getSupportedLanguageForCountry } from "@/lib/country-data";
import { normalizeCurrency } from "@/lib/currency";
import { normalizeLanguage } from "@/lib/i18n";

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

  // 1. Détermination automatique par défaut pour le pays (autodétection au premier chargement)
  const acceptLangHeader = request.headers.get("accept-language");
  const autoLanguage = getSupportedLanguageForCountry(country, acceptLangHeader);
  const autoCurrency = normalizeCurrency(country.currency, "XOF");

  // 2. Détection du choix manuel antérieur de l'utilisateur (via cookies)
  // RÈGLE ABSOLUE : Le choix manuel de l'utilisateur prend le dessus sur l'autodétection
  const manualLangCookie = request.cookies.get("ea_manual_language")?.value;
  const isLanguageManual = Boolean(manualLangCookie);
  const finalLanguage = isLanguageManual ? normalizeLanguage(manualLangCookie) : autoLanguage;

  const manualCurrCookie = request.cookies.get("ea_manual_currency")?.value;
  const isCurrencyManual = Boolean(manualCurrCookie);
  const finalCurrency = isCurrencyManual ? normalizeCurrency(manualCurrCookie) : autoCurrency;

  return NextResponse.json(
    {
      country: country.name,
      countryCode: country.code,
      city: city ? decodeURIComponent(city) : null,
      language: finalLanguage,
      currency: finalCurrency,
      languageSource: isLanguageManual ? "manual" : "auto",
      currencySource: isCurrencyManual ? "manual" : "auto",
      countrySource: "auto",
      isManual: isLanguageManual || isCurrencyManual,
      source: testCountry ? "simulation" : request.headers.get("x-vercel-ip-country") ? "vercel" : "fallback",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
