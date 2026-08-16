import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { createOffer, readJobsDB } from "@/lib/jobs-db";
import { createJobsOfferInSupabase, listPublishedJobsOffers } from "@/lib/jobs-supabase";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") ?? "8")));
  const query = normalize(searchParams.get("q") ?? "");
  const country = searchParams.get("country") ?? "";
  const city = searchParams.get("city") ?? "";
  const sector = searchParams.get("sector") ?? "";
  const interests = (searchParams.get("interests") ?? "").split(",").map(normalize).filter(Boolean).slice(0, 10);
  const database = readJobsDB();
  const supabaseOffers = await listPublishedJobsOffers();
  // En environnement avec migration Supabase appliquée, la base est prioritaire.
  // Le fallback JSON reste temporairement utile au développement local et à la recette avant migration.
  const sourceOffers = supabaseOffers.offers ?? database.offers
    .filter((offer) => offer.status === "published")
    .map(({ id, title, description, country, city, sector, contractType, salary, skills, publishedAt, expiresAt, isBoosted, views, applications }) => ({ id, title, description, country, city, sector, contractType, salary, skills, publishedAt, expiresAt, isBoosted, views, applications }));

  const filtered = sourceOffers
    .filter((offer) => !query || normalize(`${offer.title} ${offer.description} ${offer.sector} ${offer.skills.join(" ")}`).includes(query))
    .filter((offer) => !country || offer.country === country)
    .filter((offer) => !sector || offer.sector === sector)
    .sort((a, b) => {
      const score = (offer: typeof a) => {
        const searchable = normalize(`${offer.title} ${offer.description} ${offer.sector} ${offer.skills.join(" ")}`);
        const interestScore = interests.reduce((total, interest) => total + (searchable.includes(interest) ? 12 : 0), 0);
        return (offer.isBoosted ? 100 : 0) + (city && offer.city === city ? 30 : 0) + (country && offer.country === country ? 15 : 0) + interestScore + Date.parse(offer.publishedAt) / 1e12;
      };
      return score(b) - score(a);
    });

  const start = (page - 1) * limit;
  const offers = filtered.slice(start, start + limit);
  return NextResponse.json({ offers, pagination: { page, limit, total: filtered.length, hasMore: start + limit < filtered.length } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour publier une offre." }, { status: 401 });
  const payload = await request.json();
  const required = ["title", "description", "companyName", "contactEmail", "country", "city", "sector", "contractType", "expiresAt"];
  const missing = required.find((key) => typeof payload[key] !== "string" || !payload[key].trim());
  if (missing) return NextResponse.json({ error: `Champ obligatoire : ${missing}` }, { status: 400 });

  const input = {
    userId: user.id, title: payload.title.trim(), description: payload.description.trim(), companyName: payload.companyName.trim(), companyLogo: payload.companyLogo?.trim(),
    contactEmail: payload.contactEmail.trim(), contactPhone: payload.contactPhone?.trim(), address: payload.address?.trim(), country: payload.country.trim(), city: payload.city.trim(),
    region: payload.region?.trim(), sector: payload.sector.trim(), contractType: payload.contractType, salary: payload.salary?.trim(),
    skills: Array.isArray(payload.skills) ? payload.skills.filter((skill: unknown) => typeof skill === "string").slice(0, 15) : [], expiresAt: payload.expiresAt,
  } as const;

  const persisted = await createJobsOfferInSupabase(input);
  if (persisted.configured) {
    if (persisted.quotaReached) return NextResponse.json({ error: "Vos deux publications gratuites ont été utilisées. Choisissez un accès entreprise pour continuer." }, { status: 402 });
    if (!persisted.offer) return NextResponse.json({ error: "Impossible d’enregistrer cette offre dans la base sécurisée." }, { status: 503 });
    return NextResponse.json({ offer: persisted.offer }, { status: 201 });
  }

  // Fallback de développement uniquement, jusqu’à application de la migration Supabase Jobs.
  const database = readJobsDB();
  const publishedByEmployer = database.offers.filter((offer) => offer.createdBy === user.id).length;
  const activeEmployerAccess = database.subscriptions.some((subscription) => subscription.userId === user.id && subscription.audience === "employer" && subscription.status === "active" && (!subscription.endsAt || new Date(subscription.endsAt) > new Date()));
  if (publishedByEmployer >= 2 && !activeEmployerAccess) return NextResponse.json({ error: "Vos deux publications gratuites ont été utilisées. Choisissez un accès entreprise pour continuer." }, { status: 402 });
  const offer = createOffer(input);
  return NextResponse.json({ offer }, { status: 201 });
}
