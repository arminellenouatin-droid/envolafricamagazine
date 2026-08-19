import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB, writeWabDB } from "@/lib/wab-db";

export type BoostSourceType = "jobs_offer" | "jobs_candidate" | "crowdfunding_project" | "marketplace_product";

type SourceInput = {
  sourceType: BoostSourceType;
  sourceId: string;
  userId: string;
  boostEndsAt: string;
};

type SourceRecord = {
  title: string;
  description: string;
  country?: string;
  city?: string;
  category?: string;
  image?: string;
  url: string;
};

function sourceUrl(sourceType: BoostSourceType, sourceId: string) {
  if (sourceType === "jobs_offer") return `/emploi/offres/${sourceId}`;
  if (sourceType === "jobs_candidate") return `/emploi/candidats/${sourceId}`;
  if (sourceType === "crowdfunding_project") return `/financement/projets/${sourceId}`;
  return `/marketplace/produits/${sourceId}`;
}

async function readSupabaseSource(input: SourceInput): Promise<SourceRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  if (input.sourceType === "crowdfunding_project") {
    const { data: project } = await supabase.from("crowdfunding_projects").select("nom,description,pays,secteur,images,porteur_id").eq("id", input.sourceId).eq("porteur_id", input.userId).maybeSingle();
    if (!project) return null;
    const images = Array.isArray(project.images) ? project.images : [];
    return { title: project.nom, description: project.description, country: project.pays, category: project.secteur, image: typeof images[0] === "string" ? images[0] : undefined, url: sourceUrl(input.sourceType, input.sourceId) };
  }

  if (input.sourceType === "jobs_offer") {
    const { data } = await supabase.from("jobs_offers").select("title,description,country_name,city,sector,company_name,company_logo_url").eq("id", input.sourceId).eq("created_by", input.userId).maybeSingle();
    if (!data) return null;
    return { title: data.title, description: data.description, country: data.country_name, city: data.city, category: data.sector, image: data.company_logo_url || undefined, url: sourceUrl(input.sourceType, input.sourceId) };
  }

  if (input.sourceType === "jobs_candidate") {
    const { data } = await supabase.from("jobs_candidates").select("first_name,last_name,description,country_name,city,desired_role,photo_url").eq("id", input.sourceId).eq("created_by", input.userId).maybeSingle();
    if (!data) return null;
    return { title: `${data.first_name} ${data.last_name} — ${data.desired_role}`, description: data.description, country: data.country_name, city: data.city, category: data.desired_role, image: data.photo_url || undefined, url: sourceUrl(input.sourceType, input.sourceId) };
  }

  if (input.sourceType === "marketplace_product") {
    const { data: supplier } = await supabase.from("marketplace_suppliers").select("id").eq("user_id", input.userId).maybeSingle();
    if (!supplier) return null;
    const { data } = await supabase.from("marketplace_products").select("title,description,country_code,city,category,media").eq("id", input.sourceId).eq("supplier_id", supplier.id).maybeSingle();
    if (!data) return null;
    const media = Array.isArray(data.media) ? data.media : [];
    const image = typeof media[0] === "string" ? media[0] : (media[0] && typeof media[0] === "object" && "url" in media[0] ? String(media[0].url) : undefined);
    return { title: data.title, description: data.description, country: data.country_code, city: data.city, category: data.category, image, url: sourceUrl(input.sourceType, input.sourceId) };
  }

  return null;
}

async function ensureSupabaseProfile(userId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data: existing } = await supabase.from("wab_profiles").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return existing.id as string;
  const { data: user } = await supabase.from("users").select("nom,prenom,company,country,avatar").eq("id", userId).maybeSingle();
  if (!user) return null;
  const { data: created } = await supabase.from("wab_profiles").insert({ user_id: userId, headline: user.company || "Publication sponsorisée", country_code: user.country || "BJ", avatar_url: user.avatar || null }).select("id").single();
  return created?.id as string | null;
}

