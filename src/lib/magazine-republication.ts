import type { Magazine } from "@/lib/db";
import type { MarketplaceProduct } from "@/lib/marketplace-seed";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ensureWabPage, getWabProfileByUserId, upsertWabProfile } from "@/lib/wab-supabase";

export const MAGAZINE_MARKETPLACE_CATEGORY = "Magazines & médias";
export const MAGAZINE_MARKETPLACE_PREFIX = "magazine-";

export function magazineMarketplaceId(magazineId: string) {
  return `${MAGAZINE_MARKETPLACE_PREFIX}${magazineId}`;
}

export function magazinePriceXof(magazine: Magazine) {
  return Number(magazine.prices?.numerique ?? magazine.priceOverrides?.numerique ?? 10000);
}

export function toMagazineMarketplaceProduct(magazine: Magazine): MarketplaceProduct & { magazineId: string; magazineNumero: number; isMagazine: true } {
  return {
    id: magazineMarketplaceId(magazine.id),
    magazineId: magazine.id,
    magazineNumero: magazine.numero,
    isMagazine: true,
    title: magazine.title || `Envol Africa Magazine N°${magazine.numero}`,
    supplier: "Envol Africa Magazine",
    country: "BJ",
    city: "Cotonou",
    category: MAGAZINE_MARKETPLACE_CATEGORY,
    priceXof: magazinePriceXof(magazine),
    image: magazine.cover,
    accent: "#9e001f",
    certified: true,
    boosted: false,
    installment: false,
    months: 0,
    description: magazine.description || `Le numéro ${magazine.numero} d’Envol Africa Magazine, disponible en version numérique.`,
  };
}

export async function publishMagazineToWab(magazine: Magazine, authorUserId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, published: false as const, reason: "supabase_not_configured" as const };

  let profile = (await getWabProfileByUserId(authorUserId)).profile;
  if (!profile) {
    const created = await upsertWabProfile(authorUserId, {
      headline: "Envol Africa Magazine",
      about: "Les nouveaux numéros et analyses d’Envol Africa Magazine.",
      companyName: "Envol Africa Magazine",
      countryCode: "BJ",
      avatarUrl: undefined,
    });
    profile = created.profile;
  }
  if (!profile) return { configured: true as const, published: false as const, reason: "profile_not_found" as const };

  const pageResult = await ensureWabPage(authorUserId, { name: "ENVOL AFRICA", slug: "envol-africa", logoUrl: "https://drive.google.com/uc?export=download&id=1gzbeBDh79_cQUinL12_nb_fmQCjUKxYI", description: "La page officielle d’Envol Africa dans le réseau WAB." });
  const sourceUrl = `/kiosque/${magazine.id}`;
  const sourceTitle = magazine.title || `Envol Africa Magazine N°${magazine.numero}`;
  const payload = {
    author_id: profile.id,
    page_id: pageResult.page?.id ?? null,
    content: `Nouveau numéro disponible : ${sourceTitle}\n\n${magazine.description || "Découvrez les analyses, enquêtes et opportunités du nouveau numéro."}\n\nAcheter et feuilleter : ${sourceUrl}`,
    content_type: "document",
    media: magazine.cover ? [{ path: magazine.cover, mimeType: "image/*", name: sourceTitle }] : [],
    moderation_status: "published",
    is_boosted: false,
    source_type: "magazine_issue",
    source_id: magazine.id,
    source_url: sourceUrl,
    source_title: sourceTitle,
  };

  const { data: existing } = await supabase.from("wab_posts").select("id").eq("source_type", "magazine_issue").eq("source_id", magazine.id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("wab_posts").update(payload).eq("id", existing.id);
    return { configured: true as const, published: !error, postId: existing.id, updated: true as const };
  }
  const { data: created, error } = await supabase.from("wab_posts").insert(payload).select("id").single();
  return { configured: true as const, published: !error, postId: created?.id, updated: false as const };
}
