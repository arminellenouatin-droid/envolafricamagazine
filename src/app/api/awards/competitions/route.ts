import { NextRequest, NextResponse } from "next/server";
import { readAwardsDB, writeAwardsDB } from "@/lib/awards-db";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB } from "@/lib/db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseCompetitions } from "@/lib/awards-supabase";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const db = readDB();
    return db.users.find(u=>u.id===decoded.id) || null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const status = searchParams.get("status");
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const result = await getSupabaseCompetitions({ slug, status });
    if (slug) {
      const competition = result.competitions[0];
      if (!competition) return NextResponse.json({ error: "Compétition introuvable" }, { status: 404 });
      return NextResponse.json({ competition });
    }
    return NextResponse.json({ competitions: result.competitions });
  }
  const db = readAwardsDB();
  if (slug) {
    const comp = db.competitions.find(c=>c.slug===slug);
    if (!comp) return NextResponse.json({ error: "Compétition introuvable" }, { status: 404 });
    return NextResponse.json({ competition: comp });
  }
  let comps = db.competitions;
  if (status) comps = comps.filter(c=>c.status===status);
  return NextResponse.json({ competitions: comps.sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) });
}

// SEUL ADMIN PEUT CRÉER - Règle absolue gouvernance
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role!=="admin") {
    return NextResponse.json({ error: "Seul administrateur peut créer une compétition - Règle de gouvernance" }, { status: 403 });
  }
  const body = await req.json();
  const { title, description, category, vote_price_cents, points_per_vote, jury_weight, public_vote_weight } = body;
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') + "-" + Date.now().toString().slice(-4);
  const newComp = {
    id: uuidv4(),
    slug,
    title,
    description: description||"",
    category: category||"Awards",
    status: "draft" as const,
    vote_price_cents: vote_price_cents||100,
    points_per_vote: points_per_vote||1,
    jury_weight: jury_weight??0,
    public_vote_weight: public_vote_weight??100,
    cover_image: body.cover_image||`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800`,
    created_by: user.id,
    created_at: new Date().toISOString(),
    starts_at: body.starts_at || new Date().toISOString(),
    ends_at: body.ends_at || new Date(Date.now() + 30 * 86400000).toISOString(),
    candidates_count: 0,
    votes_count: 0,
    pot_amount_cents: 0,
  };
  // Vérif pondération somme 100
  if (newComp.jury_weight + newComp.public_vote_weight !== 100) {
    return NextResponse.json({ error: "Pondération jury + public doit sommer à 100" }, { status: 400 });
  }
  if (supabase) {
    const { data, error } = await supabase.from("awards_competitions").insert({
      id: newComp.id,
      slug: newComp.slug,
      title: newComp.title,
      description: newComp.description,
      category: newComp.category,
      status: newComp.status,
      vote_price_cents: newComp.vote_price_cents,
      points_per_vote: newComp.points_per_vote,
      jury_weight: newComp.jury_weight,
      public_vote_weight: newComp.public_vote_weight,
      results_public: true,
      created_by: user.id,
      starts_at: newComp.starts_at || null,
      ends_at: newComp.ends_at || null,
      created_at: newComp.created_at,
      legacy_candidates_count: 0,
      legacy_votes_count: 0,
      legacy_pot_amount_cents: 0,
      legacy_cover_image: newComp.cover_image || null,
    }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, competition: data });
  }
  const db = readAwardsDB();
  db.competitions.push(newComp);
  writeAwardsDB(db);
  return NextResponse.json({ success: true, competition: newComp });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user || user.role!=="admin") {
    return NextResponse.json({ error: "Seul admin peut modifier statut/config" }, { status: 403 });
  }
  const body = await req.json();
  const { id, status, ...updates } = body;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const validStatuses = ['draft','published','registrations_open','registrations_closed','voting_open','live_scheduled','live_running','voting_closed','deliberation','finished','archived'];
    if (status && !validStatuses.includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    const payload: Record<string, unknown> = { ...updates };
    if (status) payload.status = status;
    if (typeof payload.cover_image === "string") {
      payload.legacy_cover_image = payload.cover_image;
      delete payload.cover_image;
    }
    const { data, error } = await supabase.from("awards_competitions").update(payload).eq("id", id).select("*").single();
    if (error || !data) return NextResponse.json({ error: error?.message || "Introuvable" }, { status: error ? 500 : 404 });
    return NextResponse.json({ success: true, competition: data });
  }
  const db = readAwardsDB();
  const comp = db.competitions.find(c=>c.id===id);
  if (!comp) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  Object.assign(comp, updates);
  if (status) {
    // Cycle de vie: seul admin peut faire progresser
    const validStatuses = ['draft','published','registrations_open','registrations_closed','voting_open','live_scheduled','live_running','voting_closed','deliberation','finished','archived'];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    comp.status = status as typeof comp.status;
  }
  writeAwardsDB(db);
  return NextResponse.json({ success: true, competition: comp });
}
