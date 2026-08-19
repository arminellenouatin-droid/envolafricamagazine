import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const defaults = [
  { slug: "edition-normale", label: "Édition Normale" },
  { slug: "edition-speciale", label: "Édition spéciale" },
  { slug: "enquete-speciale", label: "Enquête spéciale" },
  { slug: "hors-serie", label: "Hors série" },
  { slug: "master-class", label: "Master class" },
];

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function GET() {
  const { error, status } = await getCurrentUserForAdmin("gerant");
  if (error) return NextResponse.json({ error }, { status });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ categories: defaults.map((item, index) => ({ ...item, id: item.slug, color_hex: index === 0 ? "#9e001f" : "#0A1931", is_active: true })) });
  const result = await client.from("magazine_categories").select("id,slug,label,color_hex,is_active").eq("is_active", true).order("label");
  if (result.error) return NextResponse.json({ error: `Impossible de charger les catégories Magazine : ${result.error.message}` }, { status: 503 });
  return NextResponse.json({ categories: result.data || [] });
}

export async function POST(request: NextRequest) {
  const { error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await request.json();
    const label = String(body.label || "").trim();
    if (!label) return NextResponse.json({ error: "Le nom de la catégorie est requis." }, { status: 400 });
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.json({ error: "Stockage des catégories Magazine indisponible." }, { status: 503 });
    const result = await client.from("magazine_categories").insert({ slug: slugify(label), label, color_hex: String(body.colorHex || "#9e001f") }).select("id,slug,label,color_hex,is_active").single();
    if (result.error) return NextResponse.json({ error: result.error.code === "23505" ? "Cette catégorie Magazine existe déjà." : result.error.message }, { status: result.error.code === "23505" ? 409 : 503 });
    return NextResponse.json({ category: result.data });
  } catch (cause) { return NextResponse.json({ error: cause instanceof Error ? cause.message : "Création impossible." }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const { error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Stockage des catégories Magazine indisponible." }, { status: 503 });
  const result = await client.from("magazine_categories").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 503 });
  return NextResponse.json({ success: true });
}