export async function publishBoostedSourceToWab(input: SourceInput) {
  const source = await readSupabaseSource(input);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    if (!source) return { configured: true as const, published: false as const, reason: "source_not_found" as const };
    const authorId = await ensureSupabaseProfile(input.userId);
    if (!authorId) return { configured: true as const, published: false as const, reason: "profile_not_found" as const };
    const { data: existing } = await supabase.from("wab_posts").select("id").eq("source_type", input.sourceType).eq("source_id", input.sourceId).maybeSingle();
    const payload = { author_id: authorId, content: `Publication sponsorisée — ${source.title}\n\n${source.description}\n\nDécouvrir : ${source.url}`, content_type: input.sourceType === "marketplace_product" ? "marketplace_product" : "opportunity", media: source.image ? [{ path: source.image, mimeType: "image/*", name: source.title }] : [], moderation_status: "published", is_boosted: true, boost_ends_at: input.boostEndsAt, source_type: input.sourceType, source_id: input.sourceId, source_url: source.url, source_title: source.title };
    if (existing) {
      const { error } = await supabase.from("wab_posts").update(payload).eq("id", existing.id);
      return { configured: true as const, published: !error, postId: existing.id, updated: true as const };
    }
    const { data: created, error } = await supabase.from("wab_posts").insert(payload).select("id").single();
    return { configured: true as const, published: !error, postId: created?.id, updated: false as const };
  }

  const db = readWabDB();
  const existing = db.posts.find((post) => post.sourceType === input.sourceType && post.sourceId === input.sourceId);
  if (existing) { existing.isBoosted = true; existing.boostEndsAt = input.boostEndsAt; writeWabDB(db); return { configured: false as const, published: true as const, postId: existing.id, updated: true as const }; }
  return { configured: false as const, published: false as const, reason: "supabase_not_configured" as const };
}

export async function activateCrowdfundingBoostByPayment(paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, activated: false as const };
  const now = new Date();
  const { data: boost, error } = await supabase.from("crowdfunding_boosts").update({ status: "active", starts_at: now.toISOString() }).eq("provider_payment_id", paymentId).in("status", ["pending", "active"]).select("id,project_id,user_id,duration_days,status").maybeSingle();
  if (error || !boost) return { configured: true as const, activated: false as const, error };
  const endsAt = new Date(now.getTime() + Number(boost.duration_days || 7) * 86400000).toISOString();
  await supabase.from("crowdfunding_boosts").update({ ends_at: endsAt }).eq("id", boost.id);
  const publication = await publishBoostedSourceToWab({ sourceType: "crowdfunding_project", sourceId: boost.project_id, userId: boost.user_id, boostEndsAt: endsAt });
  return { configured: true as const, activated: true as const, published: publication.published, postId: publication.postId };
}

export async function activateMarketplaceBoostByPayment(paymentId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { configured: false as const, activated: false as const };
  const now = new Date();
  const { data: boost, error } = await supabase.from("marketplace_boosts").update({ status: "active", starts_at: now.toISOString() }).eq("provider_payment_id", paymentId).in("status", ["pending", "active"]).select("id,product_id,supplier_id,duration_days,status").maybeSingle();
  if (error || !boost) return { configured: true as const, activated: false as const, error };
  const endsAt = new Date(now.getTime() + Number(boost.duration_days || 7) * 86400000).toISOString();
  await supabase.from("marketplace_boosts").update({ ends_at: endsAt }).eq("id", boost.id);
  const { data: supplier } = await supabase.from("marketplace_suppliers").select("user_id").eq("id", boost.supplier_id).maybeSingle();
  if (!supplier?.user_id) return { configured: true as const, activated: true as const, published: false as const };
  await supabase.from("marketplace_products").update({ is_boosted: true, boost_ends_at: endsAt }).eq("id", boost.product_id);
  const publication = await publishBoostedSourceToWab({ sourceType: "marketplace_product", sourceId: boost.product_id, userId: supplier.user_id, boostEndsAt: endsAt });
  return { configured: true as const, activated: true as const, published: publication.published, postId: publication.postId };
}
