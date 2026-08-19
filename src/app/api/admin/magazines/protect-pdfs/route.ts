import { NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { listMagazines } from "@/lib/core-db";

const BUCKET = process.env.MAGAZINE_PRIVATE_BUCKET || "magazine-pdfs-private";

function publicStoragePath(value: string) {
  const marker = "/storage/v1/object/public/article-media/";
  const index = value.indexOf(marker);
  return index >= 0 ? decodeURIComponent(value.slice(index + marker.length)) : null;
}

export async function POST() {
  const { error, status } = await getCurrentUserForAdmin("gerant");
  if (error) return NextResponse.json({ error }, { status });
  const client = getSupabaseAdmin();
  if (!client) return NextResponse.json({ error: "Supabase indisponible." }, { status: 503 });
  try {
    const bucket = await client.storage.createBucket(BUCKET, { public: false, fileSizeLimit: "50MB", allowedMimeTypes: ["application/pdf"] });
    if (bucket.error && !/already exists|duplicate/i.test(bucket.error.message)) return NextResponse.json({ error: bucket.error.message }, { status: 503 });
    const magazines = await listMagazines();
    const migrated: Array<{ id: string; language: string }> = [];
    const skipped: Array<{ id: string; language: string; reason: string }> = [];
    for (const magazine of magazines) {
      const pdfs = { ...(magazine.pdfs || {}) };
      let changed = false;
      for (const [language, value] of Object.entries(pdfs)) {
        if (!value || value.startsWith("private-pdf://")) continue;
        const sourcePath = publicStoragePath(value);
        if (!sourcePath) { skipped.push({ id: magazine.id, language, reason: "URL non Supabase" }); continue; }
        const downloaded = await client.storage.from("article-media").download(sourcePath);
        if (downloaded.error || !downloaded.data) { skipped.push({ id: magazine.id, language, reason: downloaded.error?.message || "PDF introuvable" }); continue; }
        const targetPath = `magazines/pdf/migrated/${magazine.id}_${language}-${Date.now()}.pdf`;
        const uploaded = await client.storage.from(BUCKET).upload(targetPath, downloaded.data, { contentType: "application/pdf", upsert: false });
        if (uploaded.error) { skipped.push({ id: magazine.id, language, reason: uploaded.error.message }); continue; }
        pdfs[language] = `private-pdf://${BUCKET}/${targetPath}`;
        changed = true;
        migrated.push({ id: magazine.id, language });
      }
      if (changed) {
        const updated = await client.from("magazines").update({ pdfs }).eq("id", magazine.id);
        if (updated.error) return NextResponse.json({ error: `Migration interrompue pour ${magazine.id}: ${updated.error.message}`, migrated, skipped }, { status: 503 });
      }
    }
    return NextResponse.json({ success: true, bucket: BUCKET, migrated, skipped });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Migration impossible." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
