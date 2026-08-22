import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "application/zip", "application/epub+zip", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "video/mp4", "audio/mpeg"]);

function safeName(name: string) { return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120); }

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Stockage temporairement indisponible." }, { status: 503 });
  const { data: supplier } = await supabase.from("marketplace_suppliers").select("id").eq("user_id", user.id).maybeSingle();
  if (!supplier) return NextResponse.json({ error: "Créez d’abord votre boutique fournisseur." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Le fichier ne doit pas dépasser 100 Mo." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Format de fichier non autorisé." }, { status: 400 });
  const productId = String(form.get("productId") || "").trim();
  if (!productId) return NextResponse.json({ error: "Produit requis." }, { status: 400 });
  const { data: product } = await supabase.from("marketplace_products").select("id,supplier_id").eq("id", productId).eq("supplier_id", supplier.id).maybeSingle();
  if (!product) return NextResponse.json({ error: "Produit introuvable ou non autorisé." }, { status: 403 });
  const storagePath = `${supplier.id}/${product.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("marketplace-digital").upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Impossible de stocker le fichier numérique." }, { status: 502 });
  const { error: updateError } = await supabase.from("marketplace_products").update({ digital_file_url: storagePath, updated_at: new Date().toISOString() }).eq("id", product.id).eq("supplier_id", supplier.id);
  if (updateError) return NextResponse.json({ error: "Fichier chargé mais produit non mis à jour." }, { status: 502 });
  return NextResponse.json({ success: true, storagePath, size: file.size, mimeType: file.type });
}
