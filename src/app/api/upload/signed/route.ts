import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = new Set(["cover", "preview", "pdf", "audio"]);
const MAGAZINE_PRIVATE_BUCKET = process.env.MAGAZINE_PRIVATE_BUCKET || "magazine-pdfs-private";

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "magazine";
}

export async function POST(request: NextRequest) {
  const { error, status } = await getCurrentUserForAdmin("gerant");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await request.json();
    const fileName = String(body.fileName || "");
    const type = String(body.type || "");
    const magazineId = safeSegment(String(body.magazineId || "temp"));
    const lang = body.lang ? safeSegment(String(body.lang)) : "";
    const contentType = String(body.contentType || "application/octet-stream");
    if (!fileName || !ALLOWED_TYPES.has(type)) return NextResponse.json({ error: "Type de fichier ou nom invalide." }, { status: 400 });
    const extension = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
    const storageBucket = type === "pdf" ? MAGAZINE_PRIVATE_BUCKET : "article-media";
    const path = `magazines/${type}/${lang ? `${magazineId}_${lang}` : magazineId}/${Date.now()}-${randomUUID()}.${extension}`;
    const client = getSupabaseAdmin();
    if (!client) return NextResponse.json({ error: "Stockage Supabase indisponible." }, { status: 503 });
    if (type === "pdf") {
      const created = await client.storage.createBucket(MAGAZINE_PRIVATE_BUCKET, { public: false, fileSizeLimit: "50MB", allowedMimeTypes: ["application/pdf"] });
      if (created.error && !/already exists|duplicate/i.test(created.error.message)) return NextResponse.json({ error: `Bucket PDF privé indisponible : ${created.error.message}` }, { status: 503 });
    }
    const signed = await client.storage.from(storageBucket).createSignedUploadUrl(path);
    if (signed.error || !signed.data) return NextResponse.json({ error: signed.error?.message || "Impossible de préparer l’upload direct." }, { status: 503 });
    const publicUrl = storageBucket === "article-media" ? client.storage.from(storageBucket).getPublicUrl(path).data.publicUrl : undefined;
    return NextResponse.json({ path, token: signed.data.token, bucket: storageBucket, publicUrl, privateRef: type === "pdf" ? `private-pdf://${storageBucket}/${path}` : undefined, contentType });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Préparation de l’upload impossible." }, { status: 500 });
  }
}
