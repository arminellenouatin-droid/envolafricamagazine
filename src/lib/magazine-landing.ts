import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readDB, writeDB } from "@/lib/db";

export type MagazineLandingBlockKey =
  | "magazine_fil"
  | "manager_du_mois"
  | "formations_certifiees"
  | "opportunites"
  | "videos"
  | "prochain_numero"
  | "ecosysteme"
  | "startups"
  | "recrutement"
  | "contenus_sponsorises";

export type MagazineLandingBlock = {
  blockKey: MagazineLandingBlockKey | string;
  blockType: string;
  sourceType: string;
  title: string;
  description?: string;
  itemLimit: number;
  config: Record<string, unknown>;
  order: number;
  isActive: boolean;
  articleId?: string;
  magazineId?: string;
  updatedAt?: string;
};

function mapBlock(row: Record<string, unknown>): MagazineLandingBlock {
  return {
    blockKey: String(row.block_key),
    blockType: String(row.block_type ?? "article_list"),
    sourceType: String(row.source_type ?? "manual"),
    title: String(row.title ?? row.block_key),
    description: typeof row.description === "string" ? row.description : undefined,
    itemLimit: Math.max(1, Math.min(24, Number(row.item_limit ?? 6))),
    config: row.config && typeof row.config === "object" ? row.config as Record<string, unknown> : {},
    order: Number(row.order ?? 0),
    isActive: row.is_active !== false,
    articleId: typeof row.article_id === "string" ? row.article_id : undefined,
    magazineId: typeof row.magazine_id === "string" ? row.magazine_id : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export async function listMagazineLandingBlocks(options: { includeInactive?: boolean } = {}) {
  const client = getSupabaseAdmin();
  if (client) {
    let query = client.from("landing_blocks").select("block_key,block_type,source_type,title,description,item_limit,config,\"order\",is_active,article_id,magazine_id,updated_at").order("order", { ascending: true });
    if (!options.includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (!error) return (data ?? []).map((row) => mapBlock(row as Record<string, unknown>));
    // Production peut encore utiliser le schéma historique (block_key/article_id/magazine_id/order).
    // On garde une lecture dégradée explicite en attendant l’application de la migration additive.
    if (error.code !== "42703") throw error;
    const legacy = await client.from("landing_blocks").select("block_key,article_id,magazine_id,\"order\"").order("order", { ascending: true });
    if (legacy.error) throw legacy.error;
    return (legacy.data ?? []).map((row) => ({
      blockKey: String(row.block_key), blockType: String(row.block_key) === "manager_du_mois" ? "manager" : "article_list",
      sourceType: String(row.block_key) === "manager_du_mois" ? "manual" : "articles",
      title: String(row.block_key), itemLimit: 6, config: {}, order: Number(row.order ?? 0), isActive: true,
      articleId: typeof row.article_id === "string" ? row.article_id : undefined,
      magazineId: typeof row.magazine_id === "string" ? row.magazine_id : undefined,
    } satisfies MagazineLandingBlock));
  }
  const settings = readDB().settings?.homeSections ?? {};
  return Object.entries(settings)
    .map(([blockKey, value]: [string, any]) => ({ blockKey, blockType: value.blockType ?? "article_list", sourceType: value.sourceType ?? "manual", title: value.title ?? blockKey, description: value.description, itemLimit: value.itemLimit ?? 6, config: value.config ?? value, order: value.order ?? 0, isActive: value.isActive !== false }))
    .filter((block) => options.includeInactive || block.isActive)
    .sort((a, b) => a.order - b.order) as MagazineLandingBlock[];
}

export async function saveMagazineLandingBlocks(blocks: MagazineLandingBlock[]) {
  const normalized = blocks.map((block, index) => ({
    block_key: block.blockKey,
    block_type: block.blockType,
    source_type: block.sourceType,
    title: block.title.trim(),
    description: block.description?.trim() || null,
    item_limit: Math.max(1, Math.min(24, Number(block.itemLimit || 6))),
    config: block.config ?? {},
    order: index + 1,
    is_active: block.isActive !== false,
    article_id: block.articleId || null,
    magazine_id: block.magazineId || null,
    updated_at: new Date().toISOString(),
  }));
  const client = getSupabaseAdmin();
  if (client) {
    const { data, error } = await client.from("landing_blocks").upsert(normalized, { onConflict: "block_key" }).select("block_key,block_type,source_type,title,description,item_limit,config,\"order\",is_active,article_id,magazine_id,updated_at").order("order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => mapBlock(row as Record<string, unknown>));
  }
  const db = readDB();
  db.settings.homeSections = Object.fromEntries(normalized.map((block) => [block.block_key, { ...block, blockKey: block.block_key, blockType: block.block_type, sourceType: block.source_type, itemLimit: block.item_limit, isActive: block.is_active }]));
  writeDB(db);
  return normalized.map((block) => mapBlock(block));
}
