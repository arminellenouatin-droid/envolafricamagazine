import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const auth = await getCurrentUserForAdmin("redacteur");
  if ((auth as any).error) return NextResponse.json({ error: (auth as any).error }, { status: (auth as any).status || 401 });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ authors: [], categories: [], error: "Base de production non configurée" }, { status: 503 });
  const [{ data: authors, error: authorError }, { data: categories, error: categoryError }] = await Promise.all([
    client.from("editorial_authors").select("id,name,slug,photo_url,bio,role_label,is_active,created_at").order("name"),
    client.from("categories").select("id,slug,label,color_hex,is_active").order("label"),
  ]);
  if (authorError || categoryError) return NextResponse.json({ error: authorError?.message || categoryError?.message || "Impossible de charger les données éditoriales" }, { status: 503 });
  return NextResponse.json({ authors: authors ?? [], categories: categories ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getCurrentUserForAdmin("redacteur_chef");
  if ((auth as any).error) return NextResponse.json({ error: (auth as any).error }, { status: (auth as any).status || 401 });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Base de production non configurée" }, { status: 503 });
  const body = await req.json();
  if (body.type === "author") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Le nom du rédacteur est obligatoire" }, { status: 400 });
    const slug = slugify(name) || `redacteur-${Date.now()}`;
    const { data, error } = await client.from("editorial_authors").insert({ name, slug, photo_url: body.photoUrl || null, bio: body.bio || null, role_label: body.roleLabel || "Rédacteur", is_active: body.isActive !== false }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ author: data });
  }
  if (body.type === "category") {
    const label = String(body.label || "").trim();
    if (!label) return NextResponse.json({ error: "Le nom de la catégorie est obligatoire" }, { status: 400 });
    const slug = slugify(label) || `categorie-${Date.now()}`;
    const { data, error } = await client.from("categories").insert({ label, slug, color_hex: body.colorHex || "#9e001f", is_active: body.isActive !== false }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ category: data });
  }
  return NextResponse.json({ error: "Type éditorial invalide" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const auth = await getCurrentUserForAdmin("redacteur_chef");
  if ((auth as any).error) return NextResponse.json({ error: (auth as any).error }, { status: (auth as any).status || 401 });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Base de production non configurée" }, { status: 503 });
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
  if (body.type === "author") {
    const patch = { name: String(body.name || "").trim(), photo_url: body.photoUrl || null, bio: body.bio || null, role_label: body.roleLabel || "Rédacteur", is_active: body.isActive !== false, updated_at: new Date().toISOString() };
    const { data, error } = await client.from("editorial_authors").update(patch).eq("id", id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ author: data });
  }
  if (body.type === "category") {
    const patch = { label: String(body.label || "").trim(), color_hex: body.colorHex || "#9e001f", is_active: body.isActive !== false };
    const { data, error } = await client.from("categories").update(patch).eq("id", id).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ category: data });
  }
  return NextResponse.json({ error: "Type éditorial invalide" }, { status: 400 });
}
