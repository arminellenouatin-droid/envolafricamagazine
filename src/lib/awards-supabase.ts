import { getSupabaseAdmin, isProductionRuntime } from "@/lib/supabase-admin";
import type { AwardsCandidate, AwardsCompetition } from "@/lib/awards-db";

function mapCompetition(row: Record<string, unknown>): AwardsCompetition {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: typeof row.description === "string" ? row.description : "",
    category: typeof row.category === "string" ? row.category : "Awards",
    category_id: typeof row.category_id === "string" ? row.category_id : undefined,
    status: String(row.status) as AwardsCompetition["status"],
    vote_price_cents: Number(row.vote_price_cents ?? 0),
    points_per_vote: Number(row.points_per_vote ?? 1),
    jury_weight: Number(row.jury_weight ?? 0),
    public_vote_weight: Number(row.public_vote_weight ?? 100),
    cover_image: typeof row.legacy_cover_image === "string" ? row.legacy_cover_image : undefined,
    organizer_org_id: typeof row.organizer_org_id === "string" ? row.organizer_org_id : undefined,
    created_by: String(row.created_by),
    created_at: String(row.created_at ?? new Date().toISOString()),
    starts_at: typeof row.starts_at === "string" ? row.starts_at : undefined,
    ends_at: typeof row.ends_at === "string" ? row.ends_at : undefined,
    candidates_count: Number(row.legacy_candidates_count ?? 0),
    votes_count: Number(row.legacy_votes_count ?? 0),
    pot_amount_cents: Number(row.legacy_pot_amount_cents ?? 0),
  };
}

function mapCandidate(row: Record<string, unknown>): AwardsCandidate {
  return {
    id: String(row.id),
    competition_id: String(row.competition_id),
    display_name: String(row.display_name),
    bio: typeof row.bio === "string" ? row.bio : undefined,
    country: typeof row.country === "string" ? row.country : undefined,
    photo_url: typeof row.photo_url === "string" ? row.photo_url : undefined,
    video_url: typeof row.video_url === "string" ? row.video_url : undefined,
    project_description: typeof row.project_description === "string" ? row.project_description : undefined,
    status: String(row.status ?? "pending") as AwardsCandidate["status"],
    votes: Number(row.legacy_votes_count ?? 0),
    gifts: Number(row.legacy_gifts_count ?? 0),
    donations: Number(row.legacy_donations_cents ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export function awardsSupabaseConfigured() {
  return Boolean(getSupabaseAdmin());
}

export async function getSupabaseCompetitions(filters?: { slug?: string | null; status?: string | null }) {
  const client = getSupabaseAdmin();
  if (!client) return { configured: false as const, competitions: [] as AwardsCompetition[] };
  let query = client.from("awards_competitions").select("id,slug,title,description,category,category_id,status,vote_price_cents,points_per_vote,jury_weight,public_vote_weight,organizer_org_id,created_by,created_at,starts_at,ends_at,legacy_candidates_count,legacy_votes_count,legacy_pot_amount_cents,legacy_cover_image").order("created_at", { ascending: false }).limit(100);
  if (filters?.slug) query = query.eq("slug", filters.slug);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw error;
  return { configured: true as const, competitions: (data ?? []).map((row) => mapCompetition(row as Record<string, unknown>)) };
}

export async function getSupabaseCandidates(competitionId?: string | null) {
  const client = getSupabaseAdmin();
  if (!client) return { configured: false as const, candidates: [] as AwardsCandidate[] };
  let query = client.from("awards_candidates").select("id,competition_id,display_name,bio,country,photo_url,video_url,project_description,status,created_at,legacy_votes_count,legacy_gifts_count,legacy_donations_cents").order("created_at", { ascending: true }).limit(500);
  if (competitionId) query = query.eq("competition_id", competitionId);
  const { data, error } = await query;
  if (error) throw error;
  return { configured: true as const, candidates: (data ?? []).map((row) => mapCandidate(row as Record<string, unknown>)) };
}

export function shouldUseJsonFallback() {
  return !isProductionRuntime();
}

export { mapCompetition, mapCandidate };
