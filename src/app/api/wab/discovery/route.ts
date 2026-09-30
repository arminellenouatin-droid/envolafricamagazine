/*
 * Direction Atelier de preuve WAB : découverte réelle, sobre et utile.
 * Ce handler expose uniquement des contenus publiés/actifs et ne renvoie jamais d’e-mail.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readWabDB } from "@/lib/wab-db";
import { generateStoreSlug, generateVendorSlug } from "@/lib/marketplace-slug";

const DISCOVERY_TYPES = [
  "people",
  "reels",
  "pages",
  "groups",
  "certified_sellers",
  "boosted_products",
  "boosted_jobs",
  "boosted_crowdfunding",
  "awards_competitions",
] as const;

type DiscoveryType = (typeof DISCOVERY_TYPES)[number];

function isDiscoveryType(value: string | null): value is DiscoveryType {
  return Boolean(value && DISCOVERY_TYPES.includes(value as DiscoveryType));
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "people";
  if (!isDiscoveryType(type)) return NextResponse.json({ error: "Type de découverte invalide." }, { status: 400 });

  const viewer = await getCurrentUserFromCookie();
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ type, items: [] });

  // 1. REELS
  if (type === "reels") {
    const reels = readWabDB().reels
      .filter((reel) => reel.moderationStatus === "published")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 24)
      .map((reel) => ({
        id: reel.id,
        title: reel.caption || "Reel WAB",
        subtitle: reel.author,
        imageUrl: reel.mediaUrl,
        href: "/wab",
        mediaUrl: reel.mediaUrl,
        views: reel.views || 0,
        likes: reel.likes || 0,
      }));
    return NextResponse.json({ type, items: reels });
  }

  // 2. PEOPLE
  if (type === "people") {
    const { data: connections } = viewer ? await supabase.from("wab_connections").select("profile_id").eq("follower_user_id", viewer.id).limit(500) : { data: [] };
    const followedProfileIds = new Set((connections ?? []).map((item) => item.profile_id));
    const { data, error } = await supabase
      .from("wab_profiles")
      .select("id,user_id,headline,avatar_url,city,country_code,users:user_id(prenom,nom,full_name,avatar)")
      .eq("status", "active")
      .limit(60);
    if (error) return NextResponse.json({ type, items: [] });
    const items = (data ?? [])
      .filter((profile) => profile.user_id !== viewer?.id && !followedProfileIds.has(profile.id))
      .slice(0, 24)
      .map((profile) => {
        const user = Array.isArray(profile.users) ? profile.users[0] : profile.users;
        const name = user?.full_name || [user?.prenom, user?.nom].filter(Boolean).join(" ") || "Membre WAB";
        return {
          id: profile.id,
          title: name,
          subtitle: profile.headline || [profile.city, profile.country_code].filter(Boolean).join(" · ") || "Membre WAB",
          imageUrl: profile.avatar_url || user?.avatar || "",
          href: `/wab/profil?author=${encodeURIComponent(name)}`,
          targetUserId: profile.user_id,
        };
      });
    return NextResponse.json({ type, items });
  }

  // 3. PAGES
  if (type === "pages") {
    const { data, error } = await supabase.from("wab_pages").select("id,name,slug,logo_url,avatar_url,description").eq("status", "active").order("created_at", { ascending: false }).limit(24);
    if (error) return NextResponse.json({ type, items: [] });
    return NextResponse.json({ type, items: (data ?? []).map((page) => ({ id: page.id, title: page.name, subtitle: page.description || "Page WAB", imageUrl: page.logo_url || page.avatar_url || "", href: `/wab/pages/${page.id}`, targetPageId: page.id })) });
  }

  // 4. GROUPS
  if (type === "groups") {
    const { data, error } = await supabase.from("wab_groups").select("id,name,slug,logo_url,avatar_url,description,privacy").eq("status", "active").order("created_at", { ascending: false }).limit(24);
    if (error) return NextResponse.json({ type, items: [] });
    return NextResponse.json({ type, items: (data ?? []).map((group) => ({ id: group.id, title: group.name, subtitle: group.description || (group.privacy === "private" ? "Groupe privé" : "Groupe communautaire"), imageUrl: group.logo_url || group.avatar_url || "", href: `/wab/groupes/${group.id}`, targetGroupId: group.id })) });
  }

  // 5. VENDEURS CERTIFIÉS (MARKETPLACE)
  if (type === "certified_sellers") {
    const { data, error } = await supabase
      .from("marketplace_suppliers")
      .select("id,business_name,logo_url,banner_url,certification_status,rating,city,country_code,description,user_id,users:user_id(prenom,nom,email)")
      .in("certification_status", ["certified", "verified"])
      .order("rating", { ascending: false })
      .limit(24);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ type, items: [] });
    }

    const items = data.map((supplier) => {
      const u = Array.isArray(supplier.users) ? supplier.users[0] : supplier.users;
      const vendorSlug = generateVendorSlug(u);
      const storeSlug = generateStoreSlug(supplier.business_name);
      return {
        id: supplier.id,
        title: supplier.business_name,
        subtitle: [supplier.city, supplier.country_code].filter(Boolean).join(" · ") || supplier.description || "Boutique certifiée",
        imageUrl: supplier.logo_url || "",
        href: `/marketplace/boutique/${vendorSlug}/${storeSlug}`,
        badge: "Vendeur certifié",
        rating: Number(supplier.rating || 0),
        certificationStatus: supplier.certification_status,
      };
    });
    return NextResponse.json({ type, items });
  }

  // 6. PRODUITS SPONSORISÉS / BOOSTÉS (MARKETPLACE)
  if (type === "boosted_products") {
    const { data, error } = await supabase
      .from("marketplace_products")
      .select("id,title,price_xof,currency,media,category,city,country_code,is_boosted,boost_ends_at,supplier:supplier_id(business_name,certification_status)")
      .eq("status", "published")
      .eq("is_boosted", true)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ type, items: [] });
    }

    const items = data.map((prod) => {
      const media = Array.isArray(prod.media) ? prod.media : [];
      const firstImg = typeof media[0] === "string" ? media[0] : (media[0] && typeof media[0] === "object" && "url" in media[0] ? String(media[0].url) : "");
      const supplier = Array.isArray(prod.supplier) ? prod.supplier[0] : prod.supplier;
      return {
        id: prod.id,
        title: prod.title,
        subtitle: `${Number(prod.price_xof || 0).toLocaleString("fr-FR")} ${prod.currency || "XOF"} · ${supplier?.business_name || prod.category || "Marketplace"}`,
        imageUrl: firstImg,
        href: `/marketplace/produits/${prod.id}`,
        badge: "Sponsorisé",
        price: prod.price_xof,
        currency: prod.currency || "XOF",
      };
    });
    return NextResponse.json({ type, items });
  }

  // 7. OFFRES D'EMPLOI SPONSORISÉES (JOBS)
  if (type === "boosted_jobs") {
    const { data, error } = await supabase
      .from("jobs_offers")
      .select("id,title,company_name,company_logo_url,city,country_name,sector,contract_type,salary_text,is_boosted,boost_ends_at")
      .eq("status", "published")
      .eq("is_boosted", true)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ type, items: [] });
    }

    const items = data.map((job) => ({
      id: job.id,
      title: job.title,
      subtitle: `${job.company_name} · ${[job.city, job.country_name].filter(Boolean).join(", ") || job.contract_type || "Offre d'emploi"}`,
      imageUrl: job.company_logo_url || "",
      href: `/emploi/offres/${job.id}`,
      badge: "Offre sponsorisée",
      contractType: job.contract_type,
      company: job.company_name,
    }));
    return NextResponse.json({ type, items });
  }

  // 8. PROJETS CROWDFUNDING EN COURS / SPONSORISÉS
  if (type === "boosted_crowdfunding") {
    const { data, error } = await supabase
      .from("crowdfunding_projects")
      .select("id,nom,secteur,description,images,montant_recherche,montant_collecte,statut,pays")
      .in("statut", ["en_cours", "valide"])
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ type, items: [] });
    }

    const items = data.map((proj) => {
      const images = Array.isArray(proj.images) ? proj.images : [];
      const firstImg = typeof images[0] === "string" ? images[0] : "";
      const pct = proj.montant_recherche > 0 ? Math.round(((proj.montant_collecte || 0) / proj.montant_recherche) * 100) : 0;
      return {
        id: proj.id,
        title: proj.nom,
        subtitle: `${proj.secteur || "Financement"} · ${proj.pays || "Afrique"} · ${pct}% collecté`,
        imageUrl: firstImg,
        href: `/financement/projets/${proj.id}`,
        badge: "Projet en cours",
        fundedPercent: pct,
      };
    });
    return NextResponse.json({ type, items });
  }

  // 9. COMPÉTITIONS AFRICA AWARDS EN COURS / VOTE
  if (type === "awards_competitions") {
    const { data, error } = await supabase
      .from("awards_competitions")
      .select("id,title,slug,description,category,status,legacy_cover_image,starts_at,ends_at")
      .in("status", ["voting_open", "registrations_open", "active", "published", "live"])
      .order("created_at", { ascending: false })
      .limit(24);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ type, items: [] });
    }

    const items = data.map((comp) => {
      const isVoting = comp.status === "voting_open";
      return {
        id: comp.id,
        title: comp.title,
        subtitle: comp.category || comp.description || "Compétition officielle Africa Awards",
        imageUrl: comp.legacy_cover_image || "",
        href: `/africa-awards/competitions/${comp.slug || comp.id}`,
        badge: isVoting ? "Votes ouverts" : "Inscriptions ouvertes",
        status: comp.status,
      };
    });
    return NextResponse.json({ type, items });
  }

  return NextResponse.json({ type, items: [] });
}
