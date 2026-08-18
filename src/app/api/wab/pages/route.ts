import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { readWabDB, writeWabDB } from "@/lib/wab-db";
import { createWabPage, ensureWabPage, listWabPages } from "@/lib/wab-supabase";

const ENVOL_PAGE = { name: "ENVOL AFRICA", slug: "envol-africa", logoUrl: "/logo-couleur-entete.png", description: "La page officielle d’Envol Africa dans le réseau WAB." };

function slugify(value: string) { return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80); }

export async function GET() {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ pages: [] }, { status: 401 });
  const supabase = await listWabPages(user.id);
  if (supabase.configured) {
    let pages = supabase.pages ?? [];
    if (!pages.some((page) => page.slug === ENVOL_PAGE.slug)) { const ensured = await ensureWabPage(user.id, ENVOL_PAGE); if (ensured.page) pages = [...pages, ensured.page]; }
    return NextResponse.json({ pages });
  }
  const db = readWabDB();
  let page = db.pages.find((item) => item.ownerUserId === user.id && item.slug === ENVOL_PAGE.slug);
  if (!page) { const now = new Date().toISOString(); page = { id: crypto.randomUUID(), ownerUserId: user.id, ...ENVOL_PAGE, status: "active", createdAt: now, updatedAt: now }; db.pages.push(page); writeWabDB(db); }
  return NextResponse.json({ pages: db.pages.filter((item) => item.ownerUserId === user.id && item.status === "active") });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  if (!name) return NextResponse.json({ error: "Le nom de la page est obligatoire." }, { status: 400 });
  const input = { name, slug: slugify(name), logoUrl: typeof body.logoUrl === "string" ? body.logoUrl.trim().slice(0, 500) : undefined, description: typeof body.description === "string" ? body.description.trim().slice(0, 500) : undefined };
  const supabase = await createWabPage(user.id, input);
  if (supabase.configured) { if (!supabase.page) return NextResponse.json({ error: "Impossible de créer la page." }, { status: 400 }); return NextResponse.json({ page: supabase.page }, { status: 201 }); }
  const db = readWabDB();
  if (db.pages.some((page) => page.ownerUserId === user.id && page.slug === input.slug)) return NextResponse.json({ error: "Une page portant ce nom existe déjà." }, { status: 409 });
  const now = new Date().toISOString(); const page = { id: crypto.randomUUID(), ownerUserId: user.id, ...input, status: "active" as const, createdAt: now, updatedAt: now }; db.pages.push(page); writeWabDB(db); return NextResponse.json({ page }, { status: 201 });
}
