import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_VIDEO_BYTES = 3 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const safe = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "product";

async function getContext(userId: string, productId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { supabase: null, error: "Stockage indisponible." } as const;
  const { data: product } = await supabase.from("marketplace_products").select("id,supplier_id,product_video_url").eq("id", productId).maybeSingle();
  const { data: supplier } = await supabase.from("marketplace_suppliers").select("id").eq("id", product?.supplier_id || "").eq("user_id", userId).maybeSingle();
  if (!product || !supplier) return { supabase, error: "Produit ou autorisation introuvable." } as const;
  const { data: subscription } = await supabase.from("marketplace_video_subscriptions").select("id,status,ends_at,video_count").eq("user_id", userId).maybeSingle();
  const active = Boolean(subscription?.status === "active" && subscription.ends_at && Date.parse(subscription.ends_at) > Date.now());
  if (!active) return { supabase, error: "Activez l’option vidéo Marketplace à 5 000 XOF par mois." } as const;
  const currentCount = Number(subscription?.video_count || 0);
  if (!product.product_video_url && currentCount >= 10) return { supabase, error: "La limite de 10 produits avec vidéo pour cette période est atteinte." } as const;
  return { supabase, product, subscription } as const;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: string; productId?: string; fileName?: string; contentType?: string; size?: number; path?: string; publicUrl?: string } | null;
  if (!body?.productId) return NextResponse.json({ error: "Produit requis." }, { status: 400 });
  const context = await getContext(user.id, body.productId);
  if (context.error || !context.supabase) return NextResponse.json({ error: context.error || "Service indisponible." }, { status: 403 });
  if (body.action === "prepare") {
    const size = Number(body.size || 0); const contentType = String(body.contentType || "");
    if (!Number.isInteger(size) || size <= 0 || size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "La vidéo doit peser au maximum 3 Mo." }, { status: 413 });
    if (!ALLOWED_VIDEO_TYPES.has(contentType)) return NextResponse.json({ error: "Format vidéo accepté : MP4, WebM ou MOV." }, { status: 400 });
    const bucket = "marketplace-product-videos";
    const created = await context.supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: "3MB", allowedMimeTypes: Array.from(ALLOWED_VIDEO_TYPES) });
    if (created.error && !/already exists|duplicate/i.test(created.error.message)) return NextResponse.json({ error: "Bucket vidéo indisponible." }, { status: 503 });
    const extension = String(body.fileName || "video.mp4").split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "mp4";
    const path = `products/${safe(body.productId)}/${Date.now()}-${randomUUID()}.${extension}`;
    const signed = await context.supabase.storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error || !signed.data) return NextResponse.json({ error: "Impossible de préparer l’upload vidéo." }, { status: 503 });
    const publicUrl = context.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ bucket, path, token: signed.data.token, publicUrl, maxBytes: MAX_VIDEO_BYTES });
  }
  if (body.action === "attach") {
    const subscription = context.subscription;
    if (!subscription) return NextResponse.json({ error: "Abonnement vidéo introuvable." }, { status: 403 });
    const size = Number(body.size || 0); const contentType = String(body.contentType || "");
    if (!body.publicUrl || !Number.isInteger(size) || size <= 0 || size > MAX_VIDEO_BYTES || !ALLOWED_VIDEO_TYPES.has(contentType)) return NextResponse.json({ error: "Vidéo invalide ou supérieure à 3 Mo." }, { status: 400 });
    const oldVideo = Boolean(context.product.product_video_url);
    const { error: updateError } = await context.supabase.from("marketplace_products").update({ product_video_url: body.publicUrl, product_video_mime: contentType, product_video_size: size, product_video_updated_at: new Date().toISOString() }).eq("id", body.productId);
    if (updateError) return NextResponse.json({ error: "Impossible d’enregistrer la vidéo." }, { status: 503 });
    if (!oldVideo) await context.supabase.from("marketplace_video_subscriptions").update({ video_count: Number(context.subscription.video_count || 0) + 1, updated_at: new Date().toISOString() }).eq("id", context.subscription.id);
    return NextResponse.json({ ok: true, videoUrl: body.publicUrl });
  }
  return NextResponse.json({ error: "Action vidéo inconnue." }, { status: 400 });
}
