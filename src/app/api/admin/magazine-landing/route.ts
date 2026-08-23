import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserForAdmin } from "@/lib/admin-auth";
import { listMagazineLandingBlocks, saveMagazineLandingBlocks, type MagazineLandingBlock } from "@/lib/magazine-landing";

const allowedTypes = new Set(["hero", "secondary_feature", "article_list", "manager", "most_read", "formations", "opportunities", "videos", "next_issue", "ecosystem", "startups", "recruitment", "sponsored"]);
const allowedSources = new Set(["manual", "articles", "article_tag", "article_category", "formations", "jobs_boosted", "wab_boosted", "video_library", "ecosystem_links", "sponsored_library"]);

export async function GET() {
  const { error, status } = await getCurrentUserForAdmin("gerant");
  if (error) return NextResponse.json({ error }, { status });
  try {
    return NextResponse.json({ blocks: await listMagazineLandingBlocks({ includeInactive: true }) });
  } catch (cause) {
    console.error("[admin/magazine-landing] GET", cause);
    return NextResponse.json({ error: "Lecture de la configuration impossible" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const { error, status } = await getCurrentUserForAdmin("admin");
  if (error) return NextResponse.json({ error }, { status });
  try {
    const body = await request.json();
    if (!Array.isArray(body.blocks) || body.blocks.length > 24) return NextResponse.json({ error: "La liste des blocs est invalide" }, { status: 400 });
    const blocks = body.blocks.map((block: any, index: number): MagazineLandingBlock => {
      const itemLimit = Number(block.itemLimit ?? 6);
      if (!block.blockKey || !allowedTypes.has(String(block.blockType)) || !allowedSources.has(String(block.sourceType)) || !Number.isInteger(itemLimit) || itemLimit < 1 || itemLimit > 24) throw new Error(`Bloc invalide à la position ${index + 1}`);
      return { blockKey: String(block.blockKey), blockType: String(block.blockType), sourceType: String(block.sourceType), title: String(block.title ?? "").trim(), description: block.description ? String(block.description).trim() : undefined, itemLimit, config: block.config && typeof block.config === "object" ? block.config : {}, order: index + 1, isActive: block.isActive !== false, articleId: block.articleId ? String(block.articleId) : undefined, magazineId: block.magazineId ? String(block.magazineId) : undefined };
    });
    if (blocks.some((block: MagazineLandingBlock) => !block.title)) return NextResponse.json({ error: "Chaque bloc actif doit avoir un titre" }, { status: 400 });
    return NextResponse.json({ success: true, blocks: await saveMagazineLandingBlocks(blocks) });
  } catch (cause) {
    console.error("[admin/magazine-landing] PUT", cause);
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Enregistrement impossible" }, { status: 400 });
  }
}
