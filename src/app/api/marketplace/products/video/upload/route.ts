import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_VIDEO_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const productId = String(form.get("productId") || "");
  if (!(file instanceof File) || !productId) return NextResponse.json({ error: "Produit et vidéo requis." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "La vidéo doit peser au maximum 3 Mo." }, { status: 413 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Format accepté : MP4, WebM ou MOV." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  const { data: product } = await supabase.from("marketplace_products").select("id,supplier_id,product_video_url").eq("id", productId).maybeSingle();
  const { data: supplier } = await supabase.from("marketplace_suppliers").select("id").eq("id", product?.supplier_id || "").eq("user_id", user.id).maybeSingle();
  if (!product || !supplier) return NextResponse.json({ error: "Produit introuvable ou non autorisé." }, { status: 403 });
  const { data: subscription } = await supabase.from("marketplace_video_subscriptions").select("id,status,ends_at,video_count").eq("user_id", user.id).maybeSingle();
  const active = Boolean(subscription?.status === "active" && subscription.ends_at && Date.parse(subscription.ends_at) > Date.now());
  if (!active || !subscription) return NextResponse.json({ error: "Activez l’option vidéo Marketplace à 5 000 XOF par mois." }, { status: 403 });
  if (!product.product_video_url && Number(subscription?.video_count || 0) >= 10) return NextResponse.json({ error: "La limite de 10 produits avec vidéo est atteinte pour cette période." }, { status: 409 });
  const created = await supabase.storage.createBucket("marketplace-product-videos", { public: true, fileSizeLimit: "3MB", allowedMimeTypes: Array.from(ALLOWED_TYPES) });
  if (created.error && !/already exists|duplicate/i.test(created.error.message)) return NextResponse.json({ error: "Bucket vidéo indisponible." }, { status: 503 });
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "mp4";
  const path = `products/${productId}/${Date.now()}-${randomUUID()}.${extension}`;
  const uploaded = await supabase.storage.from("marketplace-product-videos").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploaded.error) return NextResponse.json({ error: "Échec du stockage de la vidéo." }, { status: 503 });
  const publicUrl = supabase.storage.from("marketplace-product-videos").getPublicUrl(path).data.publicUrl;
  const updated = await supabase.from("marketplace_products").update({ product_video_url: publicUrl, product_video_mime: file.type, product_video_size: file.size, product_video_updated_at: new Date().toISOString() }).eq("id", productId);
  if (updated.error) return NextResponse.json({ error: "Vidéo stockée mais association au produit impossible." }, { status: 503 });
  if (!product.product_video_url) await supabase.from("marketplace_video_subscriptions").update({ video_count: Number(subscription.video_count || 0) + 1, updated_at: new Date().toISOString() }).eq("id", subscription.id);
  return NextResponse.json({ ok: true, videoUrl: publicUrl, size: file.size, remaining: Math.max(0, 10 - Number(subscription.video_count || 0) - (product.product_video_url ? 0 : 1)) });
}
