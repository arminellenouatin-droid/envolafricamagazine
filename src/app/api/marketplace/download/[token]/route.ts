import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { hashToken } from "@/lib/marketplace-digital";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const user = await getCurrentUserFromCookie();
  if (!user) return NextResponse.json({ error: "Connexion requise pour accéder à cet achat." }, { status: 401 });
  const { token } = await params;
  if (!token || token.length < 20) return NextResponse.json({ error: "Lien de téléchargement invalide." }, { status: 400 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Service de téléchargement indisponible." }, { status: 503 });
  const { data: entitlement, error } = await supabase.from("marketplace_download_tokens").select("id,order_id,product_id,buyer_id,download_count,max_downloads,expires_at").or(`id.eq.${token},token_hash.eq.${hashToken(token)}`).eq("buyer_id", user.id).maybeSingle();
  if (error || !entitlement) return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  if (new Date(entitlement.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "Cet accès a expiré." }, { status: 410 });
  if (entitlement.download_count >= entitlement.max_downloads) return NextResponse.json({ error: "La limite de téléchargements est atteinte." }, { status: 429 });
  const { data: product } = await supabase.from("marketplace_products").select("id,title,digital_file_url,digital_external_url,digital_access_instructions").eq("id", entitlement.product_id).single();
  if (!product) return NextResponse.json({ error: "Produit numérique introuvable." }, { status: 404 });
  if (product.digital_external_url) {
    await supabase.from("marketplace_download_tokens").update({ download_count: entitlement.download_count + 1, last_downloaded_at: new Date().toISOString() }).eq("id", entitlement.id);
    return NextResponse.redirect(product.digital_external_url);
  }
  if (!product.digital_file_url) return NextResponse.json({ error: "Aucun fichier numérique n’est disponible." }, { status: 404 });
  const { data: signed, error: signedError } = await supabase.storage.from("marketplace-digital").createSignedUrl(product.digital_file_url, 300);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "Le fichier numérique ne peut pas être préparé." }, { status: 502 });
  const { error: updateError } = await supabase.from("marketplace_download_tokens").update({ download_count: entitlement.download_count + 1, last_downloaded_at: new Date().toISOString() }).eq("id", entitlement.id).eq("buyer_id", user.id);
  if (updateError) return NextResponse.json({ error: "Impossible d’enregistrer le téléchargement." }, { status: 502 });
  return NextResponse.redirect(signed.signedUrl);
}
