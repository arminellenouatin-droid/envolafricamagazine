import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseCandidates } from "@/lib/awards-supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competition_id = searchParams.get("competition_id");
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const result = await getSupabaseCandidates(competition_id);
    return NextResponse.json({ candidates: result.candidates });
  }
  const db = readAwardsDB();
  let candidates = db.candidates;
  if (competition_id) candidates = candidates.filter(c=>c.competition_id===competition_id);
  return NextResponse.json({ candidates });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { competition_id, display_name, bio, country, project_description, video_url } = body;
  if (!competition_id || !display_name) return NextResponse.json({ error: "competition_id et display_name requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const newCandidate = {
    id: uuidv4(),
    competition_id,
    display_name,
    bio: bio||"",
    country: country||"BJ",
    photo_url: `https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400`,
    video_url: video_url||"",
    project_description: project_description||"",
    status: "pending" as const,
    votes: 0,
    gifts: 0,
    donations: 0,
    created_at: new Date().toISOString(),
  };
  if (supabase) {
    const { data, error } = await supabase.from("awards_candidates").insert({
      id: newCandidate.id,
      competition_id: newCandidate.competition_id,
      display_name: newCandidate.display_name,
      bio: newCandidate.bio,
      country: newCandidate.country,
      photo_url: newCandidate.photo_url,
      video_url: newCandidate.video_url,
      project_description: newCandidate.project_description,
      status: newCandidate.status,
      created_at: newCandidate.created_at,
      legacy_votes_count: 0,
      legacy_gifts_count: 0,
      legacy_donations_cents: 0,
    }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, candidate: data });
  }
  const db = readAwardsDB();
  db.candidates.push(newCandidate);
  writeAwardsDB(db);
  return NextResponse.json({ success: true, candidate: newCandidate });
}
