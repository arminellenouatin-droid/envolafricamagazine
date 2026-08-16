import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readJobsDB, writeJobsDB } from "@/lib/jobs-db";
import { listJobsCandidates, upsertJobsCandidateInSupabase } from "@/lib/jobs-supabase";

type SupabaseCandidateRow = { id: string; first_name: string; last_name: string; photo_url: string | null; cv_path: string | null; contact_email: string; contact_phone: string | null; description: string; skills: string[]; desired_role: string; country_name: string; city: string; availability: string; status: string; is_boosted: boolean; views_count: number; created_at: string; };
type CandidateProfileLike = { status: string; desiredRole: string; description: string; skills: string[]; country: string; city: string; availability: string; isBoosted: boolean; createdAt: string; };
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").toLocaleLowerCase();
  const country = searchParams.get("country") ?? "";
  const city = searchParams.get("city") ?? "";
  const availability = searchParams.get("availability") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") ?? "8")));
  
  const database = readJobsDB();
  const supabaseRes = await listJobsCandidates();
  
  const sourceCandidates = supabaseRes.candidates 
    ? supabaseRes.candidates.map((cand: SupabaseCandidateRow) => ({
        id: cand.id,
        firstName: cand.first_name,
        lastName: cand.last_name,
        photo: cand.photo_url || undefined,
        cvUrl: cand.cv_path || undefined,
        contactEmail: cand.contact_email,
        contactPhone: cand.contact_phone || undefined,
        description: cand.description,
        skills: cand.skills || [],
        desiredRole: cand.desired_role,
        country: cand.country_name,
        city: cand.city,
        availability: cand.availability,
        status: cand.status,
        isBoosted: cand.is_boosted,
        views: cand.views_count,
        createdAt: cand.created_at
      }))
    : database.candidates;

  const candidates = sourceCandidates
    .filter((candidate: CandidateProfileLike) => candidate.status === "published")
    .filter((candidate: CandidateProfileLike) => !query || `${candidate.desiredRole} ${candidate.description} ${candidate.skills.join(" ")}`.toLocaleLowerCase().includes(query))
    .filter((candidate: CandidateProfileLike) => !country || candidate.country === country)
    .filter((candidate: CandidateProfileLike) => !city || candidate.city.toLocaleLowerCase() === city.toLocaleLowerCase())
    .filter((candidate: CandidateProfileLike) => !availability || candidate.availability === availability)
    .sort((a: CandidateProfileLike, b: CandidateProfileLike) => Number(b.isBoosted) - Number(a.isBoosted) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    
  const start = (page - 1) * limit;
  return NextResponse.json({ candidates: candidates.slice(start, start + limit), pagination: { page, total: candidates.length, hasMore: start + limit < candidates.length } });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour publier une candidature." }, { status: 401 });
  const payload = await request.json();
  const required = ["firstName", "lastName", "contactEmail", "description", "desiredRole", "country", "city", "availability"];
  const missing = required.find((key) => typeof payload[key] !== "string" || !payload[key].trim());
  if (missing) return NextResponse.json({ error: `Champ obligatoire : ${missing}` }, { status: 400 });
  const input = { userId: user.id, firstName: payload.firstName.trim(), lastName: payload.lastName.trim(), contactEmail: payload.contactEmail.trim(), contactPhone: payload.contactPhone?.trim(), description: payload.description.trim(), skills: Array.isArray(payload.skills) ? payload.skills.filter((skill: unknown) => typeof skill === "string").slice(0, 15) : [], desiredRole: payload.desiredRole.trim(), country: payload.country.trim(), city: payload.city.trim(), availability: payload.availability.trim(), cvPath: payload.cvUrl?.trim() };
  const persisted = await upsertJobsCandidateInSupabase(input);
  if (persisted.configured) {
    if (!persisted.candidate) return NextResponse.json({ error: "Impossible dâ€™enregistrer cette candidature dans la base sÃ©curisÃ©e." }, { status: 503 });
    return NextResponse.json({ candidate: persisted.candidate }, { status: 201 });
  }
  const database = readJobsDB();
  const candidate = { id: uuid(), firstName: payload.firstName.trim(), lastName: payload.lastName.trim(), photo: payload.photo?.trim(), cvUrl: payload.cvUrl?.trim(), contactEmail: payload.contactEmail.trim(), contactPhone: payload.contactPhone?.trim(), description: payload.description.trim(), skills: Array.isArray(payload.skills) ? payload.skills.filter((skill: unknown) => typeof skill === "string").slice(0, 15) : [], desiredRole: payload.desiredRole.trim(), country: payload.country.trim(), city: payload.city.trim(), availability: payload.availability.trim(), status: "published" as const, isBoosted: false, views: 0, createdAt: new Date().toISOString(), createdBy: user.id };
  database.candidates = database.candidates.filter((item) => item.createdBy !== user.id);
  database.candidates.unshift(candidate);
  writeJobsDB(database);
  return NextResponse.json({ candidate }, { status: 201 });
}
