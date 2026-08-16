import { NextRequest, NextResponse } from "next/server";
import { getAfricaCountry, languageFromHeader } from "@/lib/africa-context";

export function GET(request: NextRequest) {
 const countryCode = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || request.cookies.get("ea_country")?.value || "BJ";
 const country = getAfricaCountry(countryCode) ?? getAfricaCountry("BJ")!;
 const city = request.headers.get("x-vercel-ip-city") || request.cookies.get("ea_city")?.value || "";
 const language = languageFromHeader(request.headers.get("accept-language"), country.languages[0] || "fr");
 return NextResponse.json({ country: country.name, countryCode: country.code, city: city ? decodeURIComponent(city) : null, language, currency: country.currency, source: request.headers.get("x-vercel-ip-country") ? "vercel" : "fallback" }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
