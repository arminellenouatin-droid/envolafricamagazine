import { NextRequest, NextResponse } from "next/server";
import { findMagazineById } from "@/lib/core-db";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createCanvas } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";

const MAX_PREVIEW_PAGE = 7;
const MAGAZINE_PRIVATE_BUCKET = process.env.MAGAZINE_PRIVATE_BUCKET || "magazine-pdfs-private";

function parsePrivateRef(value: string) {
  const match = /^private-pdf:\/\/([^/]+)\/(.+)$/.exec(value);
  if (match) return { bucket: match[1], path: match[2] };
  const shortMatch = /^private-pdf:\/\/(.+)$/.exec(value);
  if (shortMatch) return { bucket: MAGAZINE_PRIVATE_BUCKET, path: shortMatch[1] };
  return null;
}

// In-memory cache for rendered WebP pages and downloaded PDF buffers to ensure ultra-fast loading (< 50ms)
const pageCache = new Map<string, { buffer: Buffer; expiresAt: number }>();
const pdfBufferCache = new Map<string, { data: Uint8Array; expiresAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const pageNumber = Number(request.nextUrl.searchParams.get("page") || 1);
    const language = String(request.nextUrl.searchParams.get("lang") || "fr");
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > MAX_PREVIEW_PAGE) {
      return NextResponse.json({ error: "Seules les sept premières pages sont disponibles en aperçu." }, { status: 403 });
    }

    const cacheKey = `${id}:${language}:${pageNumber}`;
    const cachedPage = pageCache.get(cacheKey);
    const now = Date.now();
    if (cachedPage && cachedPage.expiresAt > now) {
      return new NextResponse(cachedPage.buffer as any, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
          "X-Robots-Tag": "noindex, noarchive",
          "X-Cache-Status": "HIT",
        },
      });
    }

    const magazine = await findMagazineById(id);
    const ref = magazine?.pdfs?.[language] || magazine?.pdfs?.fr || (magazine?.numero === 23 || id === "23" ? "/magazines/23/numero-23.pdf" : "");
    if (!ref) {
      return NextResponse.json({ error: "Aucun PDF associé à cette édition." }, { status: 404 });
    }

    let pdfBytes: Uint8Array | null = null;
    const client = getSupabaseAdmin();

    if (ref.startsWith("private-pdf://")) {
      const parsed = parsePrivateRef(ref);
      if (parsed && client) {
        const pdfKey = `${parsed.bucket}/${parsed.path}`;
        const cachedPdf = pdfBufferCache.get(pdfKey);
        if (cachedPdf && cachedPdf.expiresAt > now) {
          pdfBytes = cachedPdf.data;
        } else {
          const downloaded = await client.storage.from(parsed.bucket).download(parsed.path);
          if (downloaded.data) {
            pdfBytes = new Uint8Array(await downloaded.data.arrayBuffer());
            pdfBufferCache.set(pdfKey, { data: pdfBytes, expiresAt: now + CACHE_TTL });
          }
        }
      }
    } else if (ref.startsWith("http://") || ref.startsWith("https://")) {
      const cachedPdf = pdfBufferCache.get(ref);
      if (cachedPdf && cachedPdf.expiresAt > now) {
        pdfBytes = cachedPdf.data;
      } else {
        const res = await fetch(ref, { cache: "force-cache" });
        if (res.ok) {
          pdfBytes = new Uint8Array(await res.arrayBuffer());
          pdfBufferCache.set(ref, { data: pdfBytes, expiresAt: now + CACHE_TTL });
        }
      }
    } else if (ref.startsWith("/")) {
      const cleanPath = ref.replace(/^\/+/, "");
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      if (fs.existsSync(fullPath)) {
        const buf = await fs.promises.readFile(fullPath);
        pdfBytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      }
    }

    if (!pdfBytes) {
      return NextResponse.json({ error: "Fichier PDF source introuvable." }, { status: 404 });
    }

    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({ data: pdfBytes, useSystemFonts: false }).promise;
    if (pageNumber > pdf.numPages) return NextResponse.json({ error: "Page indisponible." }, { status: 404 });
    const pdfPage = await pdf.getPage(pageNumber);
    const baseViewport = pdfPage.getViewport({ scale: 1 });
    const scale = Math.min(1.65, 1200 / baseViewport.width);
    const viewport = pdfPage.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context2d = canvas.getContext("2d");
    await pdfPage.render({ canvas: canvas as any, canvasContext: context2d as any, viewport }).promise;
    const output = canvas.toBuffer("image/webp", 82);

    pageCache.set(cacheKey, { buffer: output, expiresAt: now + CACHE_TTL });

    return new NextResponse(output as any, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
        "X-Robots-Tag": "noindex, noarchive",
        "X-Cache-Status": "MISS",
      },
    });
  } catch (error) {
    console.error("Magazine preview error", error);
    return NextResponse.json({ error: "Impossible de générer l’aperçu." }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

