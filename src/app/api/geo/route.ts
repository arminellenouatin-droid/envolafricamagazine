import { NextRequest, NextResponse } from "next/server";
import { getCountryInfo } from "@/lib/country-data";
import { languageFromHeader } from "@/lib/africa-context";

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

  // Détermination de la langue selon le pays :
  // Si le pays a une langue attitrée (ex: US -> en, NG -> en, ES -> es, FR -> fr, BJ -> fr), on l'applique.
  // Si le pays a plusieurs langues officielles (ex: Canada en/fr, Cameroun fr/en), on vérifie l'affinité du navigateur.
  const acceptLangHeader = request.headers.get("accept-language");
  const browserLangs = (acceptLangHeader || "")
    .split(",")
    .map((item) => item.split(";")[0].trim().split("-")[0].toLowerCase());

  let language = country.languages[0] || "fr";
  if (country.languages.length > 1) {
    const matched = country.languages.find((l) => browserLangs.includes(l));
    if (matched) language = matched;
  }

  return NextResponse.json(
    {
      country: country.name,
      countryCode: country.code,
      city: city ? decodeURIComponent(city) : null,
      language,
      currency: country.currency,
      source: testCountry ? "simulation" : request.headers.get("x-vercel-ip-country") ? "vercel" : "fallback",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

