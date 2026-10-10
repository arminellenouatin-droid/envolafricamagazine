import { NextRequest, NextResponse } from "next/server";

// Cache mémoire en secondes pour préserver les quotas et assurer une réponse en < 15ms
type CachedWeather = {
  data: {
    city: string;
    temp: string;
    icon: string;
    description: string;
    countryCode?: string;
  };
  expiresAt: number;
};

const weatherMemoryCache = new Map<string, CachedWeather>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

// Coordonnées de référence pour les principales capitales et villes
const CITY_COORDINATES: Record<string, { lat: number; lon: number; city: string; country: string }> = {
  BJ: { lat: 6.3703, lon: 2.3912, city: "Cotonou", country: "Bénin" },
  CI: { lat: 5.3599, lon: -4.0083, city: "Abidjan", country: "Côte d'Ivoire" },
  SN: { lat: 14.7167, lon: -17.4677, city: "Dakar", country: "Sénégal" },
  CM: { lat: 4.0511, lon: 9.7679, city: "Douala", country: "Cameroun" },
  TG: { lat: 6.1375, lon: 1.2125, city: "Lomé", country: "Togo" },
  ML: { lat: 12.6392, lon: -8.0029, city: "Bamako", country: "Mali" },
  BF: { lat: 12.3714, lon: -1.5197, city: "Ouagadougou", country: "Burkina Faso" },
  NE: { lat: 13.5116, lon: 2.1254, city: "Niamey", country: "Niger" },
  GN: { lat: 9.5092, lon: -13.7122, city: "Conakry", country: "Guinée" },
  GA: { lat: 0.4162, lon: 9.4673, city: "Libreville", country: "Gabon" },
  CD: { lat: -4.4419, lon: 15.2663, city: "Kinshasa", country: "RDC" },
  CG: { lat: -4.2634, lon: 15.2429, city: "Brazzaville", country: "Congo" },
  NG: { lat: 6.5244, lon: 3.3792, city: "Lagos", country: "Nigeria" },
  GH: { lat: 5.6037, lon: -0.1870, city: "Accra", country: "Ghana" },
  RW: { lat: -1.9441, lon: 30.0619, city: "Kigali", country: "Rwanda" },
  MA: { lat: 33.5731, lon: -7.5898, city: "Casablanca", country: "Maroc" },
  TN: { lat: 36.8065, lon: 10.1815, city: "Tunis", country: "Tunisie" },
  FR: { lat: 48.8566, lon: 2.3522, city: "Paris", country: "France" },
  US: { lat: 40.7128, lon: -74.0060, city: "New York", country: "États-Unis" },
  CA: { lat: 45.5017, lon: -73.5673, city: "Montréal", country: "Canada" },
};

function getWeatherMeta(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: "☀️", description: "Ensoleillé" };
  if (code === 1 || code === 2) return { icon: "⛅", description: "Partiellement nuageux" };
  if (code === 3) return { icon: "☁️", description: "Couvert" };
  if (code === 45 || code === 48) return { icon: "🌫️", description: "Brume" };
  if (code >= 51 && code <= 55) return { icon: "🌦️", description: "Bruine légère" };
  if (code >= 61 && code <= 67) return { icon: "🌧️", description: "Pluie" };
  if (code >= 71 && code <= 77) return { icon: "🌨️", description: "Neige" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", description: "Averses" };
  if (code >= 95) return { icon: "⛈️", description: "Orages" };
  return { icon: "⛅", description: "Variable" };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedCity = searchParams.get("city");
    const requestedLat = searchParams.get("lat");
    const requestedLon = searchParams.get("lon");

    // Détection via en-têtes d'infrastructure (Vercel / Cloudflare)
    const headerCountry = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "BJ";
    const headerCity = request.headers.get("x-vercel-ip-city");
    const headerLat = request.headers.get("x-vercel-ip-latitude");
    const headerLon = request.headers.get("x-vercel-ip-longitude");

    const countryCode = (headerCountry || "BJ").toUpperCase();
    const cityPreset = CITY_COORDINATES[countryCode] || CITY_COORDINATES.BJ;

    let latitude = requestedLat ? parseFloat(requestedLat) : (headerLat ? parseFloat(headerLat) : cityPreset.lat);
    let longitude = requestedLon ? parseFloat(requestedLon) : (headerLon ? parseFloat(headerLon) : cityPreset.lon);
    let resolvedCity = requestedCity || (headerCity ? decodeURIComponent(headerCity) : cityPreset.city);

    if (isNaN(latitude) || isNaN(longitude)) {
      latitude = cityPreset.lat;
      longitude = cityPreset.lon;
    }

    const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const now = Date.now();
    const cached = weatherMemoryCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return NextResponse.json({
        ...cached.data,
        city: resolvedCity || cached.data.city,
      }, {
        headers: {
          "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
        },
      });
    }

    // Appel sécurisé à Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;
    const openMeteoRes = await fetch(url, {
      next: { revalidate: 1200 }, // 20 minutes
    });

    if (openMeteoRes.ok) {
      const weatherJson = await openMeteoRes.json();
      const current = weatherJson.current || {};
      const temperature = typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : 28;
      const weatherCode = typeof current.weather_code === "number" ? current.weather_code : 1;
      const meta = getWeatherMeta(weatherCode);

      const payload = {
        city: resolvedCity,
        temp: `${temperature}°C`,
        icon: meta.icon,
        description: meta.description,
        countryCode,
      };

      weatherMemoryCache.set(cacheKey, {
        data: payload,
        expiresAt: now + CACHE_TTL_MS,
      });

      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, max-age=900, stale-while-revalidate=1800",
        },
      });
    }

    // Fallback gracieux si Open-Meteo est indisponible
    return NextResponse.json({
      city: resolvedCity,
      temp: "28°C",
      icon: "⛅",
      description: "Agréable",
      countryCode,
    });
  } catch (err) {
    return NextResponse.json({
      city: "Cotonou",
      temp: "28°C",
      icon: "⛅",
      description: "Agréable",
      countryCode: "BJ",
    });
  }
}
