import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWabDB } from "@/lib/wab-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const execFileAsync = promisify(execFile);
type Media = { path: string; mimeType: string; name: string; size?: number };

async function resolveMedia(postId: string, index: number) {
  const localPost = readWabDB().posts.find((item) => item.id === postId && item.moderationStatus === "published");
  let media = localPost?.media?.[index] as Media | undefined;
  if (!media) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase.from("wab_posts").select("media, moderation_status").eq("id", postId).eq("moderation_status", "published").maybeSingle();
      media = Array.isArray(data?.media) ? (data.media as Media[])[index] : undefined;
    }
  }
  if (!media) return null;
  if (/^https?:\/\//.test(media.path)) return { media, url: media.path };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  const storage = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await storage.storage.from("wab-media").createSignedUrl(media.path, 300);
  return error || !data?.signedUrl ? null : { media, url: data.signedUrl };
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  const index = Number(request.nextUrl.searchParams.get("index") ?? "0");
  if (!postId || !Number.isInteger(index) || index < 0) return NextResponse.json({ error: "Média invalide." }, { status: 400 });
  const resolved = await resolveMedia(postId, index);
  if (!resolved) return NextResponse.json({ error: "Média indisponible." }, { status: 404 });
  const { media, url } = resolved;
  const lower = media.name.toLowerCase();
  const isDocument = media.mimeType === "application/pdf" || /\.(pdf|doc|docx|xls|xlsx|csv|ppt|pptx)$/.test(lower);
  if (!isDocument) return NextResponse.json({ error: "Ce fichier ne possède pas d’aperçu documentaire." }, { status: 415 });
  const workspace = await mkdtemp(join(tmpdir(), "wab-preview-"));
  const source = join(workspace, media.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "document");
  const pdf = join(workspace, "document.pdf");
  const outputPrefix = join(workspace, "page");
  try {
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: "Téléchargement du document impossible." }, { status: 502 });
    await writeFile(source, Buffer.from(await response.arrayBuffer()));
    if (media.mimeType === "application/pdf" || lower.endsWith(".pdf")) {
      await writeFile(pdf, await readFile(source));
    } else {
      await execFileAsync("libreoffice", ["--headless", "--convert-to", "pdf", "--outdir", workspace, source], { timeout: 30000 });
      const converted = join(workspace, `${source.split("/").pop()?.replace(/\.[^.]+$/, "")}.pdf`);
      await writeFile(pdf, await readFile(converted));
    }
    await execFileAsync("pdftoppm", ["-f", "1", "-l", "1", "-png", "-singlefile", "-scale-to", "1400", pdf, outputPrefix], { timeout: 30000 });
    const image = await readFile(`${outputPrefix}.png`);
    return new NextResponse(image, { headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=300", "Content-Disposition": "inline" } });
  } catch {
    return NextResponse.json({ error: "Aperçu documentaire indisponible sur ce serveur." }, { status: 503 });
  } finally {
    await rm(workspace, { recursive: true, force: true }).catch(() => undefined);
  }
}
